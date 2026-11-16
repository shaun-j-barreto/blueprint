import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/prisma.js";
import {
  createUser,
  disconnect,
  resetDatabase,
  setRole,
  signUpUser,
} from "./helpers.js";

const cookie = (user: { cookie: string }) => user.cookie;

describe("workspace members and roles", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await disconnect();
  });

  it("lets an owner grant and revoke the admin role", async () => {
    const owner = await createUser("OWNER");
    const member = await signUpUser();

    const promoted = await request(app)
      .patch(`/workspace/members/${member.id}`)
      .set("Cookie", cookie(owner))
      .send({ role: "ADMIN" })
      .expect(200);
    expect(promoted.body).toMatchObject({ id: member.id, role: "ADMIN" });

    const demoted = await request(app)
      .patch(`/workspace/members/${member.id}`)
      .set("Cookie", cookie(owner))
      .send({ role: "VIEWER" })
      .expect(200);
    expect(demoted.body).toMatchObject({ id: member.id, role: "VIEWER" });
  });

  it("lets an admin change ordinary members but not ownership", async () => {
    const owner = await createUser("OWNER");
    const admin = await createUser("ADMIN");
    const member = await signUpUser();

    const updated = await request(app)
      .patch(`/workspace/members/${member.id}`)
      .set("Cookie", cookie(admin))
      .send({ role: "VIEWER" })
      .expect(200);
    expect(updated.body.role).toBe("VIEWER");

    const promoteToOwner = await request(app)
      .patch(`/workspace/members/${member.id}`)
      .set("Cookie", cookie(admin))
      .send({ role: "OWNER" })
      .expect(403);
    expect(promoteToOwner.body.message).toMatch(/owner/i);

    const demoteOwner = await request(app)
      .patch(`/workspace/members/${owner.id}`)
      .set("Cookie", cookie(admin))
      .send({ role: "MEMBER" })
      .expect(403);
    expect(demoteOwner.body.message).toMatch(/owner/i);

    const demoteAdmin = await request(app)
      .patch(`/workspace/members/${admin.id}`)
      .set("Cookie", cookie(admin))
      .send({ role: "MEMBER" })
      .expect(400);
    expect(demoteAdmin.body.message).toMatch(/own role/i);
  });

  it("lets an owner transfer ownership", async () => {
    const owner = await createUser("OWNER");
    const member = await signUpUser();

    await request(app)
      .patch(`/workspace/members/${member.id}`)
      .set("Cookie", cookie(owner))
      .send({ role: "OWNER" })
      .expect(200);

    const fresh = await prisma.user.findUnique({
      where: { id: member.id },
      select: { role: true },
    });
    expect(fresh?.role).toBe("OWNER");
  });

  it("blocks plain members from managing the roster", async () => {
    const member = await createUser("MEMBER");
    const target = await signUpUser();

    await request(app)
      .patch(`/workspace/members/${target.id}`)
      .set("Cookie", cookie(member))
      .send({ role: "ADMIN" })
      .expect(403);

    await request(app)
      .delete(`/workspace/members/${target.id}`)
      .set("Cookie", cookie(member))
      .expect(403);
  });

  it("rejects invalid roles and unknown members", async () => {
    const owner = await createUser("OWNER");
    const member = await signUpUser();

    const invalidRole = await request(app)
      .patch(`/workspace/members/${member.id}`)
      .set("Cookie", cookie(owner))
      .send({ role: "SUPERUSER" })
      .expect(400);
    expect(invalidRole.body.message).toBe("Invalid request");

    await request(app)
      .patch("/workspace/members/999999")
      .set("Cookie", cookie(owner))
      .send({ role: "ADMIN" })
      .expect(404);

    await request(app)
      .patch("/workspace/members/not-a-number")
      .set("Cookie", cookie(owner))
      .send({ role: "ADMIN" })
      .expect(400);
  });

  it("deactivates a member, purges their sessions, and can restore them", async () => {
    const owner = await createUser("OWNER");
    const member = await signUpUser();

    const removed = await request(app)
      .delete(`/workspace/members/${member.id}`)
      .set("Cookie", cookie(owner))
      .expect(200);
    expect(removed.body).toMatchObject({ id: member.id });

    const sessions = await prisma.session.count({
      where: { userId: member.id },
    });
    expect(sessions).toBe(0);

    const members = await request(app)
      .get("/workspace/members")
      .set("Cookie", cookie(owner))
      .expect(200);
    expect(
      members.body.some((entry: { id: number }) => entry.id === member.id),
    ).toBe(false);

    // The old cookie is dead, and the guard rejects the account outright.
    await request(app)
      .get("/auth/me")
      .set("Cookie", cookie(member))
      .expect(401);

    const restored = await request(app)
      .post(`/workspace/members/${member.id}/reactivate`)
      .set("Cookie", cookie(owner))
      .expect(200);
    expect(restored.body.deactivatedAt).toBeNull();

    // Restored access requires a fresh sign-in.
    const signIn = await request(app)
      .post("/api/auth/sign-in/email")
      .send({ email: member.email, password: member.password })
      .expect(200);
    const rawCookie = signIn.headers["set-cookie"];
    const freshCookie = Array.isArray(rawCookie)
      ? rawCookie.map((header) => header.split(";")[0]).join("; ")
      : (rawCookie ?? "").split(";")[0];

    const me = await request(app)
      .get("/auth/me")
      .set("Cookie", freshCookie ?? "")
      .expect(200);
    expect(me.body.user.id).toBe(member.id);
  });

  it("prevents deactivating yourself or an owner above your rank", async () => {
    const owner = await createUser("OWNER");
    const admin = await createUser("ADMIN");

    const self = await request(app)
      .delete(`/workspace/members/${owner.id}`)
      .set("Cookie", cookie(owner))
      .expect(400);
    expect(self.body.message).toMatch(/own account/i);

    const ownerTarget = await request(app)
      .delete(`/workspace/members/${owner.id}`)
      .set("Cookie", cookie(admin))
      .expect(403);
    expect(ownerTarget.body.message).toMatch(/owner/i);
  });

  it("returns 'already active' when reactivating a live member", async () => {
    const owner = await createUser("OWNER");
    const member = await signUpUser();

    const res = await request(app)
      .post(`/workspace/members/${member.id}/reactivate`)
      .set("Cookie", cookie(owner))
      .expect(200);
    expect(res.body.message).toMatch(/already active/i);
  });

  it("ignores a stale role write once the member was deactivated", async () => {
    const owner = await createUser("OWNER");
    const member = await signUpUser();
    await setRole(member.id, "MEMBER");
    await prisma.user.update({
      where: { id: member.id },
      data: { deactivatedAt: new Date() },
    });

    await request(app)
      .patch(`/workspace/members/${member.id}`)
      .set("Cookie", cookie(owner))
      .send({ role: "ADMIN" })
      .expect(404);
  });
});
