"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux";
import { priorityMeta, projectPhase, projectPhaseMeta } from "@/lib/taskStyles";
import {
  Priority,
  useGetProjectsQuery,
  useGetTasksByUserQuery,
} from "@/state/api";
import { setIsSidebarCollapsed } from "@/state";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Home,
  LockIcon,
  PanelLeftClose,
  Search,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";

const CURRENT_USER_ID = 1;

const MAIN_LINKS: { icon: LucideIcon; label: string; href: string }[] = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Clock, label: "Timeline", href: "/timeline" },
  { icon: Users, label: "Teams", href: "/teams" },
  { icon: User, label: "People", href: "/user" },
];

const PRIORITY_LINKS: { priority: Priority; href: string }[] = [
  { priority: Priority.Urgent, href: "/priority/urgent" },
  { priority: Priority.High, href: "/priority/high" },
  { priority: Priority.Medium, href: "/priority/medium" },
  { priority: Priority.Low, href: "/priority/low" },
  { priority: Priority.Backlog, href: "/priority/backlog" },
];

type SidebarProps = {
  isMobileOpen: boolean;
  onMobileClose: () => void;
};

const CountBadge = ({
  children,
  muted = false,
}: {
  children: ReactNode;
  muted?: boolean;
}) => (
  <span
    className={`inline-flex min-w-[20px] items-center justify-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
      muted
        ? "text-brand-700/60 border-transparent bg-transparent"
        : "border-brand-500/70 bg-brand-300 text-brand-700"
    }`}
  >
    {children}
  </span>
);

type SidebarLinkProps = {
  href: string;
  icon: ReactNode;
  label: string;
  badge?: ReactNode;
  compact?: boolean;
  onNavigate?: () => void;
};

