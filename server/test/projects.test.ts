import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/prisma.js";
import {
  createUser,
  disconnect,
  resetDatabase,
  signUpUser,
} from "./helpers.js";

const createProject = async (
  actor: { cookie: string },
  name: string,
): Promise<{ id: number; name: string }> => {
  const res = await request(app)
    .post("/projects")
    .set("Cookie", actor.cookie)
    .send({ name })
    .expect(201);
  return res.body;
};

describe("project access, members, and assignments", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(async () => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await disconnect();
    logSpy.mockRestore();
  });

  it("creates a project and makes the creator its manager", async () => {
    const member = await createUser("MEMBER");
    const project = await createProject(member, "Creator managed");

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: project.id, userId: member.id },
      },
      select: { role: true },
    });
    expect(membership?.role).toBe("MANAGER");

    const access = await request(app)
      .get(`/projects/${project.id}/access`)
      .set("Cookie", member.cookie)
      .expect(200);
    expect(access.body).toEqual({ projectId: project.id, role: "MANAGER" });
  });

  it("refuses project creation to viewers and anonymous callers", async () => {
    const viewer = await createUser("VIEWER");
    const member = await createUser("MEMBER");

    await request(app).post("/projects").send({ name: "Nope" }).expect(401);

    const res = await request(app)
      .post("/projects")
      .set("Cookie", viewer.cookie)
      .send({ name: "Nope" })
      .expect(403);
    expect(res.body.message).toMatch(/permission/i);

    const blank = await request(app)
      .post("/projects")
      .set("Cookie", member.cookie)
      .send({ name: "   " })
      .expect(400);
    expect(blank.body.message).toMatch(/name is required/i);
  });

  it("scopes the project list to the caller", async () => {
    const owner = await createUser("OWNER");
    const alice = await createUser("MEMBER");
    const bob = await createUser("MEMBER");

    const aliceProject = await createProject(alice, "Alice project");
    const bobProject = await createProject(bob, "Bob project");

    const aliceList = await request(app)
      .get("/projects")
      .set("Cookie", alice.cookie)
      .expect(200);
    const aliceIds = aliceList.body.map((entry: { id: number }) => entry.id);
    expect(aliceIds).toContain(aliceProject.id);
    expect(aliceIds).not.toContain(bobProject.id);

    const ownerList = await request(app)
      .get("/projects")
      .set("Cookie", owner.cookie)
      .expect(200);
    const ownerIds = ownerList.body.map((entry: { id: number }) => entry.id);
    expect(ownerIds).toEqual(
      expect.arrayContaining([aliceProject.id, bobProject.id]),
    );
  });

  it("hides a project from non-members with a 404", async () => {
    const alice = await createUser("MEMBER");
    const bob = await createUser("MEMBER");
    const project = await createProject(alice, "Private project");

    await request(app)
      .get(`/projects/${project.id}/access`)
      .set("Cookie", bob.cookie)
      .expect(404);

    await request(app)
      .get(`/projects/${project.id}/members`)
      .set("Cookie", bob.cookie)
      .expect(404);

    await request(app)
      .get(`/tasks?projectId=${project.id}`)
      .set("Cookie", bob.cookie)
      .expect(404);

    const tasks = await request(app)
      .get("/tasks")
      .set("Cookie", bob.cookie)
      .expect(200);
    expect(tasks.body).toEqual([]);
  });

  it("lets managers add, promote, and remove project members", async () => {
    const manager = await createUser("MEMBER");
    const teammate = await signUpUser();
    const project = await createProject(manager, "Member management");

    const added = await request(app)
      .put(`/projects/${project.id}/members/${teammate.id}`)
      .set("Cookie", manager.cookie)
      .send({ role: "CONTRIBUTOR" })
      .expect(200);
    expect(added.body).toMatchObject({
      id: teammate.id,
      role: "CONTRIBUTOR",
    });

    const promoted = await request(app)
      .put(`/projects/${project.id}/members/${teammate.id}`)
      .set("Cookie", manager.cookie)
      .send({ role: "MANAGER" })
      .expect(200);
    expect(promoted.body.role).toBe("MANAGER");

    const members = await request(app)
      .get(`/projects/${project.id}/members`)
      .set("Cookie", teammate.cookie)
      .expect(200);
    expect(members.body.myRole).toBe("MANAGER");
    expect(
      members.body.members.map((entry: { id: number }) => entry.id),
    ).toEqual(expect.arrayContaining([manager.id, teammate.id]));
  });

  it("never removes or demotes the last project manager", async () => {
    const manager = await createUser("MEMBER");
    const project = await createProject(manager, "Last manager");

    const demote = await request(app)
      .put(`/projects/${project.id}/members/${manager.id}`)
      .set("Cookie", manager.cookie)
      .send({ role: "CONTRIBUTOR" })
      .expect(409);
    expect(demote.body.message).toMatch(/at least one manager/i);

    const remove = await request(app)
      .delete(`/projects/${project.id}/members/${manager.id}`)
      .set("Cookie", manager.cookie)
      .expect(409);
    expect(remove.body.message).toMatch(/at least one manager/i);
  });

  it("blocks contributors and viewers from managing project members", async () => {
    const manager = await createUser("MEMBER");
    const contributor = await signUpUser();
    const outsider = await signUpUser();
    const project = await createProject(manager, "Rank checks");

    await request(app)
      .put(`/projects/${project.id}/members/${contributor.id}`)
      .set("Cookie", manager.cookie)
      .send({ role: "CONTRIBUTOR" })
      .expect(200);

    await request(app)
      .put(`/projects/${project.id}/members/${outsider.id}`)
      .set("Cookie", contributor.cookie)
      .send({ role: "VIEWER" })
      .expect(403);

    await request(app)
      .delete(`/projects/${project.id}/members/${contributor.id}`)
      .set("Cookie", contributor.cookie)
      .expect(403);
  });

  it("requires assignees to be active project members", async () => {
    const manager = await createUser("MEMBER");
    const contributor = await signUpUser();
    const outsider = await signUpUser();
    const project = await createProject(manager, "Assignment rules");

    await request(app)
      .put(`/projects/${project.id}/members/${contributor.id}`)
      .set("Cookie", manager.cookie)
      .send({ role: "CONTRIBUTOR" })
      .expect(200);

    const assigned = await request(app)
      .post("/tasks")
      .set("Cookie", manager.cookie)
      .send({
        title: "Write the brief",
        projectId: project.id,
        assignedUserId: contributor.id,
      })
      .expect(201);
    expect(assigned.body.assignee.id).toBe(contributor.id);

    const outsiderAssignment = await request(app)
      .post("/tasks")
      .set("Cookie", manager.cookie)
      .send({
        title: "Impossible assignment",
        projectId: project.id,
        assignedUserId: outsider.id,
      })
      .expect(422);
    expect(outsiderAssignment.body.message).toMatch(/active member/i);

    await prisma.user.update({
      where: { id: contributor.id },
      data: { deactivatedAt: new Date() },
    });

    await request(app)
      .post("/tasks")
      .set("Cookie", manager.cookie)
      .send({
        title: "Deactivated assignment",
        projectId: project.id,
        assignedUserId: contributor.id,
      })
      .expect(422);

    const members = await request(app)
      .get(`/projects/${project.id}/members`)
      .set("Cookie", manager.cookie)
      .expect(200);
    expect(
      members.body.members.map((entry: { id: number }) => entry.id),
    ).not.toContain(contributor.id);
  });

  it("lets owners and admins bypass project membership", async () => {
    const manager = await createUser("MEMBER");
    const owner = await createUser("OWNER");

    const created = await createProject(manager, "Admin bypass");

    const access = await request(app)
      .get(`/projects/${created.id}/access`)
      .set("Cookie", owner.cookie)
      .expect(200);
    expect(access.body).toEqual({ projectId: created.id, role: "MANAGER" });

    await request(app)
      .post("/tasks")
      .set("Cookie", owner.cookie)
      .send({ title: "Owner task", projectId: created.id })
      .expect(201);
  });

  it("deletes a project and its tasks, but only for a manager", async () => {
    const manager = await createUser("MEMBER");
    const contributor = await signUpUser();
    const project = await createProject(manager, "Fragile project");

    await request(app)
      .put(`/projects/${project.id}/members/${contributor.id}`)
      .set("Cookie", manager.cookie)
      .send({ role: "CONTRIBUTOR" })
      .expect(200);

    await request(app)
      .post("/tasks")
      .set("Cookie", manager.cookie)
      .send({ title: "Doomed task", projectId: project.id })
      .expect(201);

    await request(app)
      .delete(`/projects/${project.id}`)
      .set("Cookie", contributor.cookie)
      .expect(403);

    await request(app)
      .delete(`/projects/${project.id}`)
      .set("Cookie", manager.cookie)
      .expect(200);

    expect(
      await prisma.task.count({ where: { projectId: project.id } }),
    ).toBe(0);
    expect(
      await prisma.project.count({ where: { id: project.id } }),
    ).toBe(0);
  });
});
