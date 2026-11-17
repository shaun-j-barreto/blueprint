"use client";

import InvitationsPanel from "@/components/settings/InvitationsPanel";
import MembersPanel from "@/components/settings/MembersPanel";
import StatTiles, { type Stat } from "@/components/settings/StatTiles";
import { ROLE_LABELS, usePermissions } from "@/lib/permissions";
import {
  useGetInvitationsQuery,
  useGetMembersQuery,
  useGetProjectsQuery,
} from "@/state/api";
import {
  ArrowRight,
  FolderKanban,
  Loader2,
  Mail,
  Send,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

type Tab = "members" | "invitations";

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "members", label: "Members", icon: Users },
  { id: "invitations", label: "Invitations", icon: Mail },
];

const SettingsPage = () => {
  const [tab, setTab] = useState<Tab>("members");
  const { role, isLoading, isAdmin } = usePermissions();

  const { data: members = [], isLoading: isMembersLoading } =
    useGetMembersQuery(undefined, { skip: !isAdmin });
  const { data: invitations = [], isLoading: isInvitationsLoading } =
    useGetInvitationsQuery(undefined, { skip: !isAdmin });
  const { data: projects = [], isLoading: isProjectsLoading } =
    useGetProjectsQuery(undefined, {
      skip: !isAdmin,
    });

  const openInviteForm = useCallback(() => {
    setTab("invitations");

    window.setTimeout(() => {
      const input = document.getElementById("invite-email");
      if (!input) return;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      input.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
      (input as HTMLInputElement).focus({ preventScroll: true });
    }, 80);
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 pb-10">
        <div className="pt-5">
          <div className="h-3 w-20 animate-pulse rounded bg-brand-500/60" />
          <div className="mt-3 h-7 w-40 animate-pulse rounded-lg bg-brand-500/60" />
          <div className="mt-2 h-3 w-72 max-w-full animate-pulse rounded bg-brand-500/50" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-24 animate-pulse rounded-xl border border-brand-500/70 bg-brand-100"
            />
          ))}
        </div>
        <div className="mt-6 h-64 animate-pulse rounded-2xl border border-brand-500/70 bg-brand-100" />
        <div className="text-brand-700 mt-4 flex items-center gap-2 text-xs">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading workspace settings…
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="border-brand-500/80 bg-brand-100 rounded-2xl border p-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600">
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="text-brand-900 mt-4 text-xl font-semibold tracking-tight">
            Workspace settings are admin-only
          </h1>
          <p className="text-brand-700 mt-2 text-xs leading-relaxed">
            You are signed in as{" "}
            <strong className="text-brand-900">
              {role ? ROLE_LABELS[role] : "a member"}
            </strong>
            . Ask an owner or admin if you need to manage members or
            invitations.
          </p>
          <Link
            href="/home"
            className="text-brand-900 mt-4 inline-flex items-center gap-1.5 text-xs font-semibold underline-offset-2 hover:underline"
          >
            Back to dashboard
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  const adminCount = members.filter(
    (member) => member.role === "OWNER" || member.role === "ADMIN",
  ).length;

  const stats: Stat[] = [
    {
      label: "Members",
      value: isMembersLoading ? "—" : members.length,
      hint: "active accounts",
      icon: Users,
      tone: "indigo",
    },
    {
      label: "Admins",
      value: isMembersLoading ? "—" : adminCount,
      hint: "owners + admins",
      icon: ShieldCheck,
      tone: "emerald",
    },
    {
      label: "Projects",
      value: isProjectsLoading ? "—" : projects.length,
      hint: "across the workspace",
      icon: FolderKanban,
      tone: "amber",
    },
    {
      label: "Pending",
      value: isInvitationsLoading ? "—" : invitations.length,
      hint: "open invitations",
      icon: Mail,
      tone: "slate",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10">
      <div className="flex flex-col gap-4 pt-5 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-brand-700 text-[10px] font-semibold tracking-[0.08em] uppercase">
            Workspace
          </p>
          <h1 className="text-brand-900 mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Settings2 className="text-brand-700 h-5 w-5" aria-hidden="true" />
            Settings
          </h1>
          <p className="text-brand-700 mt-1 text-xs">
            Manage who can see and change things in this workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={openInviteForm}
          className="inline-flex h-9 w-fit cursor-pointer items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Send className="h-3.5 w-3.5" aria-hidden="true" />
          Invite people
        </button>
      </div>

      <StatTiles stats={stats} />

      <div
        role="tablist"
        aria-label="Workspace settings"
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          const next = tab === "members" ? "invitations" : "members";
          setTab(next);
          document.getElementById(`settings-tab-${next}`)?.focus();
        }}
        className="border-brand-500/80 bg-brand-200/60 mt-5 inline-flex rounded-xl border p-1"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = tab === id;
          const count = id === "members" ? members.length : invitations.length;

          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`settings-tab-${id}`}
              aria-selected={isActive}
              aria-controls={`settings-panel-${id}`}
              onClick={() => setTab(id)}
              className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none ${
                isActive
                  ? "bg-brand-100 text-brand-900 shadow-sm"
                  : "text-brand-700 hover:text-brand-900"
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
              <span
                className={`ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold tabular-nums ${
                  isActive
                    ? "bg-brand-200 text-brand-800"
                    : "bg-brand-300/70 text-brand-700"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="settings-panel-members"
        aria-labelledby="settings-tab-members"
        hidden={tab !== "members"}
        className="mt-4"
      >
        <MembersPanel />
      </div>

      <div
        role="tabpanel"
        id="settings-panel-invitations"
        aria-labelledby="settings-tab-invitations"
        hidden={tab !== "invitations"}
        className="mt-4"
      >
        <InvitationsPanel />
      </div>
    </div>
  );
};

export default SettingsPage;
