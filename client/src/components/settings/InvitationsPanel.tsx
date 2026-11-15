"use client";

import { PROJECT_ROLE_LABELS, ROLE_LABELS } from "@/lib/permissions";
import { getApiErrorMessage } from "@/lib/utils";
import {
  useCreateInvitationMutation,
  useGetInvitationsQuery,
  useGetProjectsQuery,
  useResendInvitationMutation,
  useRevokeInvitationMutation,
  type Invitation,
  type ProjectRole,
} from "@/state/api";
import {
  AlertTriangle,
  Check,
  ClipboardCopy,
  Clock,
  Loader2,
  MailPlus,
  RefreshCw,
  Send,
  Trash2,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

const INVITABLE_ROLES = ["ADMIN", "MEMBER", "VIEWER"] as const;
const PROJECT_ROLES: ProjectRole[] = ["MANAGER", "CONTRIBUTOR", "VIEWER"];

const FIELD_CLASS =
  "border-brand-500 bg-brand-100 text-brand-900 placeholder:text-brand-700/70 h-9 w-full rounded-lg border px-2.5 text-xs transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

const LABEL_CLASS =
  "text-brand-800 mb-1 block text-[11px] font-semibold";

const roleBadgeClass = (role: string): string => {
  switch (role) {
    case "OWNER":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "ADMIN":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "VIEWER":
      return "border-slate-200 bg-slate-50 text-slate-600";
    default:
      return "border-brand-500/70 bg-brand-200 text-brand-700";
  }
};

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const daysUntil = (value: string): number => {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return 0;

  return Math.max(0, Math.ceil((time - Date.now()) / 86_400_000));
};

const CopyLinkButton = ({ url }: { url: string }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this invitation link", url);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="border-brand-500 text-brand-800 hover:bg-brand-300 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-2 text-[11px] font-semibold transition-colors"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
      ) : (
        <ClipboardCopy className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
};

const InvitationRow = ({
  invitation,
  onResend,
  onRevoke,
  isBusy,
}: {
  invitation: Invitation;
  onResend: (invitation: Invitation) => void;
  onRevoke: (invitation: Invitation) => void;
  isBusy: boolean;
}) => {
  const remaining = daysUntil(invitation.expiresAt);
  const isExpired = invitation.status === "expired";

  return (
    <li className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-brand-900 flex flex-wrap items-center gap-1.5 text-sm font-semibold">
          <span className="truncate">{invitation.maskedEmail}</span>
          <span
            className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${roleBadgeClass(
              invitation.role,
            )}`}
          >
            {ROLE_LABELS[invitation.role]}
          </span>
          {isExpired && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700">
              Expired
            </span>
          )}
        </p>

        <p className="text-brand-700 mt-1 text-[11px]">
          Invited by {invitation.invitedBy} · expires {formatDate(invitation.expiresAt)}
          {!isExpired && remaining > 0 ? ` (${remaining}d)` : ""}
        </p>

        {invitation.projects.length > 0 ? (
          <p className="text-brand-700 mt-1 text-[11px]">
            Projects:{" "}
            {invitation.projects
              .map(
                (project) =>
                  `${project.name} (${PROJECT_ROLE_LABELS[project.role]})`,
              )
              .join(", ")}
          </p>
        ) : (
          <p className="text-brand-700 mt-1 text-[11px]">
            No project access included.
          </p>
        )}

        {invitation.inviteUrl && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CopyLinkButton url={invitation.inviteUrl} />
            <span className="text-brand-700 max-w-full truncate text-[10px]">
              {invitation.inviteUrl}
            </span>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => onResend(invitation)}
          disabled={isBusy || invitation.status === "accepted"}
          className="border-brand-500 text-brand-800 hover:bg-brand-300 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-2 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isBusy ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Resend
        </button>
        <button
          type="button"
          onClick={() => onRevoke(invitation)}
          disabled={isBusy}
          title="Revoke invitation"
          aria-label={`Revoke invitation for ${invitation.maskedEmail}`}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
};

const InvitationsPanel = () => {
  const { data: invitations = [], isLoading, isError, refetch } =
    useGetInvitationsQuery();
  const { data: projects = [] } = useGetProjectsQuery();
  const [createInvitation, { isLoading: isCreating }] =
    useCreateInvitationMutation();
  const [resendInvitation, { isLoading: isResending }] =
    useResendInvitationMutation();
  const [revokeInvitation, { isLoading: isRevoking }] =
    useRevokeInvitationMutation();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof INVITABLE_ROLES)[number]>("MEMBER");
  const [selectedProjects, setSelectedProjects] = useState<
    Record<number, ProjectRole | "">
  >({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lastInvite, setLastInvite] = useState<Invitation | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => a.name.localeCompare(b.name)),
    [projects],
  );

  const selectedCount = Object.values(selectedProjects).filter(
    (value) => value !== "",
  ).length;

  const resetForm = () => {
    setEmail("");
    setRole("MEMBER");
    setSelectedProjects({});
  };

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setLastInvite(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Enter the email address to invite.");
      return;
    }

    try {
      const created = await createInvitation({
        email: trimmedEmail,
        role,
        projects: Object.entries(selectedProjects)
          .filter((entry): entry is [string, ProjectRole] => entry[1] !== "")
          .map(([projectId, projectRole]) => ({
            projectId: Number(projectId),
            role: projectRole,
          })),
      }).unwrap();

      setLastInvite(created);
      resetForm();
      setNotice(
        created.emailDelivered
          ? `Invitation emailed to ${created.email}.`
          : `Invitation created for ${created.email}. Copy the link below to share it — email delivery is not configured.`,
      );
    } catch (createError) {
      setError(
        getApiErrorMessage(createError, "Could not create the invitation."),
      );
    }
  };

  const handleResend = async (invitation: Invitation) => {
    setError("");
    setNotice("");
    setBusyId(invitation.id);

    try {
      const updated = await resendInvitation(invitation.id).unwrap();
      setLastInvite(updated);
      setNotice(
        updated.emailDelivered
          ? `A fresh link was emailed to ${updated.email}.`
          : `A fresh link was created for ${updated.email}. The previous link no longer works; copy the new one below.`,
      );
    } catch (resendError) {
      setError(getApiErrorMessage(resendError, "Could not resend that invitation."));
    } finally {
      setBusyId(null);
    }
  };

  const handleRevoke = async (invitation: Invitation) => {
    if (
      !window.confirm(
        `Revoke the invitation for ${invitation.maskedEmail}? The link will stop working immediately.`,
      )
    ) {
      return;
    }

    setError("");
    setNotice("");
    setBusyId(invitation.id);

    try {
      await revokeInvitation(invitation.id).unwrap();
      if (lastInvite?.id === invitation.id) setLastInvite(null);
      setNotice(`The invitation for ${invitation.maskedEmail} was revoked.`);
    } catch (revokeError) {
      setError(getApiErrorMessage(revokeError, "Could not revoke that invitation."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleInvite}
        className="border-brand-500/80 bg-brand-100 rounded-2xl border p-4"
      >
        <div className="flex items-center gap-2">
          <MailPlus className="text-brand-700 h-4 w-4" aria-hidden="true" />
          <h2 className="text-brand-900 text-sm font-semibold">
            Invite a teammate
          </h2>
        </div>
        <p className="text-brand-700 mt-1 text-[11px]">
          They will create their account from the link, then join with the
          access you choose here.
        </p>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
          <div>
            <label htmlFor="invite-email" className={LABEL_CLASS}>
              Email address
            </label>
            <input
              id="invite-email"
              type="email"
              required
              autoComplete="email"
              placeholder="teammate@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isCreating}
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <label htmlFor="invite-role" className={LABEL_CLASS}>
              Workspace role
            </label>
            <select
              id="invite-role"
              value={role}
              onChange={(event) =>
                setRole(event.target.value as (typeof INVITABLE_ROLES)[number])
              }
              disabled={isCreating}
              className={FIELD_CLASS}
            >
              {INVITABLE_ROLES.map((option) => (
                <option key={option} value={option}>
                  {ROLE_LABELS[option]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset className="mt-4">
          <legend className={LABEL_CLASS}>
            Project access{" "}
            <span className="text-brand-700 font-normal">
              (optional{selectedCount > 0 ? ` · ${selectedCount} selected` : ""})
            </span>
          </legend>

          {sortedProjects.length === 0 ? (
            <p className="text-brand-700 text-[11px]">
              No projects yet. You can invite them now and add project access
              later.
            </p>
          ) : (
            <div className="border-brand-500/70 bg-brand-200/50 max-h-56 overflow-y-auto rounded-xl border p-2">
              <ul className="space-y-1.5">
                {sortedProjects.map((project) => {
                  const selected = selectedProjects[project.id] ?? "";

                  return (
                    <li
                      key={project.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/60 px-2 py-1.5"
                    >
                      <label className="text-brand-800 flex min-w-0 cursor-pointer items-center gap-2 text-[11px] font-medium">
                        <input
                          type="checkbox"
                          checked={selected !== ""}
                          onChange={(event) =>
                            setSelectedProjects((current) => ({
                              ...current,
                              [project.id]: event.target.checked
                                ? "CONTRIBUTOR"
                                : "",
                            }))
                          }
                          disabled={isCreating}
                          className="accent-indigo-600"
                        />
                        <span className="truncate">
                          {project.name}{" "}
                          <span className="text-brand-700">
                            (#{project.id})
                          </span>
                        </span>
                      </label>

                      {selected !== "" && (
                        <>
                          <label
                            htmlFor={`invite-project-role-${project.id}`}
                            className="sr-only"
                          >
                            Project role for {project.name}
                          </label>
                          <select
                            id={`invite-project-role-${project.id}`}
                            value={selected}
                            onChange={(event) =>
                              setSelectedProjects((current) => ({
                                ...current,
                                [project.id]: event.target
                                  .value as ProjectRole,
                              }))
                            }
                            disabled={isCreating}
                            className="border-brand-500 bg-brand-100 text-brand-900 h-7 rounded-md border px-1.5 text-[11px]"
                          >
                            {PROJECT_ROLES.map((projectRole) => (
                              <option key={projectRole} value={projectRole}>
                                {PROJECT_ROLE_LABELS[projectRole]}
                              </option>
                            ))}
                          </select>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </fieldset>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
          >
            {error}
          </p>
        )}

        {notice && (
          <p
            role="status"
            className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700"
          >
            {notice}
          </p>
        )}

        {lastInvite?.inviteUrl && (
          <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
            <p className="text-[11px] font-semibold text-indigo-800">
              Invitation link for {lastInvite.maskedEmail}
            </p>
            <p className="mt-1 text-[10px] break-all text-indigo-700">
              {lastInvite.inviteUrl}
            </p>
            <div className="mt-2">
              <CopyLinkButton url={lastInvite.inviteUrl} />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isCreating || email.trim().length === 0}
          className="bg-brand-600 text-brand-900 hover:bg-brand-800 hover:text-brand-200 mt-4 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCreating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {isCreating ? "Sending…" : "Send invitation"}
        </button>
      </form>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="text-brand-700 h-4 w-4" aria-hidden="true" />
            <h2 className="text-brand-900 text-sm font-semibold">
              Pending invitations
            </h2>
          </div>
          <p className="text-brand-700 text-[11px]">
            {invitations.length} open · links expire after 7 days
          </p>
        </div>

        {isLoading ? (
          <div className="border-brand-500/80 bg-brand-100 text-brand-700 mt-3 flex items-center gap-2 rounded-2xl border p-6 text-xs">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading invitations…
          </div>
        ) : isError ? (
          <div className="border-brand-500/80 bg-brand-100 mt-3 rounded-2xl border p-6">
            <p className="text-brand-800 text-sm font-semibold">
              Could not load invitations
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="text-brand-900 mt-2 cursor-pointer text-xs font-semibold underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        ) : invitations.length === 0 ? (
          <div className="border-brand-500/80 bg-brand-100 mt-3 rounded-2xl border p-6 text-center">
            <p className="text-brand-800 text-sm font-semibold">
              No pending invitations
            </p>
            <p className="text-brand-700 mt-1 text-[11px]">
              Invite a teammate above and their link will appear here.
            </p>
          </div>
        ) : (
          <div className="border-brand-500/80 bg-brand-100 mt-3 overflow-hidden rounded-2xl border">
            <ul className="divide-brand-500/60 divide-y">
              {invitations.map((invitation) => (
                <InvitationRow
                  key={invitation.id}
                  invitation={invitation}
                  onResend={(value) => void handleResend(value)}
                  onRevoke={(value) => void handleRevoke(value)}
                  isBusy={
                    busyId === invitation.id && (isResending || isRevoking)
                  }
                />
              ))}
            </ul>
          </div>
        )}
      </section>

      <p className="text-brand-700 flex items-start gap-1.5 text-[11px]">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Invitations grant Admin, Member, or Viewer access only. Ownership is
        transferred from the Members tab.
      </p>
    </div>
  );
};

export default InvitationsPanel;
