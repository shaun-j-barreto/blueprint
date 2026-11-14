import { UserAvatar } from "@/components/TaskChips";
import { displayName, initialsFor, type TeamEntry } from "@/lib/directory";
import { ChevronRight } from "lucide-react";
import { ProjectChip } from "./Badges";
import { AvatarStack } from "./AvatarStack";
import { CARD_CLASS, FOCUS_RING_CLASS, MUTED_LABEL_CLASS } from "./styles";

const LeaderMini = ({
  label,
  user,
}: {
  label: string;
  user?: TeamEntry["productOwner"];
}) => (
  <div className="border-brand-500/60 bg-brand-200/50 flex min-w-0 items-center gap-2 rounded-xl border p-2">
    <UserAvatar user={user} size="sm" title={user?.username} />
    <div className="min-w-0">
      <p className={`${MUTED_LABEL_CLASS} truncate text-[9px]`}>{label}</p>
      <p className="text-brand-900 truncate text-[11px] font-semibold">
        {user ? displayName(user.username) : "Unassigned"}
      </p>
    </div>
  </div>
);

const MiniStat = ({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) => (
  <div className="min-w-0">
    <p className={`${MUTED_LABEL_CLASS} truncate text-[9px]`}>{label}</p>
    <p
      className={`mt-0.5 text-base font-semibold tabular-nums ${
        danger ? "text-red-600 dark:text-red-400" : "text-brand-900"
      }`}
    >
      {value}
    </p>
  </div>
);

type TeamCardProps = {
  entry: TeamEntry;
  onSelect: (entry: TeamEntry) => void;
};

export const TeamCard = ({ entry, onSelect }: TeamCardProps) => {
  const { team, stats, members, productOwner, projectManager, projects } =
    entry;
  const visibleProjects = projects.slice(0, 3);
  const hiddenProjects = projects.length - visibleProjects.length;

  return (
    <article className={`${CARD_CLASS} relative`}>
      <button
        type="button"
        onClick={() => onSelect(entry)}
        aria-label={`View ${team.teamName} details`}
        className={`absolute inset-0 z-0 cursor-pointer rounded-2xl ${FOCUS_RING_CLASS}`}
      />

      <div className="pointer-events-none relative z-10 flex h-full flex-col p-4">
        <div className="flex items-start gap-3">
          <span
            className="bg-brand-300 text-brand-800 border-brand-500/70 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-xs font-bold"
            aria-hidden="true"
          >
            {initialsFor(team.teamName)}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3
                  className="text-brand-900 truncate text-sm font-semibold"
                  title={team.teamName}
                >
                  {team.teamName}
                </h3>
                <p className="text-brand-700 mt-0.5 text-[11px] font-medium">
                  {stats.memberCount}{" "}
                  {stats.memberCount === 1 ? "member" : "members"} ·{" "}
                  {stats.projectCount}{" "}
                  {stats.projectCount === 1 ? "project" : "projects"}
                </p>
              </div>

              <ChevronRight className="text-brand-700 mt-0.5 h-4 w-4 shrink-0" />
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <LeaderMini label="Product owner" user={productOwner} />
          <LeaderMini label="Project manager" user={projectManager} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <AvatarStack users={members} max={5} />
          <span className="text-brand-700 shrink-0 text-[10px] font-semibold">
            {stats.memberCount} {stats.memberCount === 1 ? "member" : "members"}
          </span>
        </div>

        <div className="pointer-events-auto mt-3 flex flex-wrap items-center gap-1.5">
          {visibleProjects.map((project) => (
            <ProjectChip key={project.id} id={project.id} name={project.name} />
          ))}

          {hiddenProjects > 0 && (
            <span className="border-brand-500 text-brand-700 inline-flex items-center rounded-full border border-dashed px-2 py-0.5 text-[10px] font-semibold">
              +{hiddenProjects} more
            </span>
          )}

          {projects.length === 0 && (
            <span className="border-brand-500 text-brand-700 inline-flex items-center rounded-full border border-dashed px-2 py-0.5 text-[10px] font-medium">
              No linked projects
            </span>
          )}
        </div>

        <div className="border-brand-500/60 mt-auto pt-3">
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="Open" value={stats.open} />
            <MiniStat
              label="Overdue"
              value={stats.overdue}
              danger={stats.overdue > 0}
            />
            <MiniStat label="Done" value={stats.completed} />
          </div>

          <div className="mt-2">
            <div
              className="bg-brand-500/60 h-1.5 w-full overflow-hidden rounded-full"
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
            <p className="text-brand-700 mt-1 text-[10px] font-medium">
              {stats.assigned > 0
                ? `${stats.completed} of ${stats.assigned} assigned tasks complete`
                : "No assigned work yet"}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
};
