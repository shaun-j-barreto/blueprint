"use client";

import Header from "@/components/Header";
import ProjectCard from "@/components/ProjectCard";
import TaskCard from "@/components/TaskCard";
import UserCard from "@/components/UserCard";
import { useSearchQuery } from "@/state/api";
import { debounce } from "lodash";
import { Search as SearchIcon, Loader2, XCircle } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

const Search = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const {
        data: searchResults,
        isLoading,
        isError,
    } = useSearchQuery(searchTerm, {
        skip: searchTerm.length < 3,
    });

    const debouncedSetSearchTerm = useMemo(
        () => debounce((value: string) => setSearchTerm(value), 500),
        []
    );

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        debouncedSetSearchTerm(event.target.value);
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
            {/* Minimalist Search Input - Expanded Width */}
            <div className="relative mb-12 w-full mx-auto">
                <SearchIcon className="absolute left-0 top-1/2 h-6 w-6 -translate-y-1/2 text-brand-700" />
                <input
                    type="text"
                    placeholder="Search anything..."
                    className="w-full bg-transparent py-4 pl-10 pr-4 text-2xl font-light text-brand-900 placeholder-brand-700 transition-all border-b border-brand-600 focus:border-brand-800 focus:outline-none focus:ring-0"
                    onChange={handleSearch}
                />
            </div>

            {/* State Indicators */}
            <div className="min-h-[200px]">
                {isLoading && (
                    <div className="flex justify-center py-10 text-brand-800">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                )}

                {isError && (
                    <div className="mx-auto flex max-w-md items-center gap-3 rounded bg-red-50 p-4 text-sm text-red-600">
                        <XCircle className="h-5 w-5 flex-shrink-0" />
                        <span>Failed to fetch search results. Check your network connection.</span>
                    </div>
                )}

                {!isLoading && !isError && searchResults && !hasResults && searchTerm.length >= 3 && (
                    <div className="py-10 text-center text-sm text-brand-900">
                        No results found for <span className="font-medium text-gray-900">"{searchTerm}"</span>
                    </div>
                )}

                {/* Mobile-Friendly Grid Feed */}
                {!isLoading && !isError && searchResults && hasResults && (
                    <div className="flex flex-col space-y-12">

                        {searchResults.tasks && searchResults.tasks.length > 0 && (
                            <section>
                                <h1 className="mb-6 text-base font-bold uppercase tracking-widest text-brand-900">
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
                                <h1 className="mb-6 text-base font-bold uppercase tracking-widest text-brand-900">
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
                                <h1 className="mb-6 text-base font-bold uppercase tracking-widest text-brand-900">
                                    People
                                </h1>
                                {/* Users often require less width, utilizing a 4-column grid on large screens */}
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

export default Search;