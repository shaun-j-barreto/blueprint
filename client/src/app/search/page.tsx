"use client";

import ProjectCard from "@/components/ProjectCard";
import TaskCard from "@/components/TaskCard";
import UserCard from "@/components/UserCard";
import { useSearchQuery } from "@/state/api";
import { debounce } from "lodash";
import { Search as SearchIcon, Loader2, XCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useMemo, useState } from "react";

const SearchFallback = () => (
  <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <div className="bg-brand-200 mb-12 h-14 w-full animate-pulse rounded-lg" />
    <div className="flex justify-center py-10">
      <Loader2 className="text-brand-700 h-6 w-6 animate-spin" />
    </div>
  </div>
);

const SearchContent = ({ initialQuery }: { initialQuery: string }) => {
  const [inputValue, setInputValue] = useState(initialQuery);
  const [searchTerm, setSearchTerm] = useState(initialQuery);

  const {
    data: searchResults,
    isLoading,
    isError,
  } = useSearchQuery(searchTerm, {
    skip: searchTerm.trim().length < 3,
  });

  const debouncedSetSearchTerm = useMemo(
    () => debounce((value: string) => setSearchTerm(value), 500),
    [],
  );

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    setInputValue(value);
    debouncedSetSearchTerm(value);
  };

  useEffect(() => {
    return () => debouncedSetSearchTerm.cancel();
  }, [debouncedSetSearchTerm]);

  const hasResults =
    searchResults &&
    ((searchResults.tasks && searchResults.tasks.length > 0) ||
      (searchResults.projects && searchResults.projects.length > 0) ||
      (searchResults.users && searchResults.users.length > 0));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="relative mx-auto mb-12 w-full">
        <SearchIcon className="text-brand-700 absolute top-1/2 left-0 h-6 w-6 -translate-y-1/2" />
        <input
          type="search"
          value={inputValue}
          placeholder="Search anything..."
          aria-label="Search tasks, projects and people"
          autoComplete="off"
          className="text-brand-900 placeholder-brand-700 border-brand-600 focus:border-brand-800 w-full border-b bg-transparent py-4 pr-4 pl-10 text-2xl font-light transition-all focus:ring-0 focus:outline-none"
          onChange={handleSearch}
        />
      </div>

      <div className="min-h-[200px]">
        {isLoading && (
          <div className="text-brand-800 flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {isError && (
          <div className="mx-auto flex max-w-md items-center gap-3 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            <XCircle className="h-5 w-5 flex-shrink-0" />
            <span>
              Failed to fetch search results. Check your network connection.
            </span>
          </div>
        )}

        {!isLoading &&
          !isError &&
          searchResults &&
          !hasResults &&
          searchTerm.trim().length >= 3 && (
            <div className="text-brand-900 py-10 text-center text-sm">
              No results found for{" "}
              <span className="font-medium">“{searchTerm}”</span>
            </div>
          )}

        {!isLoading && !isError && searchResults && hasResults && (
          <div className="flex flex-col space-y-12">
            {searchResults.tasks && searchResults.tasks.length > 0 && (
              <section>
                <h1 className="text-brand-900 mb-6 text-base font-bold tracking-widest uppercase">
                  Tasks
                </h1>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {searchResults.tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </section>
            )}

            {searchResults.projects && searchResults.projects.length > 0 && (
              <section>
                <h1 className="text-brand-900 mb-6 text-base font-bold tracking-widest uppercase">
                  Projects
                </h1>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {searchResults.projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </section>
            )}

            {searchResults.users && searchResults.users.length > 0 && (
              <section>
                <h1 className="text-brand-900 mb-6 text-base font-bold tracking-widest uppercase">
                  People
                </h1>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {searchResults.users.map((user) => (
                    <UserCard key={user.userId} user={user} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const SearchPageContent = () => {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") ?? "";

  // Remounting when the URL query changes keeps the input and results in
  // sync with navbar searches without an extra state-sync effect.
  return <SearchContent key={queryParam} initialQuery={queryParam} />;
};

const SearchPage = () => (
  <Suspense fallback={<SearchFallback />}>
    <SearchPageContent />
  </Suspense>
);

export default SearchPage;
