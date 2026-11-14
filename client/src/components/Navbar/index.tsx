"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsDarkMode, setIsSidebarCollapsed } from "@/state";
import { Menu, Moon, Search, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type NavbarProps = {
  isMobileSidebarOpen: boolean;
  onOpenMobileSidebar: () => void;
};

const Navbar = ({ isMobileSidebarOpen, onOpenMobileSidebar }: NavbarProps) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed,
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const term = searchTerm.trim();

    router.push(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
  };

  return (
    <div className="bg-brand-200 border-brand-500/80 flex min-h-14 items-center justify-between gap-3 border-b px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation"
          aria-controls="app-sidebar"
          aria-expanded={isMobileSidebarOpen}
          className="text-brand-800 hover:bg-brand-400 hover:text-brand-900 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none min-[1024px]:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {isSidebarCollapsed && (
          <button
            type="button"
            onClick={() => dispatch(setIsSidebarCollapsed(false))}
            aria-label="Open sidebar"
            className="text-brand-800 hover:bg-brand-400 hover:text-brand-900 hidden h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none min-[1024px]:flex"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <form
          role="search"
          onSubmit={handleSearch}
          className="relative flex h-9 w-36 items-center min-[1024px]:w-64 sm:w-56"
        >
          <Search
            className="text-brand-700 pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search tasks, projects, people…"
            aria-label="Search tasks, projects and people"
            className="border-brand-500/80 bg-brand-500 text-brand-900 placeholder:text-brand-700 focus:border-brand-600 focus:bg-brand-100 h-full w-full rounded-lg border pr-2 pl-8 text-xs transition-colors focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          />
        </form>
      </div>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => dispatch(setIsDarkMode(!isDarkMode))}
          aria-label={
            isDarkMode ? "Switch to light mode" : "Switch to dark mode"
          }
          className="text-brand-800 hover:bg-brand-400 hover:text-brand-900 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default Navbar;
