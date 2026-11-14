"use client";

import {
  CardSkeletons,
  CountPill,
  EmptyState,
  ErrorPanel,
  FilterTabs,
  PageHeader,
  PersonDrawer,
  SearchInput,
  SortSelect,
  StatSkeletons,
  StatTile,
  TeamCard,
  TeamDrawer,
  CONTROL_SURFACE_CLASS,
  type FilterOption,
  type SortOption,
} from "@/components/directory";
import {
  buildTeamDirectory,
  displayName,
  matchesSearch,
} from "@/lib/directory";
import {
  useGetAllTasksQuery,
  useGetProjectsQuery,
  useGetTeamsQuery,
  useGetUsersQuery,
  type User,
} from "@/state/api";
import { FolderKanban, Layers3, Users, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

type TeamFilter = "all" | "open" | "no-projects";
type TeamSort = "name" | "members" | "open";

const SORT_OPTIONS: SortOption<TeamSort>[] = [
  { value: "name", label: "Name A–Z" },
  { value: "members", label: "Most members" },
  { value: "open", label: "Most open tasks" },
];

const TeamsPage = () => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TeamFilter>("all");
  const [sort, setSort] = useState<TeamSort>("name");
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const {
    data: teams = [],
    isLoading: isTeamsLoading,
    isError: isTeamsError,
    refetch: refetchTeams,
  } = useGetTeamsQuery();

  const {
    data: users = [],
    isLoading: isUsersLoading,
    isError: isUsersError,
    refetch: refetchUsers,
  } = useGetUsersQuery();

  const {
    data: tasks = [],
    isLoading: isTasksLoading,
    isError: isTasksError,
    refetch: refetchTasks,
  } = useGetAllTasksQuery();

  const {
    data: projects = [],
    isLoading: isProjectsLoading,
    isError: isProjectsError,
    refetch: refetchProjects,
  } = useGetProjectsQuery();

  const teamEntries = useMemo(
    () => buildTeamDirectory(teams, users, tasks, projects),
    [teams, users, tasks, projects],
  );

  const summary = useMemo(() => {
    const memberIds = new Set<number>();
    const projectIds = new Set<number>();
    let open = 0;
    let overdue = 0;

    teamEntries.forEach((entry) => {
      entry.members.forEach((member) => {
        if (typeof member.userId === "number") {
          memberIds.add(member.userId);
        }
      });

      entry.stats.projectIds.forEach((projectId) => {
        projectIds.add(projectId);
      });

      open += entry.stats.open;
      overdue += entry.stats.overdue;
    });

    const unassigned = users.filter(
      (user) => typeof user.userId === "number" && !memberIds.has(user.userId),
    ).length;

    return {
      members: memberIds.size,
      projects: projectIds.size,
      open,
      overdue,
      unassigned,
      withOpen: teamEntries.filter((entry) => entry.stats.open > 0).length,
      withoutProjects: teamEntries.filter(
        (entry) => entry.stats.projectCount === 0,
      ).length,
    };
  }, [teamEntries, users]);

  const filterOptions: FilterOption<TeamFilter>[] = [
    { value: "all", label: "All", count: teamEntries.length },
    { value: "open", label: "With open work", count: summary.withOpen },
    {
      value: "no-projects",
      label: "No projects",
      count: summary.withoutProjects,
    },
  ];

  const visibleTeams = useMemo(() => {
    const filtered = teamEntries.filter((entry) => {
      const { team, stats, members, productOwner, projectManager, projects } =
        entry;

      if (
        !matchesSearch(query, [
          team.teamName,
          displayName(team.teamName),
          productOwner?.username,
          projectManager?.username,
          ...members.map((member) => member.username),
          ...projects.map((project) => project.name),
        ])
      ) {
        return false;
      }

      if (filter === "open") return stats.open > 0;
      if (filter === "no-projects") return stats.projectCount === 0;

      return true;
    });

    return filtered.sort((a, b) => {
      if (sort === "members") {
        const memberDelta = b.stats.memberCount - a.stats.memberCount;
        if (memberDelta !== 0) return memberDelta;
      }

      if (sort === "open") {
        const openDelta = b.stats.open - a.stats.open;
        if (openDelta !== 0) return openDelta;
      }

      return a.team.teamName.localeCompare(b.team.teamName);
    });
  }, [teamEntries, query, filter, sort]);

  const selectedEntry = useMemo(
    () => teamEntries.find((entry) => entry.team.id === selectedTeamId) ?? null,
    [teamEntries, selectedTeamId],
  );

  const isLoading =
    isTeamsLoading || isUsersLoading || isTasksLoading || isProjectsLoading;
  const isError =
    isTeamsError || isUsersError || isTasksError || isProjectsError;

  const retry = () => {
    void refetchTeams();
    void refetchUsers();
    void refetchTasks();
    void refetchProjects();
  };

  if (isLoading) {
    return (
      <div className="px-4 pb-8 xl:px-6">
        <PageHeader
          eyebrow="Organization"
          title="Teams"
          subtitle="Groups that own projects and delivery."
        />
        <StatSkeletons />
        <CardSkeletons variant="team" count={4} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-4 pb-8 xl:px-6">
        <PageHeader
          eyebrow="Organization"
          title="Teams"
          subtitle="Groups that own projects and delivery."
        />
        <ErrorPanel
          title="Could not load teams"
          hint="An error occurred while fetching teams, people, tasks, or projects."
          onRetry={retry}
        />
      </div>
    );
  }

  return (
    <div className="px-4 pb-8 xl:px-6">
      <PageHeader
        eyebrow="Organization"
        title="Teams"
        subtitle="Groups that own projects and delivery."
        right={
          <CountPill>
            {teamEntries.length} {teamEntries.length === 1 ? "team" : "teams"} ·{" "}
            {summary.members} {summary.members === 1 ? "person" : "people"}
          </CountPill>
        }
      />

      <section
        aria-label="Teams summary"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatTile
          label="Teams"
          value={teamEntries.length}
          hint={`${summary.withOpen} with open work`}
          icon={<Users className="h-4 w-4" />}
        />
        <StatTile
          label="Members"
          value={summary.members}
          hint={`${summary.unassigned} people not on a team`}
          icon={<UsersRound className="h-4 w-4" />}
        />
        <StatTile
          label="Projects covered"
          value={summary.projects}
          hint={`${summary.withoutProjects} teams with no projects`}
          icon={<FolderKanban className="h-4 w-4" />}
        />
        <StatTile
          label="Open work"
          value={summary.open}
          hint={`${summary.overdue} overdue`}
          icon={<Layers3 className="h-4 w-4" />}
          tone={summary.overdue > 0 ? "warning" : "default"}
        />
      </section>

      <section
        aria-label="Teams controls"
        className={`${CONTROL_SURFACE_CLASS} mt-4`}
      >
        <SearchInput
          value={query}
          onChange={setQuery}
          label="Search teams"
          placeholder="Search by team, person, or project…"
          className="w-full lg:max-w-sm"
        />

        <div className="flex flex-wrap items-center gap-2">
          <FilterTabs
            options={filterOptions}
            value={filter}
            onChange={setFilter}
            label="Filter teams"
          />
          <SortSelect
            options={SORT_OPTIONS}
            value={sort}
            onChange={setSort}
            label="Sort teams"
          />
        </div>
      </section>

      <section aria-labelledby="teams-list" className="mt-4">
        <h2 id="teams-list" className="sr-only">
          Teams
        </h2>

        {visibleTeams.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {visibleTeams.map((entry) => (
              <TeamCard
                key={entry.team.id}
                entry={entry}
                onSelect={(selected) => setSelectedTeamId(selected.team.id)}
              />
            ))}
          </div>
        ) : teamEntries.length === 0 ? (
          <EmptyState
            title="No teams yet"
            hint="Teams will appear here once they are created in your workspace."
            icon={<Users className="h-4 w-4" aria-hidden="true" />}
          />
        ) : (
          <EmptyState
            title="No teams match"
            hint="Try a different search term or filter."
            icon={<Users className="h-4 w-4" aria-hidden="true" />}
            action={
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
                className="border-brand-500 text-brand-800 hover:bg-brand-300 cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
              >
                Clear search and filters
              </button>
            }
          />
        )}
      </section>

      <TeamDrawer
        entry={selectedEntry}
        tasks={tasks}
        onClose={() => setSelectedTeamId(null)}
        onSelectPerson={setSelectedUser}
      />

      <PersonDrawer
        user={selectedUser}
        teams={teams}
        tasks={tasks}
        projects={projects}
        onClose={() => setSelectedUser(null)}
        layer={60}
      />
    </div>
  );
};

export default TeamsPage;
