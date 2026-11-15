"use client";

import InvitationsPanel from "@/components/settings/InvitationsPanel";
import MembersPanel from "@/components/settings/MembersPanel";
import { ROLE_LABELS, usePermissions } from "@/lib/permissions";
import { Loader2, Mail, Settings2, ShieldAlert, Users } from "lucide-react";
import { useState } from "react";

type Tab = "members" | "invitations";

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "members", label: "Members", icon: Users },
  { id: "invitations", label: "Invitations", icon: Mail },
];

const SettingsPage = () => {
  const [tab, setTab] = useState<Tab>("members");
  const { role, isLoading, isAdmin } = usePermissions();

  if (isLoading) {
    return (
      <div className="text-brand-700 mx-auto flex max-w-3xl items-center gap-2 px-4 py-10 text-xs">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading workspace settings…
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
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-10">
      <div className="pt-5 pb-4">
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

      <div
        role="tablist"
        aria-label="Workspace settings"
        className="border-brand-500/80 bg-brand-200/60 inline-flex rounded-xl border p-1"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = tab === id;

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
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`settings-panel-${tab}`}
        aria-labelledby={`settings-tab-${tab}`}
        className="mt-4"
      >
        {tab === "members" ? <MembersPanel /> : <InvitationsPanel />}
      </div>
    </div>
  );
};

export default SettingsPage;
