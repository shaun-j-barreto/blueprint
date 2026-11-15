"use client";

import {
  CardSkeletons,
  CountPill,
  EmptyState,
  ErrorPanel,
  FilterTabs,
  PageHeader,
  PersonCard,
  PersonDrawer,
  SearchInput,
  SortSelect,
  StatSkeletons,
  StatTile,
  CONTROL_SURFACE_CLASS,
  type FilterOption,
  type SortOption,
} from "@/components/directory";
import {
  buildPeopleDirectory,
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
import { ShieldCheck, UserRoundX, Users, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

type PersonFilter = "all" | "leaders" | "unassigned" | "open";
type PersonSort = "name" | "open" | "completion";

const SORT_OPTIONS: SortOption<PersonSort>[] = [
  { value: "name", label: "Name A–Z" },
  { value: "open", label: "Most open tasks" },
  { value: "completion", label: "Completion" },
];

const PeoplePage = () => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PersonFilter>("all");
  const [sort, setSort] = useState<PersonSort>("name");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const {
    data: users = [],
    isLoading: isUsersLoading,
    isError: isUsersError,
    refetch: refetchUsers,
  } = useGetUsersQuery();

  const {
    data: teams = [],
    isLoading: isTeamsLoading,
    isError: isTeamsError,
    refetch: refetchTeams,
  } = useGetTeamsQuery();

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

  const people = useMemo(
    () => buildPeopleDirectory(users, teams, tasks),
    [users, teams, tasks],
  );

  const summary = useMemo(() => {
    const leaders = people.filter((person) => person.role !== "Member").length;
    const unassigned = people.filter((person) => !person.team).length;
    const withOpenWork = people.filter(
      (person) => person.stats.open > 0,
    ).length;
    const totalOpen = people.reduce(
      (total, person) => total + person.stats.open,
      0,
    );

    return { leaders, unassigned, withOpenWork, totalOpen };
  }, [people]);

  const filterOptions: FilterOption<PersonFilter>[] = [
    { value: "all", label: "All", count: people.length },
    { value: "leaders", label: "Leaders", count: summary.leaders },
    { value: "open", label: "With open work", count: summary.withOpenWork },
    { value: "unassigned", label: "Unassigned", count: summary.unassigned },
  ];

  const visiblePeople = useMemo(() => {
    const filtered = people.filter((person) => {
      const { user, team, role, stats } = person;

      if (
        !matchesSearch(query, [
          displayName(user.username),
          user.username,
          team?.teamName,
          role,
        ])
      ) {
        return false;
      }

      if (filter === "leaders") return role !== "Member";
      if (filter === "unassigned") return !team;
      if (filter === "open") return stats.open > 0;

      return true;
    });

    return filtered.sort((a, b) => {
      if (sort === "open") {
        const openDelta = b.stats.open - a.stats.open;
        if (openDelta !== 0) return openDelta;
      }

      if (sort === "completion") {
        const completionDelta = b.stats.completionRate - a.stats.completionRate;
        if (completionDelta !== 0) return completionDelta;
      }

      return displayName(a.user.username).localeCompare(
        displayName(b.user.username),
      );
    });
  }, [people, query, filter, sort]);

  const isLoading =
    isUsersLoading || isTeamsLoading || isTasksLoading || isProjectsLoading;
  const isError =
    isUsersError || isTeamsError || isTasksError || isProjectsError;

  const retry = () => {
    void refetchUsers();
    void refetchTeams();
    void refetchTasks();
    void refetchProjects();
  };

  if (isLoading) {
    return (
      <div className="px-4 pb-8 xl:px-6">
        <PageHeader
          eyebrow="Directory"
          title="People"
          subtitle="Everyone working across your projects."
        />
        <StatSkeletons />
        <CardSkeletons variant="person" count={6} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-4 pb-8 xl:px-6">
        <PageHeader
          eyebrow="Directory"
          title="People"
          subtitle="Everyone working across your projects."
        />
        <ErrorPanel
          title="Could not load people"
          hint="An error occurred while fetching people, teams, tasks, or projects."
          onRetry={retry}
        />
      </div>
    );
  }

  return (
    <div className="px-4 pb-8 xl:px-6">
      <PageHeader
        eyebrow="Directory"
        title="People"
        subtitle="Everyone working across your projects."
        right={
          <CountPill>
            {users.length} {users.length === 1 ? "person" : "people"} ·{" "}
            {teams.length} {teams.length === 1 ? "team" : "teams"}
          </CountPill>
        }
      />

      <section
        aria-label="People summary"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatTile
          label="People"
          value={users.length}
          hint={`${summary.withOpenWork} with open work`}
          icon={<Users className="h-4 w-4" />}
        />
        <StatTile
          label="Teams"
          value={teams.length}
          hint={`${summary.totalOpen} open tasks across the directory`}
          icon={<UsersRound className="h-4 w-4" />}
        />
        <StatTile
          label="Owners & managers"
          value={summary.leaders}
          hint="Product owners and project managers"
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <StatTile
          label="Unassigned"
          value={summary.unassigned}
          hint="Not attached to a team"
          icon={<UserRoundX className="h-4 w-4" />}
          tone={summary.unassigned > 0 ? "warning" : "default"}
        />
      </section>

      <section
        aria-label="People controls"
        className={`${CONTROL_SURFACE_CLASS} mt-4`}
      >
        <SearchInput
          value={query}
          onChange={setQuery}
          label="Search people"
          placeholder="Search by name, team, or role…"
          className="w-full lg:max-w-sm"
        />

        <div className="flex flex-wrap items-center gap-2">
          <FilterTabs
            options={filterOptions}
            value={filter}
            onChange={setFilter}
            label="Filter people"
          />
          <SortSelect
            options={SORT_OPTIONS}
            value={sort}
            onChange={setSort}
            label="Sort people"
          />
        </div>
      </section>

      <section aria-labelledby="people-list" className="mt-4">
        <h2 id="people-list" className="sr-only">
          People
        </h2>

        {visiblePeople.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visiblePeople.map((person, index) => (
              <PersonCard
                key={person.user.id ?? `${person.user.username}-${index}`}
                person={person}
                onSelect={(selected) => setSelectedUser(selected.user)}
              />
            ))}
          </div>
        ) : people.length === 0 ? (
          <EmptyState
            title="No people yet"
            hint="People will appear here once they join your workspace."
            icon={<Users className="h-4 w-4" aria-hidden="true" />}
          />
        ) : (
          <EmptyState
            title="No people match"
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

      <PersonDrawer
        user={selectedUser}
        teams={teams}
        tasks={tasks}
        projects={projects}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
};

export default PeoplePage;
