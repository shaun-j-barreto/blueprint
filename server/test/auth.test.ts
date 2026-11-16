import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/prisma.js";
import {
  createUser,
  disconnect,
  resetDatabase,
  signUpUser,
  TEST_PASSWORD,
} from "./helpers.js";

describe("auth guards and onboarding", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await disconnect();
  });

  it("reports database health", async () => {
    const res = await request(app).get("/health").expect(200);
    expect(res.body).toEqual({ status: "ok", db: "up" });
  });

  it("rejects an unauthenticated identity request", async () => {
    const res = await request(app).get("/auth/me").expect(401);
    expect(res.body.message).toBe("Not signed in");
  });

  it("returns the signed-in user without leaking secrets", async () => {
    const member = await signUpUser();

    const res = await request(app)
      .get("/auth/me")
      .set("Cookie", member.cookie)
      .expect(200);

    expect(res.body.user).toMatchObject({
      id: member.id,
      email: member.email,
      username: member.username,
      role: "MEMBER",
      onboardedAt: null,
      deactivatedAt: null,
    });
    expect(res.body.user).not.toHaveProperty("password");
    expect(res.body.user).not.toHaveProperty("accounts");
  });

  it("refuses workspace member listings to a plain member", async () => {
    const member = await createUser("MEMBER");
    const res = await request(app)
      .get("/workspace/members")
      .set("Cookie", member.cookie)
      .expect(403);
    expect(res.body.message).toMatch(/permission/i);
  });

  it("lists active members for an owner", async () => {
    const owner = await createUser("OWNER");
    const member = await signUpUser();

    const res = await request(app)
      .get("/workspace/members")
      .set("Cookie", owner.cookie)
      .expect(200);

    const ids = res.body.map((entry: { id: number }) => entry.id);
    expect(ids).toEqual(expect.arrayContaining([owner.id, member.id]));
    expect(
      res.body.find((entry: { id: number }) => entry.id === member.id),
    ).toMatchObject({ email: member.email, role: "MEMBER" });
  });

  it("completes onboarding once and keeps the first completion time", async () => {
    const member = await signUpUser();
    const username = `renamed_${member.id}`;

    const first = await request(app)
      .post("/users/me/onboarding")
      .set("Cookie", member.cookie)
      .send({ username })
      .expect(200);

    expect(first.body).toMatchObject({ id: member.id, username });
    expect(first.body.onboardedAt).toBeTruthy();

    const second = await request(app)
      .post("/users/me/onboarding")
      .set("Cookie", member.cookie)
      .send({ profilePictureUrl: "https://example.test/avatar.png" })
      .expect(200);

    expect(second.body.profilePictureUrl).toBe(
      "https://example.test/avatar.png",
    );
    expect(second.body.onboardedAt).toBe(first.body.onboardedAt);
  });

  it("rejects an invalid or duplicate username during onboarding", async () => {
    const taken = await signUpUser();
    const member = await signUpUser();

    const invalid = await request(app)
      .post("/users/me/onboarding")
      .set("Cookie", member.cookie)
      .send({ username: "not allowed!" })
      .expect(400);
    expect(invalid.body.errors?.[0]?.path).toBe("username");

    const duplicate = await request(app)
      .post("/users/me/onboarding")
      .set("Cookie", member.cookie)
      .send({ username: taken.username })
      .expect(409);
    expect(duplicate.body.message).toMatch(/already taken/i);
  });

  it("updates display fields through the profile endpoint", async () => {
    const member = await signUpUser();
    const username = `profile_${member.id}`;

    const updated = await request(app)
      .patch("/users/me")
      .set("Cookie", member.cookie)
      .send({ username, profilePictureUrl: "" })
      .expect(200);

    expect(updated.body).toMatchObject({
      id: member.id,
      username,
      profilePictureUrl: null,
    });
  });

  it("cannot claim another user's username", async () => {
    const owner = await signUpUser();
    const member = await signUpUser();

    const res = await request(app)
      .patch("/users/me")
      .set("Cookie", member.cookie)
      .send({ username: owner.username })
      .expect(409);

    expect(res.body.message).toMatch(/already taken/i);
  });

  it("signs in with the password created during signup", async () => {
    const member = await signUpUser();

    const res = await request(app)
      .post("/api/auth/sign-in/email")
      .send({ email: member.email, password: TEST_PASSWORD })
      .expect(200);

    expect(res.body.user.email).toBe(member.email);
    expect(res.headers["set-cookie"]?.length).toBeGreaterThan(0);
  });

  it("revokes every session when an account is deactivated", async () => {
    const member = await signUpUser();
    await prisma.user.update({
      where: { id: member.id },
      data: { deactivatedAt: new Date() },
    });

    const res = await request(app)
      .get("/auth/me")
      .set("Cookie", member.cookie)
      .expect(403);
    expect(res.body.message).toMatch(/deactivated/i);

    const sessions = await prisma.session.count({
      where: { userId: member.id },
    });
    expect(sessions).toBe(0);
  });

  it("answers malformed JSON with a 400 instead of a 500", async () => {
    const res = await request(app)
      .post("/users/me/onboarding")
      .set("Content-Type", "application/json")
      .send("{not json")
      .expect(400);
    expect(res.body.message).toMatch(/invalid request body/i);
  });

  it("returns JSON 404 for unknown routes", async () => {
    const res = await request(app).get("/no-such-route").expect(404);
    expect(res.body).toEqual({ message: "Not found" });
  });
});
