import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "../prisma.js";
import { inviteEmail } from "../lib/emails.js";
import { isMailerConfigured, sendMail } from "../lib/mailer.js";
import { memberUserSelect } from "../lib/access.js";
import { currentUser } from "../middleware/auth.js";
import type { InvitationCreateInput } from "../validation/schemas.js";

/** Invitation links are single-use secrets; only their digest is stored. */
const INVITATION_TTL_DAYS = 7;

const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

const newToken = (): string => randomBytes(32).toString("base64url");

const clientOrigin = (): string =>
  (process.env.CLIENT_ORIGIN ?? process.env.BETTER_AUTH_URL ?? "")
    .trim()
    .replace(/\/+$/, "");

const inviteUrlFor = (token: string): string =>
  `${clientOrigin()}/invite/${token}`;

const displayDate = (date: Date): string =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

/** `a***@example.com` — shown in the UI while the full address stays private. */
const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split("@");
  const local = localPart ?? "";
  if (!domain) return "***";

  const visible = local.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(3, local.length - 1))}@${domain}`;
};

/** Express 5 types route params as `string | string[] | undefined`. */
const tokenFrom = (req: Request): string => {
  const value = req.params.token;
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
};

const invitationInclude = {
  invitedBy: { select: { username: true } },
  projects: {
    select: {
      projectId: true,
      role: true,
      project: { select: { name: true } },
    },
  },
} as const;

type InvitationRow = {
  id: number;
  email: string;
  role: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  invitedBy: { username: string };
  projects: Array<{
    projectId: number;
    role: string;
    project: { name: string };
  }>;
};

const serialise = (invitation: InvitationRow, token?: string) => ({
  id: invitation.id,
  email: invitation.email,
  maskedEmail: maskEmail(invitation.email),
  role: invitation.role,
  status: invitation.acceptedAt
    ? "accepted"
    : invitation.revokedAt
      ? "revoked"
      : invitation.expiresAt.getTime() <= Date.now()
        ? "expired"
        : "pending",
  expiresAt: invitation.expiresAt,
  acceptedAt: invitation.acceptedAt,
  revokedAt: invitation.revokedAt,
  createdAt: invitation.createdAt,
  invitedBy: invitation.invitedBy.username,
  projects: invitation.projects.map((entry) => ({
    projectId: entry.projectId,
    name: entry.project.name,
    role: entry.role,
  })),
  ...(token ? { inviteUrl: inviteUrlFor(token) } : {}),
});

/** Finds a usable invitation by raw token, or describes why it is unusable. */
const resolveInvitation = async (rawToken: string) => {
  if (!rawToken || rawToken.length < 20 || rawToken.length > 200) {
    return { invitation: null, failure: "missing" as const };
  }

  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: invitationInclude,
  });

  if (!invitation) return { invitation: null, failure: "missing" as const };
  if (invitation.revokedAt !== null) {
    return { invitation, failure: "revoked" as const };
  }
  if (invitation.acceptedAt !== null) {
    return { invitation, failure: "accepted" as const };
  }
  if (invitation.expiresAt.getTime() <= Date.now()) {
    return { invitation, failure: "expired" as const };
  }

  return { invitation, failure: null };
};

const failureResponse = (
  res: Response,
  failure: "missing" | "revoked" | "accepted" | "expired",
): void => {
  switch (failure) {
    case "revoked":
      res
        .status(410)
        .json({ message: "This invite has been revoked. Ask for a new one." });
      return;
    case "expired":
      res
        .status(410)
        .json({ message: "This invite has expired. Ask for a new one." });
      return;
    case "accepted":
      res.status(409).json({
        message: "This invitation has already been accepted. Sign in instead.",
      });
      return;
    default:
      res.status(404).json({ message: "This invitation link is not valid." });
  }
};

/**
 * Creates a pending invitation. Owners and admins only; the route guard has
 * already enforced that. Returns the link so an admin can copy it even when
 * SMTP is not configured.
 */
export const createInvitation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const actor = currentUser(res);
  const { email, role, projects } = req.body as InvitationCreateInput;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, deactivatedAt: true },
    });

    if (existingUser && existingUser.deactivatedAt === null) {
      res
        .status(409)
        .json({ message: "That email already belongs to a workspace member" });
      return;
    }

    const pending = await prisma.invitation.findFirst({
      where: {
        email,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, expiresAt: true },
    });

    if (pending) {
      res.status(409).json({
        message:
          "An invitation is already pending for that email. Resend or revoke it instead.",
      });
      return;
    }

    const requestedProjectIds = Array.from(
      new Set(projects.map((project) => project.projectId)),
    );

    if (requestedProjectIds.length > 0) {
      const found = await prisma.project.findMany({
        where: { id: { in: requestedProjectIds } },
        select: { id: true },
      });

      if (found.length !== requestedProjectIds.length) {
        res.status(400).json({ message: "One of the projects does not exist" });
        return;
      }
    }

    const token = newToken();
    const expiresAt = new Date(
      Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    // Collapse duplicate project entries, keeping the highest requested role.
    const roleRank = { VIEWER: 0, CONTRIBUTOR: 1, MANAGER: 2 } as const;
    const projectRoles = new Map<number, "MANAGER" | "CONTRIBUTOR" | "VIEWER">();

    projects.forEach((project) => {
      const current = projectRoles.get(project.projectId);
      if (!current || roleRank[project.role] > roleRank[current]) {
        projectRoles.set(project.projectId, project.role);
      }
    });

    const invitation = await prisma.invitation.create({
      data: {
        email,
        role,
        tokenHash: hashToken(token),
        invitedById: actor.id,
        expiresAt,
        projects: {
          create: Array.from(projectRoles.entries()).map(
            ([projectId, projectRole]) => ({
              projectId,
              role: projectRole,
            }),
          ),
        },
      },
      include: invitationInclude,
    });

    const delivered = await sendMail(
      inviteEmail({
        to: email,
        inviterName: actor.username,
        role,
        projects: invitation.projects.map((entry) => entry.project.name),
        inviteUrl: inviteUrlFor(token),
        expiresOn: displayDate(expiresAt),
      }),
    );

    res.status(201).json({
      ...serialise(invitation, token),
      emailDelivered: delivered,
      mailerConfigured: isMailerConfigured,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: `Error creating the invitation: ${message}` });
  }
};

/** Pending invitations by default; `?status=all` includes history. */
export const listInvitations = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const includeHistory = req.query.status === "all";

  try {
    const invitations = await prisma.invitation.findMany({
      where: includeHistory ? {} : { acceptedAt: null, revokedAt: null },
      include: invitationInclude,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    res.json(
      invitations
        .filter((invitation) => includeHistory || invitation.expiresAt > new Date())
        .map((invitation) => serialise(invitation)),
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: `Error retrieving invitations: ${message}` });
  }
};

/** Issues a fresh token for a still-pending invitation; the old link dies. */
export const resendInvitation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const actor = currentUser(res);
  const invitationId = Number(req.params.invitationId);

  if (!Number.isInteger(invitationId) || invitationId <= 0) {
    res.status(400).json({ message: "Invalid invitation id" });
    return;
  }

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: invitationInclude,
    });

    if (!invitation) {
      res.status(404).json({ message: "Invitation not found" });
      return;
    }

    if (invitation.acceptedAt !== null) {
      res.status(409).json({ message: "That invitation was already accepted" });
      return;
    }

    if (invitation.revokedAt !== null) {
      res.status(409).json({
        message: "That invitation was revoked. Create a new one instead.",
      });
    }

    const token = newToken();
    const expiresAt = new Date(
      Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    const updated = await prisma.invitation.update({
      where: { id: invitationId },
      data: { tokenHash: hashToken(token), expiresAt, revokedAt: null },
      include: invitationInclude,
    });

    const delivered = await sendMail(
      inviteEmail({
        to: updated.email,
        inviterName: actor.username,
        role: updated.role,
        projects: updated.projects.map((entry) => entry.project.name),
        inviteUrl: inviteUrlFor(token),
        expiresOn: displayDate(expiresAt),
      }),
    );

    res.json({
      ...serialise(updated, token),
      emailDelivered: delivered,
      mailerConfigured: isMailerConfigured,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: `Error resending the invitation: ${message}` });
  }
};

export const revokeInvitation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const invitationId = Number(req.params.invitationId);

  if (!Number.isInteger(invitationId) || invitationId <= 0) {
    res.status(400).json({ message: "Invalid invitation id" });
    return;
  }

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      select: { id: true, acceptedAt: true, revokedAt: true },
    });

    if (!invitation) {
      res.status(404).json({ message: "Invitation not found" });
      return;
    }

    if (invitation.acceptedAt !== null) {
      res.status(409).json({ message: "That invitation was already accepted" });
      return;
    }

    if (invitation.revokedAt === null) {
      await prisma.invitation.update({
        where: { id: invitationId },
        data: { revokedAt: new Date() },
      });
    }

    res.json({ message: "Invitation revoked", id: invitationId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: `Error revoking the invitation: ${message}` });
  }
};

/**
 * Public preview for `/invite/[token]`. Returns the invited email because the
 * token holder needs it to create the matching account; it is displayed masked
 * in the UI. No token is ever echoed back.
 */
export const getInvitationPreview = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { invitation, failure } = await resolveInvitation(tokenFrom(req));

    if (failure || !invitation) {
      failureResponse(res, failure ?? "missing");
      return;
    }

    res.json({
      invitation: {
        email: invitation.email,
        maskedEmail: maskEmail(invitation.email),
        role: invitation.role,
        inviterName: invitation.invitedBy.username,
        expiresAt: invitation.expiresAt,
        workspaceName: "BluePrint",
        projects: invitation.projects.map((entry) => ({
          projectId: entry.projectId,
          name: entry.project.name,
          role: entry.role,
        })),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: `Error retrieving the invitation: ${message}` });
  }
};

/**
 * Accepts an invitation for the signed-in user. Account creation happens
 * through Better Auth on the client, so by the time this runs there is a real
 * session; the invite only grants workspace and project membership.
 */
export const acceptInvitation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const actor = currentUser(res);

  try {
    const { invitation, failure } = await resolveInvitation(tokenFrom(req));

    if (failure || !invitation) {
      failureResponse(res, failure ?? "missing");
      return;
    }

    const invitedEmail = invitation.email.toLowerCase();

    // Constant-time comparison is unnecessary for a public value, but keeping
    // the check case-insensitive avoids failing on a capitalised signup.
    if (actor.email.toLowerCase() !== invitedEmail) {
      res.status(403).json({
        message: `Sign in with ${invitation.email} to accept this invitation.`,
      });
      return;
    }

    const rank = { VIEWER: 0, MEMBER: 1, ADMIN: 2, OWNER: 3 } as const;
    const nextRole =
      rank[invitation.role as keyof typeof rank] > rank[actor.role]
        ? (invitation.role as keyof typeof rank)
        : actor.role;

    const projectIds = invitation.projects.map((entry) => entry.projectId);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: actor.id },
        data: {
          role: nextRole,
          emailVerified: true,
          // A deactivated account that accepts a fresh invite is restored.
          deactivatedAt: null,
        },
      });

      for (const entry of invitation.projects) {
        await tx.projectMember.upsert({
          where: {
            projectId_userId: {
              projectId: entry.projectId,
              userId: actor.id,
            },
          },
          // Never downgrade an existing membership.
          update: {},
          create: {
            projectId: entry.projectId,
            userId: actor.id,
            role: entry.role,
          },
        });
      }

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
    });

    const member = await prisma.user.findUnique({
      where: { id: actor.id },
      select: memberUserSelect,
    });

    res.json({
      message: "Invitation accepted",
      user: member,
      projectIds,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: `Error accepting the invitation: ${message}` });
  }
};

/**
 * Exposed for tests: compares a raw token with a stored digest without leaking
 * timing information. Not used by the routes above, which use `resolveInvitation`.
 */
export const tokenMatches = (rawToken: string, storedHash: string): boolean => {
  const digest = Buffer.from(hashToken(rawToken), "hex");
  const stored = Buffer.from(storedHash, "hex");

  return digest.length === stored.length && timingSafeEqual(digest, stored);
};
