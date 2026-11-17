"use client";

import { AnimatePresence, m } from "motion/react";
import {
  CalendarRange,
  Check,
  Columns3,
  List,
  Mail,
  Minus,
  ShieldCheck,
  Sparkles,
  Table2,
  X,
} from "lucide-react";
import { useState, type MouseEvent, type ReactNode } from "react";
import Reveal from "@/components/motion/Reveal";
import { SectionHeading } from "./blueprint";

const VIEWS = [
  { id: "board", label: "Board", icon: Columns3 },
  { id: "list", label: "List", icon: List },
  { id: "table", label: "Table", icon: Table2 },
  { id: "timeline", label: "Timeline", icon: CalendarRange },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];
type Accent = "indigo" | "sky" | "emerald" | "amber";

const ACCENT_BAR: Record<Accent, string> = {
  indigo: "from-indigo-500 via-indigo-400 to-sky-400",
  sky: "from-sky-500 via-sky-400 to-cyan-400",
  emerald: "from-emerald-500 via-emerald-400 to-teal-400",
  amber: "from-amber-500 via-orange-400 to-amber-300",
};

const ACCENT_ICON: Record<Accent, string> = {
  indigo: "border-indigo-100 bg-indigo-50 text-indigo-600",
  sky: "border-sky-100 bg-sky-50 text-sky-600",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-600",
  amber: "border-amber-100 bg-amber-50 text-amber-600",
};

const ROLES = [
  {
    id: "OWNER",
    label: "Owner",
    detail: "Full control, including transferring ownership.",
    scope: "Workspace-wide · every project",
  },
  {
    id: "ADMIN",
    label: "Admin",
    detail: "Manages members, invitations, and every project.",
    scope: "Workspace-wide · every project",
  },
  {
    id: "MEMBER",
    label: "Member",
    detail: "Creates projects and contributes where they are added.",
    scope: "Scoped to projects they join",
  },
  {
    id: "VIEWER",
    label: "Viewer",
    detail: "Reads everything they can access, changes nothing.",
    scope: "Read-only where they are added",
  },
] as const;

const ACCESS_ROWS = [
  { label: "Read every project", manager: true, viewer: true },
  { label: "Create and move tasks", manager: true, viewer: false },
  { label: "Edit project settings", manager: true, viewer: false },
  { label: "Manage project members", manager: true, viewer: false },
];

const BOARD_PREVIEW = [
  {
    title: "Backlog",
    dot: "bg-slate-400",
    cards: ["Map onboarding", "Audit empty states", "Draft launch brief"],
  },
  {
    title: "In progress",
    dot: "bg-amber-500",
    cards: ["Invite flow", "Board drag", "Polish timeline"],
  },
  {
    title: "Shipped",
    dot: "bg-emerald-500",
    cards: ["Role permissions", "Workspace settings"],
  },
];

