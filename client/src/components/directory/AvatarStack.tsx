import { UserAvatar, type AvatarSize } from "@/components/TaskChips";
import type { User } from "@/state/api";

type AvatarStackProps = {
  users: User[];
  max?: number;
  size?: AvatarSize;
};

export const AvatarStack = ({
  users,
  max = 5,
  size = "sm",
}: AvatarStackProps) => {
  if (users.length === 0) {
    return (
      <span className="border-brand-500 text-brand-700 inline-flex items-center rounded-full border border-dashed px-2 py-0.5 text-[10px] font-medium">
        No members
      </span>
    );
  }

  const visible = users.slice(0, max);
  const hidden = users.length - visible.length;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-1.5">
        {visible.map((user, index) => (
          <span
            key={user.id ?? `${user.username}-${index}`}
            className="bg-brand-100 ring-brand-100 rounded-full ring-2"
          >
            <UserAvatar user={user} size={size} title={user.username} />
          </span>
        ))}
      </div>

      {hidden > 0 && (
        <span className="text-brand-700 ml-2 text-[10px] font-semibold tabular-nums">
          +{hidden}
        </span>
      )}
    </div>
  );
};
