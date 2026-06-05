import React from "react";
import { Menu, Moon, Search, Settings, Sun } from "lucide-react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsDarkMode, setIsSidebarCollapsed } from "@/state";

const Navbar = () => {
    const dispatch = useAppDispatch();
    const isSidebarCollapsed = useAppSelector(
        (state) => state.global.isSidebarCollapsed,
    );
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
    return (
        <div className="bg-brand-200 flex items-center justify-between px-4 py-3">
            {/* Search bar */}
            <div className="flex items-center gap-8">
                {!isSidebarCollapsed ? null : (
                    <button
                        onClick={() => dispatch(setIsSidebarCollapsed(!isSidebarCollapsed))}
                    >
                        <Menu className="text-brand-800 h-6 w-6 cursor-pointer" />
                    </button>
                )}
                <div className="relative flex h-min w-50">
                    <Search className="text-brand-700 absolute top-1/2 left-1 mr-2 h-5 w-5 -translate-y-1/2 transform cursor-pointer" />
                    <input
                        className="bg-brand-500 placeholder-brand-800 focus-outline-none text-brand-800 w-full rounded border-none p-2 pl-8 focus:border-transparent"
                        type="search"
                        placeholder="Search.."
                    />
                </div>
            </div>
            {/* Icons(theme and settings) */}
            <div className="flex items-center">
                <button
                    onClick={() => dispatch(setIsDarkMode(!isDarkMode))}
                    className="hover:bg-brand-500 h-min w-min rounded p-2"
                >{isDarkMode ? <Sun className="text-brand-800 h-6 w-6 cursor-pointer" /> : <Moon className="text-brand-800 h-6 w-6 cursor-pointer" />}</button>
                <Link
                    href="/settings"
                    className="hover:bg-brand-500 h-min w-min rounded p-2"
                >
                    <Settings className="text-brand-800 h-6 w-6 cursor-pointer" />
                </Link>
            </div>
        </div>
    );
};

export default Navbar;
