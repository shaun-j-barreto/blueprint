import { UserAvatar } from "@/components/TaskChips";
import { displayName, type PersonEntry } from "@/lib/directory";
import { ChevronRight } from "lucide-react";
import { RoleBadge, TeamBadge } from "./Badges";
import { CARD_CLASS, FOCUS_RING_CLASS, MUTED_LABEL_CLASS } from "./styles";

const CardStat = ({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) => (
  <div className="min-w-0 text-center first:text-left last:text-right">
    <p className={`${MUTED_LABEL_CLASS} truncate`}>{label}</p>
    <p
      className={`mt-1 text-lg font-semibold tabular-nums ${
        danger ? "text-red-600 dark:text-red-400" : "text-brand-900"
      }`}
    >
      {value}
    </p>
  </div>
);

type PersonCardProps = {
  person: PersonEntry;
  onSelect: (person: PersonEntry) => void;
};

export const PersonCard = ({ person, onSelect }: PersonCardProps) => {
  const { user, team, role, stats } = person;
  const name = displayName(user.username);
  const completionLabel =
    stats.assigned > 0 ? `${stats.completionRate}%` : "No assigned work";

  return (
    <button
      type="button"
      onClick={() => onSelect(person)}
      aria-label={`View ${name}'s profile`}
      className={`${CARD_CLASS} ${FOCUS_RING_CLASS} group flex cursor-pointer flex-col p-4 text-left`}
    >
      <div className="flex items-start gap-3">
        <UserAvatar user={user} size="xl" title={name} className="shadow-sm" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p
                className="text-brand-900 truncate text-sm font-semibold"
                title={user.username}
              >
                {name}
              </p>
              <p className="text-brand-700 mt-0.5 truncate text-[11px] font-medium">
                @{user.username}
              </p>
            </div>

            <ChevronRight className="text-brand-700 group-hover:text-brand-900 mt-0.5 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <RoleBadge role={role} />
            <TeamBadge name={team?.teamName} />
          </div>
        </div>
      </div>

      <div className="border-brand-500/60 bg-brand-200/60 mt-4 grid grid-cols-3 gap-2 rounded-xl border p-2.5">
        <CardStat label="Open" value={stats.open} danger={stats.overdue > 0} />
        <CardStat label="Done" value={stats.completed} />
        <CardStat label="Authored" value={stats.authored} />
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between gap-2">
          <span className={MUTED_LABEL_CLASS}>Completion</span>
          <span className="text-brand-700 flex items-center gap-2 text-[10px] font-semibold tabular-nums">
            {stats.overdue > 0 && (
              <span className="text-red-600 dark:text-red-400">
                {stats.overdue} overdue
              </span>
            )}
            {completionLabel}
          </span>
        </div>

        <div
          className="bg-brand-500/60 mt-1.5 h-1.5 w-full overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={stats.completionRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${name} task completion`}
        >
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width]"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>
      </div>
    </button>
  );
};
