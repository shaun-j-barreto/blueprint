"use client";

import ConfirmDialog from "@/components/settings/ConfirmDialog";
import Toast, { useToast } from "@/components/settings/Toast";
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
  RotateCcw,
  Search,
  ShieldCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

const ROLE_ORDER: WorkspaceRole[] = ["OWNER", "ADMIN", "MEMBER", "VIEWER"];

const initialsFor = (value: string): string =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";

const FILTER_CLASS =
  "border-brand-500 bg-brand-100 text-brand-900 h-9 w-full rounded-lg border px-2.5 text-xs font-medium transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

const MembersPanel = () => {
  const { data: members = [], isLoading, isError, refetch } =
    useGetMembersQuery();
  const [updateRole, { isLoading: isUpdating }] = useUpdateMemberRoleMutation();
  const [deactivateMember, { isLoading: isDeactivating }] =
    useDeactivateMemberMutation();
  const permissions = usePermissions();
  const { toast, show, dismiss } = useToast();

  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [pendingRemoval, setPendingRemoval] =
    useState<WorkspaceMember | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<WorkspaceRole | "ALL">("ALL");

  const visibleMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return members.filter((member) => {
      if (roleFilter !== "ALL" && member.role !== roleFilter) return false;
      if (!query) return true;

      return (
        member.username.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query)
      );
    });
  }, [members, roleFilter, search]);

  const hasFilters = search.trim().length > 0 || roleFilter !== "ALL";
  const resetFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
  };

  const changeRole = async (member: WorkspaceMember, role: WorkspaceRole) => {
    if (role === member.role) return;

    setBusyUserId(member.id);

    try {
      await updateRole({ userId: member.id, role }).unwrap();
      show(
        "success",
        `${member.username} is now ${ROLE_LABELS[role].toLowerCase()}.`,
      );
    } catch (updateError) {
      show(
        "error",
        getApiErrorMessage(updateError, "Could not change that role."),
      );
    } finally {
      setBusyUserId(null);
    }
  };

  const deactivate = async () => {
    if (!pendingRemoval) return;

    const member = pendingRemoval;
    setBusyUserId(member.id);

    try {
      const result = await deactivateMember(member.id).unwrap();
      show(
        "success",
        result.openAssignedTasks > 0
          ? `${member.username} was deactivated. They still have ${result.openAssignedTasks} open assigned task${
              result.openAssignedTasks === 1 ? "" : "s"
            } to reassign.`
          : `${member.username} was deactivated.`,
      );
    } catch (deactivationError) {
      show(
        "error",
        getApiErrorMessage(
          deactivationError,
          "Could not deactivate that member.",
        ),
      );
    } finally {
      setBusyUserId(null);
      setPendingRemoval(null);
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
      <div className="flex flex-wrap items-end justify-between gap-3">
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

      <div className="border-brand-500/80 bg-brand-100 rounded-2xl border p-2.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <label htmlFor="member-search" className="sr-only">
              Search members
            </label>
            <Search
              className="text-brand-700/70 pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              id="member-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email"
              className={`${FILTER_CLASS} pr-2.5 pl-8`}
            />
          </div>

          <div className="flex items-center gap-2 sm:shrink-0">
            <label htmlFor="member-role-filter" className="sr-only">
              Filter by workspace role
            </label>
            <select
              id="member-role-filter"
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as WorkspaceRole | "ALL")
              }
              className={`${FILTER_CLASS} sm:w-[150px]`}
            >
              <option value="ALL">All roles</option>
              {ROLE_ORDER.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="border-brand-500 text-brand-800 hover:bg-brand-300 inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                Clear
              </button>
            )}
          </div>
        </div>

        <p className="text-brand-700 mt-2 px-0.5 text-[10px]">
          Showing {visibleMembers.length} of {members.length} member
          {members.length === 1 ? "" : "s"}
          {hasFilters ? " · filtered" : ""}
        </p>
      </div>

      {visibleMembers.length === 0 ? (
        <div className="border-brand-500/80 bg-brand-100 rounded-2xl border p-6 text-center">
          <p className="text-brand-800 text-sm font-semibold">
            No members match those filters
          </p>
          <p className="text-brand-700 mt-1 text-[11px]">
            Try a different name or role, or clear the filters.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="text-brand-900 mt-2 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold underline underline-offset-2"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            Clear filters
          </button>
        </div>
      ) : (
        <div className="border-brand-500/80 bg-brand-100 overflow-hidden rounded-2xl border">
          <div className="border-brand-500/60 text-brand-700 hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] gap-3 border-b bg-brand-200/50 px-3 py-2 text-[9px] font-semibold tracking-[0.1em] uppercase sm:grid">
            <span>Member</span>
            <span>Access</span>
            <span className="text-right">Role</span>
          </div>

          <ul className="divide-brand-500/60 divide-y">
            {visibleMembers.map((member) => {
              const isSelf = member.id === permissions.user?.id;
              const canTouchOwnership =
                permissions.isOwner || member.role !== "OWNER";
              const isBusy = busyUserId === member.id;
              const isSetupPending = member.onboardedAt === null;
              const projectCount = member._count?.projectMembers ?? 0;

              return (
                <li
                  key={member.id}
                  className="grid gap-3 p-3 transition-colors hover:bg-brand-200/40 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                      {initialsFor(member.username)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-brand-900 flex flex-wrap items-center gap-1.5 text-sm font-semibold">
                        <span className="truncate">{member.username}</span>
                        {isSelf && (
                          <span className="border-brand-500/70 bg-brand-200 text-brand-700 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-brand-700 mt-0.5 truncate text-[11px]">
                        {member.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pl-12 sm:pl-0">
                    <span className="text-brand-700 text-[11px]">
                      {projectCount} project{projectCount === 1 ? "" : "s"}
                    </span>
                    {isSetupPending ? (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700">
                        Setup pending
                      </span>
                    ) : (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-700">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pl-12 sm:pl-0">
                    {isBusy && (
                      <Loader2
                        className="text-brand-700 h-3.5 w-3.5 animate-spin"
                        aria-hidden="true"
                      />
                    )}

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
                      title={
                        isSelf
                          ? "You cannot change your own role"
                          : !canTouchOwnership
                            ? "Only an owner can change another owner's role"
                            : undefined
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
                      onClick={() => setPendingRemoval(member)}
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
                          : !canTouchOwnership
                            ? "Only an owner can remove an owner"
                            : `Deactivate ${member.username}`
                      }
                      aria-label={`Deactivate ${member.username}`}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-500/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <UserMinus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="text-brand-700 flex items-start gap-1.5 text-[11px]">
        <AlertTriangle
          className="mt-0.5 h-3.5 w-3.5 shrink-0"
          aria-hidden="true"
        />
        The workspace always keeps at least one owner. Only owners can grant or
        remove ownership, and you cannot change your own role.
      </p>

      <ConfirmDialog
        open={pendingRemoval !== null}
        title={
          pendingRemoval
            ? `Deactivate ${pendingRemoval.username}?`
            : "Deactivate member?"
        }
        description="They will be signed out immediately and removed from assignee lists. Their task history stays intact. Any open tasks assigned to them will need a new owner."
        confirmLabel="Deactivate"
        isLoading={isDeactivating}
        onConfirm={() => void deactivate()}
        onClose={() => {
          if (!isDeactivating) setPendingRemoval(null);
        }}
      />

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
};

export default MembersPanel;
