import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/prisma.js";
import {
  addProjectMember,
  createProjectRow,
  createUser,
  disconnect,
  resetDatabase,
  signUpUser,
} from "./helpers.js";

const tokenFrom = (inviteUrl: string): string => {
  const token = new URL(inviteUrl).pathname.split("/").filter(Boolean).pop();
  if (!token) throw new Error(`No token in ${inviteUrl}`);
  return token;
};

const createInvitation = async (
  actor: { cookie: string },
  body: Record<string, unknown>,
) => {
  const res = await request(app)
    .post("/invitations")
    .set("Cookie", actor.cookie)
    .send(body)
    .expect(201);

  return { body: res.body, token: tokenFrom(res.body.inviteUrl) };
};

describe("workspace invitations", () => {
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

  it("creates a pending invitation with hashed token and project access", async () => {
    const admin = await createUser("ADMIN");
    const project = await createProjectRow("Invite project");
    const email = "invitee@example.test";

    const { body, token } = await createInvitation(admin, {
      email,
      role: "MEMBER",
      projects: [{ projectId: project.id, role: "CONTRIBUTOR" }],
    });

    expect(body).toMatchObject({
      email,
      maskedEmail: "i******@example.test",
      role: "MEMBER",
      status: "pending",
      emailDelivered: false,
      mailerConfigured: false,
      projects: [
        { projectId: project.id, name: project.name, role: "CONTRIBUTOR" },
      ],
    });
    expect(body.inviteUrl).toContain(`/invite/${token}`);

    const row = await prisma.invitation.findUnique({
      where: { id: body.id },
      select: { tokenHash: true },
    });
    expect(row?.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(row?.tokenHash).not.toBe(token);
  });

  it("normalises uppercase emails and collapses duplicate projects", async () => {
    const owner = await createUser("OWNER");
    const project = await createProjectRow("Role rank");

    const { body } = await createInvitation(owner, {
      email: "Mixed.Case@Example.Test",
      role: "ADMIN",
      projects: [
        { projectId: project.id, role: "VIEWER" },
        { projectId: project.id, role: "MANAGER" },
      ],
    });

    expect(body.email).toBe("mixed.case@example.test");
    expect(body.role).toBe("ADMIN");
    expect(body.projects).toHaveLength(1);
    expect(body.projects[0].role).toBe("MANAGER");
  });

  it("rejects invitations for existing members and duplicate pending invites", async () => {
    const owner = await createUser("OWNER");
    const member = await signUpUser();

    const existing = await request(app)
      .post("/invitations")
      .set("Cookie", owner.cookie)
      .send({ email: member.email })
      .expect(409);
    expect(existing.body.message).toMatch(/already belongs/i);

    await createInvitation(owner, { email: "pending@example.test" });

    const duplicate = await request(app)
      .post("/invitations")
      .set("Cookie", owner.cookie)
      .send({ email: "pending@example.test" })
      .expect(409);
    expect(duplicate.body.message).toMatch(/already pending/i);
  });

  it("validates the role, project ids, and caller rank", async () => {
    const owner = await createUser("OWNER");
    const member = await createUser("MEMBER");

    await request(app)
      .post("/invitations")
      .set("Cookie", owner.cookie)
      .send({ email: "owner-invite@example.test", role: "OWNER" })
      .expect(400);

    const missingProject = await request(app)
      .post("/invitations")
      .set("Cookie", owner.cookie)
      .send({
        email: "missing-project@example.test",
        projects: [{ projectId: 999999, role: "CONTRIBUTOR" }],
      })
      .expect(400);
    expect(missingProject.body.message).toMatch(/does not exist/i);

    await request(app)
      .post("/invitations")
      .set("Cookie", member.cookie)
      .send({ email: "no-rank@example.test" })
      .expect(403);
  });

  it("previews an invitation without echoing the token", async () => {
    const owner = await createUser("OWNER");
    const project = await createProjectRow("Preview project");
    const { body, token } = await createInvitation(owner, {
      email: "preview@example.test",
      projects: [{ projectId: project.id, role: "VIEWER" }],
    });

    const preview = await request(app)
      .get(`/invitations/${token}`)
      .expect(200);

    expect(preview.body.invitation).toMatchObject({
      email: "preview@example.test",
      maskedEmail: "p******@example.test",
      role: "MEMBER",
      inviterName: owner.username,
      workspaceName: "BluePrint",
      projects: [
        { projectId: project.id, name: project.name, role: "VIEWER" },
      ],
    });
    expect(JSON.stringify(preview.body)).not.toContain(token);
    expect(preview.body.invitation).not.toHaveProperty("inviteUrl");
    expect(preview.body.invitation).not.toHaveProperty("tokenHash");

    await request(app).get("/invitations/not-a-real-token").expect(404);
    expect(body.id).toBeTypeOf("number");
  });

  it("accepts an invitation for the matching account", async () => {
    const owner = await createUser("OWNER");
    const project = await createProjectRow("Accept project");
    const email = "accept-me@example.test";
    const { body, token } = await createInvitation(owner, {
      email,
      role: "ADMIN",
      projects: [{ projectId: project.id, role: "CONTRIBUTOR" }],
    });

    const invitee = await signUpUser({ email });

    const accepted = await request(app)
      .post(`/invitations/${token}/accept`)
      .set("Cookie", invitee.cookie)
      .expect(200);

    expect(accepted.body.message).toMatch(/accepted/i);
    expect(accepted.body.projectIds).toEqual([project.id]);
    expect(accepted.body.user).toMatchObject({ id: invitee.id, role: "ADMIN" });

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: project.id, userId: invitee.id },
      },
      select: { role: true },
    });
    expect(membership?.role).toBe("CONTRIBUTOR");

    const stored = await prisma.invitation.findUnique({
      where: { id: body.id },
      select: { acceptedAt: true },
    });
    expect(stored?.acceptedAt).toBeInstanceOf(Date);

    await request(app).get(`/invitations/${token}`).expect(409);
    await request(app)
      .post(`/invitations/${token}/accept`)
      .set("Cookie", invitee.cookie)
      .expect(409);
  });

  it("refuses acceptance from a different account", async () => {
    const owner = await createUser("OWNER");
    const { token } = await createInvitation(owner, {
      email: "intended@example.test",
    });
    const stranger = await signUpUser();

    const res = await request(app)
      .post(`/invitations/${token}/accept`)
      .set("Cookie", stranger.cookie)
      .expect(403);
    expect(res.body.message).toContain("intended@example.test");

    // The invitation is still usable by the right person.
    await request(app).get(`/invitations/${token}`).expect(200);
  });

  it("never downgrades the account or an existing project role", async () => {
    const owner = await createUser("OWNER");
    const project = await createProjectRow("Downgrade project");
    const email = "existing-owner@example.test";

    // The invitation is issued before the account exists; the account is then
    // promoted past the invited role and given a stronger project membership.
    const { token } = await createInvitation(owner, {
      email,
      role: "ADMIN",
      projects: [{ projectId: project.id, role: "VIEWER" }],
    });

    const invitee = await signUpUser({ email });
    await prisma.user.update({
      where: { id: invitee.id },
      data: { role: "OWNER" },
    });
    await addProjectMember(project.id, invitee.id, "MANAGER");

    await request(app)
      .post(`/invitations/${token}/accept`)
      .set("Cookie", invitee.cookie)
      .expect(200);

    const user = await prisma.user.findUnique({
      where: { id: invitee.id },
      select: { role: true },
    });
    expect(user?.role).toBe("OWNER");

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: project.id, userId: invitee.id },
      },
      select: { role: true },
    });
    expect(membership?.role).toBe("MANAGER");
  });

  it("revokes an invitation and makes the link unusable", async () => {
    const owner = await createUser("OWNER");
    const { body, token } = await createInvitation(owner, {
      email: "revoke-me@example.test",
    });

    await request(app)
      .delete(`/invitations/${body.id}`)
      .set("Cookie", owner.cookie)
      .expect(200);

    const preview = await request(app)
      .get(`/invitations/${token}`)
      .expect(410);
    expect(preview.body.message).toMatch(/revoked/i);

    // Revoking twice is harmless.
    await request(app)
      .delete(`/invitations/${body.id}`)
      .set("Cookie", owner.cookie)
      .expect(200);

    const resend = await request(app)
      .post(`/invitations/${body.id}/resend`)
      .set("Cookie", owner.cookie)
      .expect(409);
    expect(resend.body.message).toMatch(/revoked/i);
  });

  it("rotates the token on resend and accepts only the newest link", async () => {
    const owner = await createUser("OWNER");
    const { body, token: oldToken } = await createInvitation(owner, {
      email: "resend@example.test",
    });

    const resend = await request(app)
      .post(`/invitations/${body.id}/resend`)
      .set("Cookie", owner.cookie)
      .expect(200);

    const newToken = tokenFrom(resend.body.inviteUrl);
    expect(newToken).not.toBe(oldToken);

    // The previous link no longer matches any digest.
    await request(app).get(`/invitations/${oldToken}`).expect(404);
    await request(app).get(`/invitations/${newToken}`).expect(200);

    // Resending an accepted invite is rejected.
    const invitee = await signUpUser({ email: "resend@example.test" });
    await request(app)
      .post(`/invitations/${newToken}/accept`)
      .set("Cookie", invitee.cookie)
      .expect(200);

    await request(app)
      .post(`/invitations/${body.id}/resend`)
      .set("Cookie", owner.cookie)
      .expect(409);
  });

  it("expires invitations after their deadline", async () => {
    const owner = await createUser("OWNER");
    const { body, token } = await createInvitation(owner, {
      email: "expired@example.test",
    });

    await prisma.invitation.update({
      where: { id: body.id },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });

    const preview = await request(app)
      .get(`/invitations/${token}`)
      .expect(410);
    expect(preview.body.message).toMatch(/expired/i);

    const invitee = await signUpUser({ email: "expired@example.test" });
    await request(app)
      .post(`/invitations/${token}/accept`)
      .set("Cookie", invitee.cookie)
      .expect(410);
  });

  it("lists only usable invitations by default and history on demand", async () => {
    const owner = await createUser("OWNER");
    const pending = await createInvitation(owner, {
      email: "listed@example.test",
    });
    const revoked = await createInvitation(owner, {
      email: "listed-revoked@example.test",
    });
    await request(app)
      .delete(`/invitations/${revoked.body.id}`)
      .set("Cookie", owner.cookie)
      .expect(200);

    const current = await request(app)
      .get("/invitations")
      .set("Cookie", owner.cookie)
      .expect(200);
    const ids = current.body.map((entry: { id: number }) => entry.id);
    expect(ids).toContain(pending.body.id);
    expect(ids).not.toContain(revoked.body.id);
    expect(
      current.body.find((entry: { id: number }) => entry.id === pending.body.id),
    ).not.toHaveProperty("inviteUrl");

    const history = await request(app)
      .get("/invitations?status=all")
      .set("Cookie", owner.cookie)
      .expect(200);
    const historyIds = history.body.map((entry: { id: number }) => entry.id);
    expect(historyIds).toEqual(
      expect.arrayContaining([pending.body.id, revoked.body.id]),
    );
    expect(
      history.body.find(
        (entry: { id: number }) => entry.id === revoked.body.id,
      ),
    ).toMatchObject({ status: "revoked" });
  });
});
