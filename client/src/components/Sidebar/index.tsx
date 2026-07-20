"use client";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsSidebarCollapsed } from "@/state";
import { useGetProjectsQuery } from "@/state/api";
import { AlertCircle, AlertOctagon, AlertTriangle, Briefcase, ChevronDown, ChevronUp, FileText, FolderDot, FolderOpenDot, Home, Layers3, LockIcon, LucideIcon, Search, Settings, ShieldAlert, User, Users, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useDispatch } from "react-redux";

const sidebarIcons = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Briefcase, label: "Timeline", href: "/timeline" },
    { icon: Search, label: "Search", href: "/search" },
    { icon: Settings, label: "Settings", href: "/settings" },
    { icon: User, label: "User", href: "/user" },
    { icon: Users, label: "Teams", href: "/teams" }
];

const priorityIcons = [
    { icon: AlertCircle, label: "Urgent", href: "/priority/urgent" },
    { icon: ShieldAlert, label: "High", href: "/priority/high" },
    { icon: AlertTriangle, label: "Medium", href: "/priority/medium" },
    { icon: AlertOctagon, label: "Low", href: "/priority/low" },
    { icon: Layers3, label: "Backlog", href: "/priority/backlog" },
];

const Sidebar = () => {
    const [showProjects, setShowProjects] = useState(true);
    const [showPriority, setShowPriority] = useState(true);

    const { data: projects } = useGetProjectsQuery();
    const dispatch = useDispatch();
    const isSidebarCollapsed = useAppSelector(
        (state) => state.global.isSidebarCollapsed,
    );

    // Kept your exact w-64 constraint to prevent layout shift
    const sidebarClassNames = `fixed flex flex-col h-full justify-between shadow-xl transition-all duration-300 z-40 overflow-y-auto [&::-webkit-scrollbar]:none [-ms-overflow-style:none] [scrollbar-width:none] bg-brand-300 ${isSidebarCollapsed ? "w-0 hidden" : "w-64"}`;

    return (
        <div className={sidebarClassNames}>
            <div className="flex h-full w-full flex-col justify-start pb-6">

                {/* Top Logo */}
                {/* Fixed invalid tailwind 'min-h[56px]' to 'min-h-[56px]' but kept exact dimension */}
                <div className="z-50 flex min-h-[56px] w-64 items-center justify-between px-6 pt-3">
                    <div className="text-xl font-bold tracking-tight text-brand-900">SJBLIST</div>
                    {isSidebarCollapsed ? null : (
                        <button
                            className="rounded-md p-1.5 transition-colors hover:bg-brand-400/50"
                            onClick={() => dispatch(setIsSidebarCollapsed(!isSidebarCollapsed))}
                        >
                            <X className="h-5 w-5 cursor-pointer text-brand-800" />
                        </button>
                    )}
                </div>

                {/* Team */}
                {/* Switched to a cleaner bottom border instead of heavy Y borders */}
                <div className="mt-2 flex items-center gap-4 border-b border-brand-400/40 px-8 py-5">
                    <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-brand-400/50 shadow-sm">
                        <Image
                            src="/logo.png"
                            width={40}
                            height={40}
                            alt="logo"
                            loading="eager"
                            className="object-cover"
                        />
                    </div>
                    <div className="flex flex-col items-start">
                        <h3 className="text-sm font-bold tracking-wide text-brand-900">
                            Shaun Team
                        </h3>
                        <div className="mt-0.5 flex items-center gap-1.5 rounded-full bg-brand-400/30 px-2 py-0.5">
                            <LockIcon className="h-3 w-3 text-brand-700" />
                            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700">
                                Private
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navbar Links */}
                <nav className="z-10 mt-4 flex w-full flex-col gap-0.5">
                    {sidebarIcons.map((sideicon, index) => (
                        <SidebarLink key={index} icon={sideicon.icon} label={sideicon.label} href={sideicon.href} />
                    ))}
                </nav>

                {/* Projects */}
                <div className="mt-4 flex flex-col">
                    <button onClick={() => setShowProjects((prev) => !prev)} className="group flex w-full cursor-pointer items-center justify-between px-8 py-3 transition-colors hover:text-brand-900">
                        <div className="flex w-full items-center gap-2 text-brand-800 group-hover:text-brand-900">
                            {showProjects ? <FolderOpenDot className="h-4 w-4" /> : <FolderDot className="h-4 w-4" />}
                            <span className="text-xs font-bold uppercase tracking-widest">Projects</span>
                        </div>
                        {showProjects ? <ChevronUp className="h-4 w-4 text-brand-800 group-hover:text-brand-900" /> : <ChevronDown className="h-4 w-4 text-brand-800 group-hover:text-brand-900" />}
                    </button>
                    <div className="flex flex-col gap-0.5">
                        {showProjects && projects?.map((project) => (
                            <SidebarLink key={project.id} icon={FileText} label={project.name} href={`/projects/${project.id}`} />
                        ))}
                    </div>
                </div>

                {/* Priorities */}
                <div className="mt-2 flex flex-col">
                    <button onClick={() => setShowPriority((prev) => !prev)} className="group flex w-full cursor-pointer items-center justify-between px-8 py-3 transition-colors hover:text-brand-900">
                        <span className="text-xs font-bold uppercase tracking-widest text-brand-800 group-hover:text-brand-900">Priority</span>
                        {showPriority ? <ChevronUp className="h-4 w-4 text-brand-800 group-hover:text-brand-900" /> : <ChevronDown className="h-4 w-4 text-brand-800 group-hover:text-brand-900" />}
                    </button>
                    <div className="flex flex-col gap-0.5">
                        {showPriority && priorityIcons.map((priorityIcon, index) => (
                            <SidebarLink key={index} icon={priorityIcon.icon} label={priorityIcon.label} href={priorityIcon.href} />
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

interface SidebarLinkProps {
    href: string;
    icon: LucideIcon;
    label: string;
}

const SidebarLink = ({ href, icon: Icon, label }: SidebarLinkProps) => {
    const pathname = usePathname();
    const isActive = pathname === href || (pathname === "/" && href === "/dashboard");

    return (
        <Link href={href} className="w-full">
            <div className="w-full px-4 py-0.5">
                <div
                    className={`relative flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 transition-all duration-200 ${isActive
                        ? "bg-brand-100/60 text-brand-900 shadow-sm"
                        : "text-brand-800 hover:bg-brand-600/40 hover:text-brand-900"
                        }`}
                >
                    {/* Modern subtle active indicator */}
                    {isActive && (
                        <div className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-blue-500" />
                    )}
                    <Icon className={`h-5 w-5 ${isActive ? "text-brand-900" : "text-brand-800"}`} />
                    <span className="text-sm font-semibold">{label}</span>
                </div>
            </div>
        </Link>
    );
};

export default Sidebar;