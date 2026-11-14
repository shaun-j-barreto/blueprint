"use client";

import { PriorityChip, StatusChip, UserAvatar } from "@/components/TaskChips";
import {
  buildPeopleDirectory,
  displayName,
  sortTasksForDrawer,
  type PersonEntry,
} from "@/lib/directory";
import { taskDateInfo } from "@/lib/taskStyles";
import type { Project, Task, Team, User } from "@/state/api";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  PenLine,
} from "lucide-react";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { ProjectChip, RoleBadge, TeamBadge } from "./Badges";
import { Drawer } from "./Drawer";
import { EmptyState } from "./EmptyState";
import { MUTED_LABEL_CLASS } from "./styles";

const MAX_TASKS = 8;

const DrawerStat = ({
  label,
  value,
  hint,
  tone = "default",
  icon,
}: {
  label: string;
  value: number;
  hint: string;
  tone?: "default" | "danger" | "success";
  icon: ReactNode;
}) => (
  <div className="border-brand-500/60 bg-brand-200/50 rounded-xl border p-3">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
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

      <span className="text-brand-700 shrink-0" aria-hidden="true">
        {icon}
      </span>
    </div>
  </div>
);

const AssignedTaskRow = ({
  task,
  projectName,
}: {
  task: Task;
  projectName: string;
}) => {
  const dates = taskDateInfo(task);

  return (
    <Link
      href={`/projects/${task.projectId}`}
      className="border-brand-500/60 bg-brand-200/40 hover:border-brand-600 hover:bg-brand-200 group flex items-center gap-2 rounded-xl border p-3 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
    >
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <p
            className="text-brand-900 truncate text-[12px] font-semibold"
            title={task.title}
          >
            {task.title}
          </p>
          <StatusChip status={task.status} />
        </div>

        <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-brand-700 max-w-[150px] truncate text-[10px] font-medium">
            {projectName}
          </span>
          <span className="text-brand-700/40" aria-hidden="true">
            •
          </span>
          <PriorityChip priority={task.priority} />
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-medium ${
              dates.overdue
                ? "text-red-600 dark:text-red-400"
                : "text-brand-700"
            }`}
          >
            {dates.overdue ? (
              <AlertCircle className="h-3 w-3" aria-hidden="true" />
            ) : (
              <CalendarDays className="h-3 w-3" aria-hidden="true" />
            )}
            {dates.shortLabel || "No date"}
          </span>
        </div>
      </div>

      <ArrowRight className="text-brand-700 group-hover:text-brand-900 h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
};

type PersonDrawerProps = {
  user: User | null;
  teams: Team[];
  tasks: Task[];
  projects: Project[];
  onClose: () => void;
  layer?: number;
};

export const PersonDrawer = ({
  user,
  teams,
  tasks,
  projects,
  onClose,
  layer = 50,
}: PersonDrawerProps) => {
  const entry: PersonEntry | null = useMemo(() => {
    if (!user) return null;

    return buildPeopleDirectory([user], teams, tasks)[0] ?? null;
  }, [user, teams, tasks]);

  const projectNameById = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects],
  );

  const assignedTasks = useMemo(() => {
    if (!user || typeof user.userId !== "number") return [];

    return sortTasksForDrawer(
      tasks.filter((task) => task.assignedUserId === user.userId),
    );
  }, [user, tasks]);

  if (!user || !entry) return null;

  const { stats } = entry;
  const name = displayName(user.username);
  const personProjects = entry.stats.projectIds
    .map((projectId) => ({
      id: projectId,
      name: projectNameById.get(projectId) ?? `Project ${projectId}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const visibleTasks = assignedTasks.slice(0, MAX_TASKS);

  return (
    <Drawer
      open
      onClose={onClose}
      eyebrow="Person"
      title={name}
      layer={layer}
      subtitle={
        <span className="flex flex-wrap items-center gap-1.5">
          <span>@{user.username}</span>
          {entry.team && (
            <>
              <span aria-hidden="true">·</span>
              <span>{entry.team.teamName}</span>
            </>
          )}
        </span>
      }
    >
      <div className="flex items-center gap-3">
        <UserAvatar user={user} size="2xl" title={name} className="shadow-sm" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <RoleBadge role={entry.role} />
            <TeamBadge name={entry.team?.teamName} />
          </div>
          <p className="text-brand-700 mt-1.5 text-[11px] font-medium">
            {stats.assigned > 0
              ? `${stats.completed} of ${stats.assigned} assigned tasks complete`
              : "No assigned work yet"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <DrawerStat
          label="Open"
          value={stats.open}
          hint="Currently assigned"
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <DrawerStat
          label="Overdue"
          value={stats.overdue}
          hint="Past due date"
          tone={stats.overdue > 0 ? "danger" : "default"}
          icon={<Clock3 className="h-4 w-4" />}
        />
        <DrawerStat
          label="Completed"
          value={stats.completed}
          hint="Assigned and closed"
          tone="success"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <DrawerStat
          label="Authored"
          value={stats.authored}
          hint="Tasks created"
          icon={<PenLine className="h-4 w-4" />}
        />
      </div>

      {stats.assigned > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-2">
            <span className={MUTED_LABEL_CLASS}>Assigned completion</span>
            <span className="text-brand-700 text-[10px] font-semibold tabular-nums">
              {stats.completionRate}%
            </span>
          </div>
          <div
            className="bg-brand-500/60 mt-1.5 h-1.5 w-full overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={stats.completionRate}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${name} assigned task completion`}
          >
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>
      )}

      <section className="mt-5" aria-labelledby="person-projects">
        <h3 id="person-projects" className={MUTED_LABEL_CLASS}>
          Projects
        </h3>

        {personProjects.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {personProjects.map((project) => (
              <ProjectChip
                key={project.id}
                id={project.id}
                name={project.name}
              />
            ))}
          </div>
        ) : (
          <p className="text-brand-700 mt-2 text-[11px]">
            No project activity yet.
          </p>
        )}
      </section>

      <section className="mt-5" aria-labelledby="person-assigned-tasks">
        <div className="flex items-center justify-between gap-2">
          <h3 id="person-assigned-tasks" className={MUTED_LABEL_CLASS}>
            Assigned tasks
          </h3>
          <span className="text-brand-700 text-[10px] font-semibold tabular-nums">
            {assignedTasks.length}
          </span>
        </div>

        {visibleTasks.length > 0 ? (
          <div className="mt-2 space-y-2">
            {visibleTasks.map((task) => (
              <AssignedTaskRow
                key={task.id}
                task={task}
                projectName={
                  projectNameById.get(task.projectId) ??
                  `Project ${task.projectId}`
                }
              />
            ))}
          </div>
        ) : (
          <div className="mt-2">
            <EmptyState
              compact
              title="No assigned tasks"
              hint="Work assigned to this person will appear here."
              icon={<ClipboardList className="h-4 w-4" aria-hidden="true" />}
            />
          </div>
        )}

        {assignedTasks.length > visibleTasks.length && (
          <p className="text-brand-700 mt-2 text-[10px] font-medium">
            Showing {visibleTasks.length} of {assignedTasks.length} tasks.
          </p>
        )}
      </section>
    </Drawer>
  );
};