const SidebarLink = ({
  href,
  icon,
  label,
  badge,
  compact = false,
  onNavigate,
}: SidebarLinkProps) => {
  const pathname = usePathname();
  const isActive =
    href === "/" ? pathname === "/" || pathname === "/home" : pathname === href;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      title={label}
      className="block w-full rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
    >
      <span
        className={`group relative flex w-full items-center gap-2.5 rounded-lg border transition-colors ${
          compact ? "h-8 px-2 text-[12px]" : "h-9 px-2.5 text-[13px]"
        } ${
          isActive
            ? "border-brand-500/80 bg-brand-100 text-brand-900 shadow-sm"
            : "text-brand-800 hover:bg-brand-300 hover:text-brand-900 border-transparent"
        }`}
      >
        {isActive && (
          <span
            className="absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-indigo-500"
            aria-hidden="true"
          />
        )}
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center ${
            isActive
              ? "text-indigo-500"
              : "text-brand-700 group-hover:text-brand-900"
          }`}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="truncate font-medium">{label}</span>
        {badge && <span className="ml-auto shrink-0">{badge}</span>}
      </span>
    </Link>
  );
};

const Sidebar = ({ isMobileOpen, onMobileClose }: SidebarProps) => {
  const [showProjects, setShowProjects] = useState(true);
  const [showPriority, setShowPriority] = useState(true);
  const [projectFilter, setProjectFilter] = useState("");

  const { data: projects = [] } = useGetProjectsQuery();
  const { data: myTasks = [] } = useGetTasksByUserQuery(CURRENT_USER_ID);

  const dispatch = useAppDispatch();
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed,
  );

  const filteredProjects = useMemo(() => {
    const query = projectFilter.trim().toLowerCase();

    if (!query) return projects;

    return projects.filter((project) =>
      project.name.toLowerCase().includes(query),
    );
  }, [projects, projectFilter]);

  const priorityCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    myTasks.forEach((task) => {
      if (!task.priority) return;
      counts[task.priority] = (counts[task.priority] ?? 0) + 1;
    });

    return counts;
  }, [myTasks]);

  const priorityTotal = PRIORITY_LINKS.reduce(
    (total, link) => total + (priorityCounts[link.priority] ?? 0),
    0,
  );

  const showProjectFilter = projects.length > 6;
  const sidebarClassName = `fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-brand-500/80 bg-brand-200 shadow-xl transition-[transform,visibility] duration-200 ease-out ${
    isMobileOpen ? "visible translate-x-0" : "invisible -translate-x-full"
  } min-[1024px]:visible min-[1024px]:translate-x-0 ${
    isSidebarCollapsed ? "min-[1024px]:hidden" : "min-[1024px]:flex"
  }`;

  return (
    <aside id="app-sidebar" className={sidebarClassName}>
      {/* Brand */}
      <div className="border-brand-500/80 flex h-14 shrink-0 items-center justify-between border-b px-3">
        <Link
          href="/"
          onClick={onMobileClose}
          className="flex items-center gap-2 rounded-lg px-1 py-1 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
        >
          <span className="border-brand-500/80 bg-brand-100 text-brand-900 flex h-7 w-7 items-center justify-center rounded-lg border text-[11px] font-bold">
            B
          </span>
          <span className="text-brand-900 text-sm font-semibold tracking-tight">
            SJBLIST
          </span>
        </Link>

        <div className="flex items-center">
          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Close navigation"
            className="text-brand-700 hover:bg-brand-300 hover:text-brand-900 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none min-[1024px]:hidden"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => dispatch(setIsSidebarCollapsed(true))}
            aria-label="Collapse sidebar"
            className="text-brand-700 hover:bg-brand-300 hover:text-brand-900 hidden h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none min-[1024px]:flex"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable navigation */}
      <div className="flex min-h-0 flex-1 flex-col px-2 pb-3">
        <nav aria-label="Main navigation" className="mt-3 shrink-0">
          <p className="text-brand-700 px-2 pb-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase">
            Main
          </p>
          <div className="space-y-0.5">
            {MAIN_LINKS.map((link) => (
              <SidebarLink
                key={link.href}
                href={link.href}
                icon={<link.icon className="h-4 w-4" />}
                label={link.label}
                onNavigate={onMobileClose}
              />
            ))}
          </div>
        </nav>

        <section className="mt-4 flex min-h-0 flex-1 flex-col">
          <button
            type="button"
            onClick={() => setShowProjects((prev) => !prev)}
            aria-expanded={showProjects}
            aria-controls="sidebar-projects"
            className="text-brand-700 hover:bg-brand-300 hover:text-brand-900 flex h-8 w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
          >
            <span className="text-[10px] font-semibold tracking-[0.08em] uppercase">
              Projects
            </span>
            <span className="flex items-center gap-1.5">
              <CountBadge>{projects.length}</CountBadge>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  showProjects ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </span>
          </button>

          {showProjects && (
            <div id="sidebar-projects" className="flex min-h-0 flex-1 flex-col">
              {showProjectFilter && (
                <div className="relative mt-1 mb-1.5 px-0.5">
                  <Search
                    className="text-brand-700 pointer-events-none absolute top-1/2 left-2.5 h-3 w-3 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={projectFilter}
                    onChange={(event) => setProjectFilter(event.target.value)}
                    placeholder="Filter projects"
                    aria-label="Filter projects"
                    autoComplete="off"
                    className="border-brand-500/80 bg-brand-100 text-brand-900 placeholder:text-brand-700/70 h-8 w-full rounded-lg border pr-7 pl-7 text-[12px] transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                  {projectFilter && (
                    <button
                      type="button"
                      onClick={() => setProjectFilter("")}
                      aria-label="Clear project filter"
                      className="text-brand-700 hover:text-brand-900 absolute top-1/2 right-1.5 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}

              <div className="sidebar-scroll min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-0.5">
                {filteredProjects.map((project) => {
                  const phase = projectPhase(project);

                  return (
                    <SidebarLink
                      key={project.id}
                      href={`/projects/${project.id}`}
                      icon={
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${projectPhaseMeta[phase].dot}`}
                        />
                      }
                      label={project.name}
                      compact
                      onNavigate={onMobileClose}
                    />
                  );
                })}

                {filteredProjects.length === 0 && (
                  <p className="text-brand-700 px-2 py-1.5 text-[11px] leading-relaxed">
                    No projects match “{projectFilter}”.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="mt-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowPriority((prev) => !prev)}
            aria-expanded={showPriority}
            aria-controls="sidebar-priorities"
            className="text-brand-700 hover:bg-brand-300 hover:text-brand-900 flex h-8 w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
          >
            <span className="text-[10px] font-semibold tracking-[0.08em] uppercase">
              Priority
            </span>
            <span className="flex items-center gap-1.5">
              <CountBadge>
                <span title="Your tasks">{priorityTotal}</span>
              </CountBadge>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  showPriority ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </span>
          </button>

          {showPriority && (
            <div id="sidebar-priorities" className="space-y-0.5">
              {PRIORITY_LINKS.map(({ priority, href }) => {
                const count = priorityCounts[priority] ?? 0;
                const meta = priorityMeta[priority];

                return (
                  <SidebarLink
                    key={priority}
                    href={href}
                    icon={
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}
                      />
                    }
                    label={meta.label}
                    badge={<CountBadge muted={count === 0}>{count}</CountBadge>}
                    compact
                    onNavigate={onMobileClose}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Workspace footer */}
      <div className="border-brand-500/80 shrink-0 border-t p-3">
        <Link
          href="/teams"
          onClick={onMobileClose}
          className="border-brand-500/80 bg-brand-100 hover:bg-brand-200 flex items-center gap-2.5 rounded-xl border px-2.5 py-2 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
        >
          <span className="border-brand-500/80 bg-brand-300 relative h-7 w-7 shrink-0 overflow-hidden rounded-lg border">
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="h-full w-full object-cover"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-brand-900 block truncate text-xs font-semibold">
              Shaun Team
            </span>
            <span className="text-brand-700 mt-0.5 flex items-center gap-1 text-[10px] font-medium">
              <LockIcon className="h-2.5 w-2.5" aria-hidden="true" />
              Private
            </span>
          </span>
          <ChevronRight
            className="text-brand-700 h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          />
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
