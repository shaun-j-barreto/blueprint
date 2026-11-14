"use client";

import { UserAvatar } from "@/components/TaskChips";
import { displayName, initialsFor, type TeamEntry } from "@/lib/directory";
import { Status, type Task, type User } from "@/state/api";
import { statusMeta } from "@/lib/taskStyles";
import {
  ChevronRight,
  ClipboardList,
  FolderOpen,
  Layers3,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { ProjectChip } from "./Badges";
import { Drawer } from "./Drawer";
import { EmptyState } from "./EmptyState";
import { MUTED_LABEL_CLASS } from "./styles";

const STATUS_ORDER: Status[] = [
  Status.ToDo,
  Status.WorkInProgress,
  Status.UnderReview,
  Status.Completed,
];

const SummaryStat = ({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint: string;
  tone?: "default" | "danger" | "success";
}) => (
  <div className="border-brand-500/60 bg-brand-200/50 rounded-xl border p-3">
    <p className={`${MUTED_LABEL_CLASS} truncate`}>{label}</p>
    <p
      className={`mt-1 text-xl font-semibold tabular-nums ${
        tone === "danger"
          ? "text-red-600 dark:text-red-400"
          : tone === "success"
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-brand-900"
      }`}
    >
      {value}
    </p>
    <p className="text-brand-700 mt-0.5 truncate text-[10px] font-medium">
      {hint}
    </p>
  </div>
);

const PersonButton = ({
  label,
  user,
  onSelect,
}: {
  label: string;
  user?: User;
  onSelect: (user: User) => void;
}) => {
  if (!user) {
    return (
      <div className="border-brand-500 text-brand-700 flex items-center gap-2 rounded-xl border border-dashed p-2.5">
        <UserAvatar size="md" />
        <div className="min-w-0">
          <p className={`${MUTED_LABEL_CLASS} truncate text-[9px]`}>{label}</p>
          <p className="text-brand-700 truncate text-[11px] font-semibold">
            Unassigned
          </p>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(user)}
      className="border-brand-500/60 bg-brand-200/50 hover:border-brand-600 hover:bg-brand-200 flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
    >
      <UserAvatar user={user} size="md" title={user.username} />
      <div className="min-w-0 flex-1">
        <p className={`${MUTED_LABEL_CLASS} truncate text-[9px]`}>{label}</p>
        <p className="text-brand-900 truncate text-[11px] font-semibold">
          {displayName(user.username)}
        </p>
      </div>
      <ChevronRight className="text-brand-700 h-3.5 w-3.5 shrink-0" />
    </button>
  );
};

type TeamDrawerProps = {
  entry: TeamEntry | null;
  tasks: Task[];
  onClose: () => void;
  onSelectPerson: (user: User) => void;
  layer?: number;
};

export const TeamDrawer = ({
  entry,
  tasks,
  onClose,
  onSelectPerson,
  layer = 50,
}: TeamDrawerProps) => {
  const openByUser = useMemo(() => {
    const counts = new Map<number, number>();

    tasks.forEach((task) => {
      if (task.status === Status.Completed) return;

      const userId = task.assignedUserId;
      if (typeof userId !== "number") return;

      counts.set(userId, (counts.get(userId) ?? 0) + 1);
    });

    return counts;
  }, [tasks]);

  const sortedMembers = useMemo(
    () =>
      [...(entry?.members ?? [])].sort((a, b) =>
        displayName(a.username).localeCompare(displayName(b.username)),
      ),
    [entry],
  );

  if (!entry) return null;

  const { team, stats, productOwner, projectManager, projects } = entry;
  const noStatusCount = stats.statusCounts["No status"] ?? 0;

  return (
    <Drawer
      open
      onClose={onClose}
      eyebrow="Team"
      title={team.teamName}
      layer={layer}
      widthClassName="sm:max-w-[520px]"
      subtitle={`${stats.memberCount} ${
        stats.memberCount === 1 ? "member" : "members"
      } · ${stats.projectCount} ${
        stats.projectCount === 1 ? "project" : "projects"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className="bg-brand-300 text-brand-800 border-brand-500/70 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border text-sm font-bold"
          aria-hidden="true"
        >
          {initialsFor(team.teamName)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-brand-700 text-[11px] font-medium">
            {stats.assigned > 0
              ? `${stats.completed} of ${stats.assigned} assigned tasks complete`
              : "No assigned work yet"}
          </p>

          <div
            className="bg-brand-500/60 mt-2 h-1.5 w-full overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={stats.completionRate}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${team.teamName} task completion`}
          >
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>

        <span className="text-brand-900 shrink-0 text-sm font-semibold tabular-nums">
          {stats.completionRate}%
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <SummaryStat
          label="Members"
          value={stats.memberCount}
          hint="People on this team"
        />
        <SummaryStat
          label="Projects"
          value={stats.projectCount}
          hint="Linked workstreams"
        />
        <SummaryStat
          label="Open"
          value={stats.open}
          hint={`${stats.overdue} overdue`}
          tone={stats.overdue > 0 ? "danger" : "default"}
        />
        <SummaryStat
          label="Completed"
          value={stats.completed}
          hint="Assigned and closed"
          tone="success"
        />
      </div>

      <section className="mt-5" aria-labelledby="team-leadership">
        <h3 id="team-leadership" className={MUTED_LABEL_CLASS}>
          Leadership
        </h3>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <PersonButton
            label="Product owner"
            user={productOwner}
            onSelect={onSelectPerson}
          />
          <PersonButton
            label="Project manager"
            user={projectManager}
            onSelect={onSelectPerson}
          />
        </div>
      </section>

      <section className="mt-5" aria-labelledby="team-members">
        <div className="flex items-center justify-between gap-2">
          <h3 id="team-members" className={MUTED_LABEL_CLASS}>
            Members
          </h3>
          <span className="text-brand-700 inline-flex items-center gap-1 text-[10px] font-semibold tabular-nums">
            <Users className="h-3 w-3" aria-hidden="true" />
            {stats.memberCount}
          </span>
        </div>

        {sortedMembers.length > 0 ? (
          <div className="mt-2 space-y-1.5">
            {sortedMembers.map((member, index) => {
              const open = member.id ? (openByUser.get(member.id) ?? 0) : 0;

              return (
                <button
                  key={member.id ?? `${member.username}-${index}`}
                  type="button"
                  onClick={() => onSelectPerson(member)}
                  className="border-brand-500/60 hover:border-brand-600 hover:bg-brand-200 flex w-full cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
                >
                  <UserAvatar user={member} size="md" title={member.username} />
                  <div className="min-w-0 flex-1">
                    <p className="text-brand-900 truncate text-[12px] font-semibold">
                      {displayName(member.username)}
                    </p>
                    <p className="text-brand-700 truncate text-[10px] font-medium">
                      @{member.username} · {open} open{" "}
                      {open === 1 ? "task" : "tasks"}
                    </p>
                  </div>
                  <ChevronRight className="text-brand-700 h-3.5 w-3.5 shrink-0" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-2">
            <EmptyState
              compact
              title="No members yet"
              hint="People assigned to this team will appear here."
              icon={<Users className="h-4 w-4" aria-hidden="true" />}
            />
          </div>
        )}
      </section>

      <section className="mt-5" aria-labelledby="team-projects">
        <div className="flex items-center justify-between gap-2">
          <h3 id="team-projects" className={MUTED_LABEL_CLASS}>
            Projects
          </h3>
          <span className="text-brand-700 inline-flex items-center gap-1 text-[10px] font-semibold tabular-nums">
            <FolderOpen className="h-3 w-3" aria-hidden="true" />
            {projects.length}
          </span>
        </div>

        {projects.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {projects.map((project) => (
              <ProjectChip
                key={project.id}
                id={project.id}
                name={project.name}
              />
            ))}
          </div>
        ) : (
          <p className="text-brand-700 mt-2 text-[11px]">
            No projects linked to this team yet.
          </p>
        )}
      </section>

      <section className="mt-5" aria-labelledby="team-workload">
        <div className="flex items-center justify-between gap-2">
          <h3 id="team-workload" className={MUTED_LABEL_CLASS}>
            Workload
          </h3>
          <span className="text-brand-700 inline-flex items-center gap-1 text-[10px] font-semibold tabular-nums">
            <Layers3 className="h-3 w-3" aria-hidden="true" />
            {stats.assigned}
          </span>
        </div>

        {stats.assigned > 0 ? (
          <div className="mt-2 space-y-2">
            {STATUS_ORDER.map((status) => {
              const meta = statusMeta[status];
              const count = stats.statusCounts[status] ?? 0;
              const width =
                stats.assigned > 0 ? (count / stats.assigned) * 100 : 0;

              return (
                <div
                  key={status}
                  className="grid grid-cols-[92px_1fr_24px] items-center gap-2"
                >
                  <span className="text-brand-700 flex min-w-0 items-center gap-1.5 text-[10px] font-medium">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`}
                    />
                    <span className="truncate">{meta.label}</span>
                  </span>
                  <span className="bg-brand-500/60 h-1.5 overflow-hidden rounded-full">
                    <span
                      className={`block h-full rounded-full ${meta.dot}`}
                      style={{ width: `${width}%` }}
                    />
                  </span>
                  <span className="text-brand-900 text-right text-[10px] font-semibold tabular-nums">
                    {count}
                  </span>
                </div>
              );
            })}

            {noStatusCount > 0 && (
              <div className="grid grid-cols-[92px_1fr_24px] items-center gap-2">
                <span className="text-brand-700 flex min-w-0 items-center gap-1.5 text-[10px] font-medium">
                  <span className="bg-brand-600 h-1.5 w-1.5 shrink-0 rounded-full" />
                  <span className="truncate">No status</span>
                </span>
                <span className="bg-brand-500/60 h-1.5 overflow-hidden rounded-full">
                  <span
                    className="bg-brand-600 block h-full rounded-full"
                    style={{
                      width: `${(noStatusCount / stats.assigned) * 100}%`,
                    }}
                  />
                </span>
                <span className="text-brand-900 text-right text-[10px] font-semibold tabular-nums">
                  {noStatusCount}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-2">
            <EmptyState
              compact
              title="No workload"
              hint="Tasks assigned to this team's members will appear here."
              icon={<ClipboardList className="h-4 w-4" aria-hidden="true" />}
            />
          </div>
        )}
      </section>
    </Drawer>
  );
};
