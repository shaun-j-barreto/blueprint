import {
  Status,
  type Project,
  type Task,
  type Team,
  type User,
} from "@/state/api";
import { priorityRank, taskDateInfo } from "@/lib/taskStyles";

export type DirectoryRole = "Product owner" | "Project manager" | "Member";

export type PersonStats = {
  assigned: number;
  open: number;
  completed: number;
  overdue: number;
  authored: number;
  completionRate: number;
  projectIds: number[];
};

export type PersonEntry = {
  user: User;
  team?: Team;
  role: DirectoryRole;
  stats: PersonStats;
};

export type TeamStats = {
  memberCount: number;
  projectCount: number;
  projectIds: number[];
  assigned: number;
  open: number;
  completed: number;
  overdue: number;
  completionRate: number;
  statusCounts: Record<string, number>;
};

export type TeamEntry = {
  team: Team;
  stats: TeamStats;
  members: User[];
  productOwner?: User;
  projectManager?: User;
  projects: Pick<Project, "id" | "name">[];
};

export const percent = (part: number, total: number): number =>
  total > 0 ? Math.round((part / total) * 100) : 0;

/**
 * The database only stores a username. Turning camelCase and separators into
 * words gives cards a readable display name without inventing new data.
 */
export const displayName = (value?: string | null): string => {
  const name = (value ?? "").trim();
  if (!name) return "Unknown";

  return (
    name
      .replace(/[_-]+/g, " ")
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/\s+/g, " ")
      .trim() || name
  );
};

export const initialsFor = (value?: string | null): string => {
  const name = displayName(value);

  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  );
};

export const matchesSearch = (
  query: string,
  values: Array<string | null | undefined>,
): boolean => {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return values.some((value) => value?.toLowerCase().includes(needle));
};

const emptyPersonStats = (): PersonStats => ({
  assigned: 0,
  open: 0,
  completed: 0,
  overdue: 0,
  authored: 0,
  completionRate: 0,
  projectIds: [],
});

const emptyTeamStats = (): TeamStats => ({
  memberCount: 0,
  projectCount: 0,
  projectIds: [],
  assigned: 0,
  open: 0,
  completed: 0,
  overdue: 0,
  completionRate: 0,
  statusCounts: {},
});

/** Aggregates assigned/authored workload for every user id found in tasks. */
export const personStatsById = (tasks: Task[]): Map<number, PersonStats> => {
  const stats = new Map<number, PersonStats>();

  const entryFor = (userId: number): PersonStats => {
    let current = stats.get(userId);

    if (!current) {
      current = emptyPersonStats();
      stats.set(userId, current);
    }

    return current;
  };

  const addProject = (target: PersonStats, projectId: number) => {
    if (!target.projectIds.includes(projectId)) {
      target.projectIds.push(projectId);
    }
  };

  tasks.forEach((task) => {
    const assignedId = task.assignedUserId;

    if (typeof assignedId === "number" && assignedId > 0) {
      const current = entryFor(assignedId);

      current.assigned += 1;
      addProject(current, task.projectId);

      if (task.status === Status.Completed) {
        current.completed += 1;
      } else {
        current.open += 1;

        if (taskDateInfo(task).overdue) {
          current.overdue += 1;
        }
      }
    }

    const authorId = task.authorUserId;

    if (typeof authorId === "number" && authorId > 0) {
      const current = entryFor(authorId);

      current.authored += 1;
      addProject(current, task.projectId);
    }
  });

  stats.forEach((current) => {
    current.completionRate = percent(current.completed, current.assigned);
  });

  return stats;
};

export const roleForUser = (
  userId: number | undefined,
  teams: Team[],
): DirectoryRole => {
  if (typeof userId !== "number") return "Member";

  if (teams.some((team) => team.productOwnerUserId === userId)) {
    return "Product owner";
  }

  if (teams.some((team) => team.projectManagerUserId === userId)) {
    return "Project manager";
  }

  return "Member";
};

export const teamForUser = (user: User, teams: Team[]): Team | undefined => {
  if (typeof user.teamId === "number") {
    const byId = teams.find((team) => team.id === user.teamId);
    if (byId) return byId;
  }

  return teams.find((team) =>
    team.users?.some((member) => member.userId === user.userId),
  );
};

