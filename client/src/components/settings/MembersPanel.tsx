"use client";

import { ROLE_LABELS, usePermissions } from "@/lib/permissions";
import { getApiErrorMessage } from "@/lib/utils";
import {
  useDeactivateMemberMutation,
  useGetMembersQuery,
  useUpdateMemberRoleMutation,
  type WorkspaceMember,
  type WorkspaceRole,
} from "@/state/api";
import {
  AlertTriangle,
  Loader2,
  ShieldCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { useState } from "react";

const ROLE_ORDER: WorkspaceRole[] = ["OWNER", "ADMIN", "MEMBER", "VIEWER"];

const initialsFor = (value: string): string =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";

const roleBadgeClass = (role: WorkspaceRole): string => {
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

const MembersPanel = () => {
  const { data: members = [], isLoading, isError, refetch } = useGetMembersQuery();
  const [updateRole, { isLoading: isUpdating }] = useUpdateMemberRoleMutation();
  const [deactivateMember, { isLoading: isDeactivating }] =
    useDeactivateMemberMutation();
  const permissions = usePermissions();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  const changeRole = async (member: WorkspaceMember, role: WorkspaceRole) => {
    setError("");
    setNotice("");
    setBusyUserId(member.id);

    try {
      await updateRole({ userId: member.id, role }).unwrap();
      setNotice(`${member.username} is now ${ROLE_LABELS[role].toLowerCase()}.`);
    } catch (updateError) {
      setError(
        getApiErrorMessage(updateError, "Could not change that role."),
      );
    } finally {
      setBusyUserId(null);
    }
  };

  const deactivate = async (member: WorkspaceMember) => {
    const confirmed = window.confirm(
      `Deactivate ${member.username}? They will be signed out immediately and removed from assignee lists. Their task history stays intact.`,
    );

    if (!confirmed) return;

    setError("");
    setNotice("");
    setBusyUserId(member.id);

    try {
      const result = await deactivateMember(member.id).unwrap();
      setNotice(
        result.openAssignedTasks > 0
          ? `${member.username} was deactivated. They still have ${result.openAssignedTasks} open assigned task${
              result.openAssignedTasks === 1 ? "" : "s"
            } to reassign.`
          : `${member.username} was deactivated.`,
      );
    } catch (deactivationError) {
      setError(
        getApiErrorMessage(
          deactivationError,
          "Could not deactivate that member.",
        ),
      );
    } finally {
      setBusyUserId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="border-brand-500/80 bg-brand-100 text-brand-700 flex items-center gap-2 rounded-2xl border p-6 text-xs">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading members…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border-brand-500/80 bg-brand-100 rounded-2xl border p-6">
        <p className="text-brand-800 text-sm font-semibold">
          Could not load the member list
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="text-brand-900 mt-2 cursor-pointer text-xs font-semibold underline underline-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="text-brand-700 h-4 w-4" aria-hidden="true" />
          <h2 className="text-brand-900 text-sm font-semibold">
            {members.length} active member{members.length === 1 ? "" : "s"}
          </h2>
        </div>
        <p className="text-brand-700 flex items-center gap-1.5 text-[11px]">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Roles take effect immediately
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
        >
          {error}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700"
        >
          {notice}
        </p>
      )}

      <div className="border-brand-500/80 bg-brand-100 overflow-hidden rounded-2xl border">
        <ul className="divide-brand-500/60 divide-y">
          {members.map((member) => {
            const isSelf = member.id === permissions.user?.id;
            const canTouchOwnership =
              permissions.isOwner || member.role !== "OWNER";
            const isBusy = busyUserId === member.id;

            return (
              <li
                key={member.id}
                className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="bg-brand-900 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white">
                    {initialsFor(member.username)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-brand-900 flex flex-wrap items-center gap-1.5 truncate text-sm font-semibold">
                      {member.username}
                      {isSelf && (
                        <span className="text-brand-700 text-[10px] font-medium">
                          (you)
                        </span>
                      )}
                      <span
                        className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide sm:hidden ${roleBadgeClass(
                          member.role,
                        )}`}
                      >
                        {ROLE_LABELS[member.role]}
                      </span>
                    </p>
                    <p className="text-brand-700 mt-0.5 truncate text-[11px]">
                      {member.email}
                    </p>
                    <p className="text-brand-700 mt-0.5 text-[10px]">
                      {member._count?.projectMembers ?? 0} project
                      {(member._count?.projectMembers ?? 0) === 1 ? "" : "s"}
                      {member.onboardedAt === null
                        ? " · setup pending"
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <label
                    htmlFor={`role-${member.id}`}
                    className="sr-only"
                  >
                    Workspace role for {member.username}
                  </label>
                  <select
                    id={`role-${member.id}`}
                    value={member.role}
                    disabled={
                      isSelf ||
                      isBusy ||
                      isUpdating ||
                      isDeactivating ||
                      !canTouchOwnership
                    }
                    onChange={(event) =>
                      void changeRole(
                        member,
                        event.target.value as WorkspaceRole,
                      )
                    }
                    className="border-brand-500 bg-brand-100 text-brand-900 h-8 cursor-pointer rounded-lg border px-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {ROLE_ORDER.map((role) => (
                      <option
                        key={role}
                        value={role}
                        disabled={role === "OWNER" && !permissions.isOwner}
                      >
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => void deactivate(member)}
                    disabled={
                      isSelf ||
                      isBusy ||
                      isUpdating ||
                      isDeactivating ||
                      !canTouchOwnership
                    }
                    title={
                      isSelf
                        ? "You cannot deactivate yourself"
                        : `Deactivate ${member.username}`
                    }
                    aria-label={`Deactivate ${member.username}`}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isBusy ? (
                      <Loader2
                        className="h-3.5 w-3.5 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <UserMinus className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-brand-700 flex items-start gap-1.5 text-[11px]">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        The workspace always keeps at least one owner. Only owners can grant or
        remove ownership, and you cannot change your own role.
      </p>
    </div>
  );
};

export default MembersPanel;