function BentoCard({
  children,
  className = "",
  accent = "indigo",
}: {
  children: ReactNode;
  className?: string;
  accent?: Accent;
}) {
  const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--spot-x",
      `${event.clientX - bounds.left}px`,
    );
    event.currentTarget.style.setProperty(
      "--spot-y",
      `${event.clientY - bounds.top}px`,
    );
  };

  return (
    <article
      onMouseMove={handleMouseMove}
      className={`spotlight-card group border-brand-500/80 relative flex h-full flex-col overflow-hidden rounded-[28px] border bg-white p-6 shadow-[0_24px_60px_-46px_rgba(7,10,19,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_32px_70px_-40px_rgba(7,10,19,0.35)] sm:p-7 ${className}`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${ACCENT_BAR[accent]}`}
      />
      {children}
    </article>
  );
}

function CardHeading({
  icon: Icon,
  title,
  description,
  accent = "indigo",
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
  accent?: Accent;
}) {
  return (
    <div className="flex items-start gap-4">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${ACCENT_ICON[accent]}`}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h3 className="text-brand-900 text-lg font-semibold tracking-tight">
          {title}
        </h3>
        <p className="text-brand-700 mt-1.5 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function BoardPreview() {
  return (
    <div className="grid h-full grid-cols-3 gap-2">
      {BOARD_PREVIEW.map((column) => (
        <div
          key={column.title}
          className="border-brand-500/60 bg-brand-200/70 rounded-xl border p-2"
        >
          <p className="text-brand-700 flex items-center gap-1.5 px-0.5 text-[10px] font-semibold">
            <span className={`h-1.5 w-1.5 rounded-full ${column.dot}`} />
            {column.title}
          </p>
          <div className="mt-2 space-y-1.5">
            {column.cards.map((card) => (
              <div
                key={card}
                className="border-brand-500/60 rounded-lg border bg-white p-2 shadow-sm"
              >
                <span className="block h-1 w-9 rounded-full bg-indigo-200" />
                <p className="text-brand-800 mt-1.5 text-[10px] leading-tight font-semibold">
                  {card}
                </p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="bg-brand-500 h-1 w-6 rounded-full" />
                  <span className="h-3 w-3 rounded-full bg-gradient-to-br from-indigo-400 to-sky-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ListPreview() {
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      {[
        "Map the onboarding journey",
        "Build the invitation flow",
        "Ship role permissions",
        "Refresh workspace settings",
      ].map((task, index) => (
        <div
          key={task}
          className="border-brand-500/60 flex items-center gap-2.5 rounded-xl border bg-white px-3 py-2.5 shadow-sm"
        >
          <span
            className={`flex h-4 w-4 items-center justify-center rounded-full border ${
              index < 2
                ? "border-emerald-300 bg-emerald-50"
                : "border-brand-500 bg-brand-200"
            }`}
          >
            {index < 2 && (
              <Check
                className="h-2.5 w-2.5 text-emerald-600"
                aria-hidden="true"
              />
            )}
          </span>
          <span
            className={`flex-1 text-[11px] font-medium ${
              index < 2 ? "text-brand-700 line-through" : "text-brand-900"
            }`}
          >
            {task}
          </span>
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-semibold text-indigo-600">
            Sprint 1
          </span>
        </div>
      ))}
    </div>
  );
}

function TablePreview() {
  return (
    <div className="border-brand-500/60 flex h-full flex-col overflow-hidden rounded-xl border bg-white">
      <div className="border-brand-500/60 bg-brand-200 text-brand-700 grid grid-cols-[1.6fr_0.8fr_0.6fr] border-b px-3 py-2 text-[9px] font-semibold tracking-wide uppercase">
        <span>Task</span>
        <span>Status</span>
        <span>Owner</span>
      </div>
      {[
        ["Onboarding journey", "In progress", "Maya"],
        ["Invitation flow", "In progress", "Noah"],
        ["Role permissions", "Shipped", "Iris"],
        ["Workspace settings", "Shipped", "Noah"],
      ].map(([task, status, owner]) => (
        <div
          key={task}
          className="border-brand-500/40 grid flex-1 grid-cols-[1.6fr_0.8fr_0.6fr] items-center border-b px-3 py-2 text-[10px] last:border-b-0"
        >
          <span className="text-brand-900 truncate font-medium">{task}</span>
          <span
            className={
              status === "Shipped"
                ? "font-medium text-emerald-600"
                : "font-medium text-amber-600"
            }
          >
            {status}
          </span>
          <span className="text-brand-700">{owner}</span>
        </div>
      ))}
    </div>
  );
}

function TimelinePreview() {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      {[
        { label: "Design", start: 4, width: 34, tone: "bg-indigo-500" },
        { label: "Build", start: 26, width: 48, tone: "bg-sky-500" },
        { label: "Review", start: 58, width: 30, tone: "bg-amber-500" },
        { label: "Launch", start: 78, width: 18, tone: "bg-emerald-500" },
      ].map((bar) => (
        <div key={bar.label} className="flex items-center gap-2.5">
          <span className="text-brand-700 w-12 text-right text-[10px] font-medium">
            {bar.label}
          </span>
          <div className="bg-brand-300 relative h-3.5 flex-1 rounded-full">
            <span
              className={`absolute inset-y-0 rounded-full ${bar.tone} shadow-sm`}
              style={{ left: `${bar.start}%`, width: `${bar.width}%` }}
            />
          </div>
        </div>
      ))}
      <div className="border-brand-500/60 text-brand-700 mt-0.5 flex items-center justify-between border-t pt-2 font-mono text-[8px] font-semibold tracking-[0.14em] uppercase">
        <span>Week 1</span>
        <span>Week 4</span>
        <span>Launch</span>
      </div>
    </div>
  );
}

const VIEW_PREVIEWS: Record<ViewId, ReactNode> = {
  board: <BoardPreview />,
  list: <ListPreview />,
  table: <TablePreview />,
  timeline: <TimelinePreview />,
};

export default function FeatureBento() {
  const [view, setView] = useState<ViewId>("board");
  const [role, setRole] = useState<(typeof ROLES)[number]["id"]>("OWNER");
  const [sent, setSent] = useState(false);
  const [mode, setMode] = useState<"viewer" | "manager">("manager");

  const activeRole = ROLES.find((item) => item.id === role) ?? ROLES[0];

  return (
    <section
      id="features"
      className="border-brand-500/70 bg-brand-200/40 relative scroll-mt-24 overflow-hidden border-b"
    >
      <div
        aria-hidden="true"
        className="blueprint-grid blueprint-fade absolute inset-0 opacity-60"
      />
      <div
        aria-hidden="true"
        className="absolute -top-24 left-1/2 h-[360px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200/50 via-sky-200/40 to-cyan-100/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute right-[-10%] bottom-[-18%] h-[340px] w-[340px] rounded-full bg-emerald-200/25 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:py-32">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <SectionHeading
              eyebrow="Why BluePrint"
              title="Less status chasing. More shipping."
              description="A deliberately small workspace: a clear dashboard, flexible project views, and people pages that keep the team connected."
            />
          </Reveal>

          <Reveal delay={0.08}>
            <p className="text-brand-700 flex items-center gap-2 font-mono text-[9px] font-semibold tracking-[0.18em] uppercase lg:pb-2">
              <Sparkles
                className="h-3.5 w-3.5 text-indigo-500"
                aria-hidden="true"
              />
              4 views / 4 roles / 1 source
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-6">
          <Reveal className="lg:col-span-4">
            <BentoCard>
              <CardHeading
                icon={Columns3}
                title="Four views, one source of truth"
                description="Board, list, table, and timeline all read the same tasks. Switch the lens without moving the work."
              />

              <div
                role="group"
                aria-label="Project views"
                className="border-brand-500/80 bg-brand-200/70 mt-5 inline-flex flex-wrap gap-1.5 self-start rounded-2xl border p-1.5"
              >
                {VIEWS.map(({ id, label, icon: Icon }) => {
                  const active = view === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setView(id)}
                      className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none ${
                        active
                          ? "text-brand-900 ring-brand-500/60 bg-white shadow-sm ring-1"
                          : "text-brand-700 hover:text-brand-900 hover:bg-white/60"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="relative mt-5 flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-800/90 bg-[#0b1120] p-2 shadow-[0_36px_70px_-42px_rgba(7,10,19,0.85)]">
                <div className="flex items-center gap-2 px-1.5 pb-2">
                  <span className="flex items-center gap-1" aria-hidden="true">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400/80" />
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80" />
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                  </span>
                  <div className="mx-auto flex h-6 w-full max-w-[280px] items-center justify-center rounded-md bg-white/[0.07] font-mono text-[9px] text-slate-400">
                    blueprint.app/projects/atlas
                  </div>
                  <span className="hidden items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[8px] font-semibold text-emerald-300 sm:flex">
                    <span className="h-1 w-1 rounded-full bg-emerald-400" />
                    Live
                  </span>
                </div>

                <div className="min-h-[248px] flex-1 overflow-hidden rounded-xl bg-[#f8fafc] p-3">
                  <AnimatePresence mode="wait" initial={false}>
                    <m.div
                      key={view}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full"
                    >
                      {VIEW_PREVIEWS[view]}
                    </m.div>
                  </AnimatePresence>
                </div>
              </div>
            </BentoCard>
          </Reveal>

          <Reveal className="lg:col-span-2" delay={0.06}>
            <BentoCard accent="emerald">
              <CardHeading
                accent="emerald"
                icon={ShieldCheck}
                title="Roles that fit real teams"
                description="Owners, admins, members, and viewers each see the actions they should."
              />

              <div className="mt-5 flex flex-wrap gap-1.5">
                {ROLES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRole(item.id)}
                    aria-pressed={role === item.id}
                    className={`h-8 cursor-pointer rounded-full border px-3 text-[11px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none ${
                      role === item.id
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-brand-500/70 text-brand-700 hover:text-brand-900 bg-white hover:border-emerald-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="border-brand-500/70 bg-brand-200/60 mt-4 flex flex-1 flex-col rounded-2xl border p-4">
                <div className="flex flex-1 flex-col justify-center">
                  <p className="text-brand-900 text-sm font-semibold">
                    {activeRole.label}
                  </p>
                  <p className="text-brand-700 mt-1 text-xs leading-relaxed">
                    {activeRole.detail}
                  </p>

                  <div className="border-brand-500/60 mt-3 flex items-center gap-2 rounded-xl border bg-white px-2.5 py-2">
                    <ShieldCheck
                      className="h-3.5 w-3.5 shrink-0 text-emerald-500"
                      aria-hidden="true"
                    />
                    <p className="text-brand-700 text-[10px] font-medium">
                      {activeRole.scope}
                    </p>
                  </div>

                  <div className="border-brand-500/60 mt-3 space-y-2 border-t pt-3">
                    {[
                      "Scoped project access",
                      "Role-aware controls",
                      "Changes apply immediately",
                    ].map((item) => (
                      <p
                        key={item}
                        className="text-brand-700 flex items-center gap-2 text-[11px] font-medium"
                      >
                        <Check
                          className="h-3.5 w-3.5 text-emerald-500"
                          aria-hidden="true"
                        />
                        {item}
                      </p>
                    ))}
                  </div>
                </div>

                <p className="text-brand-700/80 pt-4 font-mono text-[8px] font-semibold tracking-[0.16em] uppercase">
                  Checked on every route
                </p>
              </div>
            </BentoCard>
          </Reveal>

          <Reveal className="lg:col-span-2" delay={0.1}>
            <BentoCard accent="amber">
              <CardHeading
                accent="amber"
                icon={Mail}
                title="Invite in seconds"
                description="Pick a role, add project access, and send one link. SMTP is optional."
              />

              <div className="border-brand-500/70 bg-brand-200/60 mt-5 flex flex-1 flex-col justify-center rounded-2xl border p-4">
                <div className="border-brand-500/70 flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[10px] font-bold text-white">
                    JD
                  </span>
                  <div className="min-w-0">
                    <p className="text-brand-900 truncate text-xs font-semibold">
                      jamie@studio.co
                    </p>
                    <p className="text-brand-700 text-[10px]">
                      Member · 2 projects
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["Apollo", "Beacon"].map((project) => (
                    <span
                      key={project}
                      className="rounded-md border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-600"
                    >
                      {project}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setSent(true)}
                  className={`mt-3 inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-[11px] font-semibold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none ${
                    sent
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500"
                  }`}
                >
                  {sent ? (
                    <>
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      Invitation ready
                    </>
                  ) : (
                    <>
                      <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                      Send invitation
                    </>
                  )}
                </button>

                <p className="text-brand-700 mt-2.5 text-[10px] leading-relaxed">
                  {sent
                    ? "Email delivery is optional — the link is always ready to copy."
                    : "No SMTP? The invitation link is generated either way."}
                </p>
              </div>
            </BentoCard>
          </Reveal>

          <Reveal className="lg:col-span-4" delay={0.14}>
            <BentoCard accent="sky">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <CardHeading
                  accent="sky"
                  icon={ShieldCheck}
                  title="Access that follows the work"
                  description="Project roles are checked on every route. Viewers read; managers change. Owners and admins can step in anywhere."
                />

                <div
                  role="group"
                  aria-label="Preview access level"
                  className="border-brand-500/70 bg-brand-200/70 inline-flex rounded-xl border p-1"
                >
                  {(["viewer", "manager"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setMode(option)}
                      aria-pressed={mode === option}
                      className={`h-8 cursor-pointer rounded-lg px-3 text-[11px] font-semibold capitalize transition-all focus-visible:ring-2 focus-visible:ring-sky-500/40 focus-visible:outline-none ${
                        mode === option
                          ? "text-brand-900 ring-brand-500/60 bg-white shadow-sm ring-1"
                          : "text-brand-700 hover:text-brand-900"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {ACCESS_ROWS.map((row) => {
                  const allowed = mode === "manager" ? row.manager : row.viewer;

                  return (
                    <div
                      key={row.label}
                      className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-[11px] font-medium transition-colors ${
                        allowed
                          ? "border-emerald-200 bg-emerald-50/70 text-emerald-800"
                          : "border-brand-500/60 bg-brand-200/50 text-brand-700"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full ${
                          allowed
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-brand-300 text-brand-700"
                        }`}
                      >
                        {allowed ? (
                          <Check className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <Minus className="h-3 w-3" aria-hidden="true" />
                        )}
                      </span>
                      {row.label}
                    </div>
                  );
                })}
              </div>

              <p className="text-brand-700 mt-4 flex items-center gap-2 text-[11px] font-medium">
                <X className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
                Non-members receive a 404, not a permission hint.
              </p>
            </BentoCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