/** Member ids come from the enriched team payload, with a `teamId` fallback. */
export const teamMemberIds = (team: Team, users: User[]): Set<number> => {
  const ids = new Set<number>();

  team.users?.forEach((member) => {
    if (typeof member.userId === "number") ids.add(member.userId);
  });

  users.forEach((user) => {
    if (user.teamId === team.id && typeof user.userId === "number") {
      ids.add(user.userId);
    }
  });

  return ids;
};

export const teamMembers = (team: Team, users: User[]): User[] => {
  const ids = teamMemberIds(team, users);

  return users.filter(
    (user) => typeof user.userId === "number" && ids.has(user.userId),
  );
};

export const buildPeopleDirectory = (
  users: User[],
  teams: Team[],
  tasks: Task[],
): PersonEntry[] => {
  const statsById = personStatsById(tasks);

  return users.map((user) => {
    const stats =
      (typeof user.userId === "number"
        ? statsById.get(user.userId)
        : undefined) ?? emptyPersonStats();

    return {
      user,
      team: teamForUser(user, teams),
      role: roleForUser(user.userId, teams),
      stats,
    };
  });
};

export const teamStats = (
  team: Team,
  users: User[],
  tasks: Task[],
): TeamStats => {
  const memberIds = teamMemberIds(team, users);
  const stats = emptyTeamStats();

  stats.memberCount = memberIds.size;

  const projectIds = new Set<number>(
    (team.projects ?? []).map((project) => project.id),
  );

  tasks.forEach((task) => {
    const assignedId = task.assignedUserId;
    if (typeof assignedId !== "number" || !memberIds.has(assignedId)) return;

    const statusKey = task.status ?? "No status";

    stats.assigned += 1;
    stats.statusCounts[statusKey] = (stats.statusCounts[statusKey] ?? 0) + 1;
    projectIds.add(task.projectId);

    if (task.status === Status.Completed) {
      stats.completed += 1;
    } else {
      stats.open += 1;

      if (taskDateInfo(task).overdue) {
        stats.overdue += 1;
      }
    }
  });

  stats.projectIds = Array.from(projectIds);
  stats.projectCount = stats.projectIds.length;
  stats.completionRate = percent(stats.completed, stats.assigned);

  return stats;
};

export const buildTeamDirectory = (
  teams: Team[],
  users: User[],
  tasks: Task[],
  projects: Project[] = [],
): TeamEntry[] => {
  const usersById = new Map<number, User>();
  const projectNameById = new Map(
    projects.map((project) => [project.id, project.name]),
  );

  users.forEach((user) => {
    if (typeof user.userId === "number") {
      usersById.set(user.userId, user);
    }
  });

  return teams.map((team) => {
    const stats = teamStats(team, users, tasks);
    const members = teamMembers(team, users);

    return {
      team,
      stats,
      members,
      productOwner:
        typeof team.productOwnerUserId === "number"
          ? usersById.get(team.productOwnerUserId)
          : undefined,
      projectManager:
        typeof team.projectManagerUserId === "number"
          ? usersById.get(team.projectManagerUserId)
          : undefined,
      projects: stats.projectIds
        .map((projectId) => ({
          id: projectId,
          name: projectNameById.get(projectId) ?? `Project ${projectId}`,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  });
};

export const dueTimestamp = (task: Pick<Task, "dueDate">): number => {
  if (!task.dueDate) return Number.MAX_SAFE_INTEGER;

  const time = new Date(task.dueDate).getTime();

  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
};

/** Open and overdue work first, then priority and due date. */
export const sortTasksForDrawer = (tasks: Task[]): Task[] =>
  [...tasks].sort((a, b) => {
    const completedDelta =
      Number(a.status === Status.Completed) -
      Number(b.status === Status.Completed);
    if (completedDelta !== 0) return completedDelta;

    const overdueDelta =
      Number(taskDateInfo(b).overdue) - Number(taskDateInfo(a).overdue);
    if (overdueDelta !== 0) return overdueDelta;

    const priorityDelta =
      (priorityRank[a.priority ?? ""] ?? 99) -
      (priorityRank[b.priority ?? ""] ?? 99);
    if (priorityDelta !== 0) return priorityDelta;

    return dueTimestamp(a) - dueTimestamp(b);
  });
