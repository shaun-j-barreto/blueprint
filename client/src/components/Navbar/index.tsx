"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux";
import { authClient, useSession } from "@/lib/auth-client";
import { setIsDarkMode, setIsSidebarCollapsed } from "@/state";
import { ChevronDown, LogOut, Menu, Moon, Search, Sun, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

type NavbarProps = {
  isMobileSidebarOpen: boolean;
  onOpenMobileSidebar: () => void;
};

const initialsFor = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";

const Navbar = ({ isMobileSidebarOpen, onOpenMobileSidebar }: NavbarProps) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const [searchTerm, setSearchTerm] = useState("");
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed,
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const term = searchTerm.trim();

    router.push(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
  };

  const handleSignOut = async () => {
    setIsAccountOpen(false);

    try {
      await authClient.signOut();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  // Close the account menu on outside clicks and Escape.
  useEffect(() => {
    if (!isAccountOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsAccountOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountOpen]);

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

        <div ref={accountRef} className="relative">
          <button
            type="button"
            onClick={() => setIsAccountOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={isAccountOpen}
            aria-label="Account menu"
            className="border-brand-500/80 text-brand-800 hover:bg-brand-400 hover:text-brand-900 flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-transparent px-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none min-[420px]:pr-2"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
              {initialsFor(user?.name ?? "")}
            </span>
            <span className="hidden max-w-[110px] truncate text-xs font-semibold min-[420px]:block">
              {user?.name ?? "Account"}
            </span>
            <ChevronDown
              className={`hidden h-3.5 w-3.5 shrink-0 transition-transform min-[420px]:block ${
                isAccountOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>

          {isAccountOpen && (
            <div
              role="menu"
              aria-label="Account"
              className="border-brand-500/80 bg-brand-100 absolute top-full right-0 z-50 mt-1.5 w-60 overflow-hidden rounded-xl border shadow-lg shadow-slate-900/10"
            >
              <div className="border-brand-500/70 border-b px-3 py-2.5">
                <p className="text-brand-900 truncate text-xs font-semibold">
                  {user?.name ?? "Signed in"}
                </p>
                <p className="text-brand-700 mt-0.5 truncate text-[11px]">
                  {user?.email ?? ""}
                </p>
              </div>
              <Link
                href="/user"
                role="menuitem"
                onClick={() => setIsAccountOpen(false)}
                className="text-brand-800 hover:bg-brand-300 flex w-full items-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none focus-visible:ring-inset"
              >
                <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                View profile
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={handleSignOut}
                className="text-brand-800 hover:bg-brand-300 flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none focus-visible:ring-inset"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
