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

const sidebarIcons = [{
    icon: Home,
    label: "Home",
    href: "/",
},
{
    icon: Briefcase,
    label: "Timeline",
    href: "/timeline",
},
{
    icon: Search,
    label: "Search",
    href: "/search",
},
{
    icon: Settings,
    label: "Settings",
    href: "/settings",
},
{
    icon: User,
    label: "User",
    href: "/user",
},
{
    icon: Users,
    label: "Teams",
    href: "/teams",
}
]

const priorityIcons = [{
    icon: AlertCircle,
    label: "Urgent",
    href: "/priority/urgent",
},
{
    icon: ShieldAlert,
    label: "High",
    href: "/priority/high",
},
{
    icon: AlertTriangle,
    label: "Medium",
    href: "/priority/medium",
}, {
    icon: AlertOctagon,
    label: "Low",
    href: "/priority/low",
}, {
    icon: Layers3,
    label: "Backlog",
    href: "/priority/backlog",
},
]
const Sidebar = () => {
    const [showProjects, setShowProjects] = useState(true);
    const [showPriority, setShowPriority] = useState(true);

    const { data: projects } = useGetProjectsQuery();
    const dispatch = useDispatch();
    const isSidebarCollapsed = useAppSelector(
        (state) => state.global.isSidebarCollapsed,
    );

    const sidebarClassNames = `fixed flex flex-col h-full justify-between shadow-xl transition-all duration-300 z-40 overflow-y-auto [&::-webkit-scrollbar]:none [-ms-overflow-style:none] [scrollbar-width:none] bg-brand-300 ${isSidebarCollapsed ? "w-0 hidden" : "w-64"}`;

    return (
        <div className={sidebarClassNames}>
            <div className="h-fill flex w-full flex-col justify-start">
                {/* top logo */}
                <div className="min-h[56px] bg-brand-300 z-50 flex w-64 items-center justify-between px-6 pt-3">
                    <div className="text-brand-900 text-xl font-bold">SJBLIST</div>
                    {isSidebarCollapsed ? null : (
                        <button
                            className="py-3"
                            onClick={() =>
                                dispatch(setIsSidebarCollapsed(!isSidebarCollapsed))
                            }
                        >
                            <X className="text-brand-800 rounded h-6 w-6 cursor-pointer hover:bg-brand-500" />
                        </button>
                    )}
                </div>
                {/* Team */}
                <div className="border-brand-700 flex items-center gap-5 border-y-[1.5px] px-8 py-4">
                    <Image
                        src="/logo.png"
                        width={40}
                        height={40}
                        alt="logo"
                        loading="eager"
                    />
                    <div className="flex flex-col items-start">
                        <div className="text-md text-brand-900 font-bold tracking-wide">
                            <h3 className="">Shaun Team</h3>
                        </div>
                        <div className="mt-1 flex items-start gap-2">
                            <LockIcon className="text-brand-800 mt-[0.1rem] h-3 w-3" />
                            <p className="text-brand-800 text-xs">Private</p>
                        </div>
                    </div>
                </div>
                {/* Navbar Links */}
                <nav className="z-10 w-full">
                    {sidebarIcons.map((sideicon, index) =>
                    (

                        <SidebarLink key={index} icon={sideicon.icon} label={sideicon.label} href={sideicon.href} />
                    )
                    )}
                </nav>
                {/* Projects */}
                <button onClick={() => setShowProjects((prev) => !prev)} className="flex font-medium w-full hover:bg-brand-500  items-center cursor-pointer justify-between px-8 py-3 text-brand-800">
                    <div className="flex w-full items-center gap-1">
                        {showProjects ? <FolderDot className="h-5 w-5" /> : <FolderOpenDot className="h-5 w-5" />}
                        <span className="">Projects</span>
                    </div>
                    {showProjects ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
                {showProjects && projects?.map((project) => (
                    <SidebarLink key={project.id} icon={FileText} label={project.name} href={`/projects/${project.id}`} />

                )
                )}
                {/* Priorities */}
                <button onClick={() => setShowPriority((prev) => !prev)} className="flex w-full hover:bg-brand-500 font-medium items-center cursor-pointer justify-between px-8 py-3 text-brand-800">
                    <span className="">Priority</span>
                    {showPriority ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
                {showPriority && priorityIcons.map((priorityIcon, index) => (
                    <SidebarLink key={index} icon={priorityIcon.icon} label={priorityIcon.label} href={priorityIcon.href} />
                ))}
            </div>
        </div>
    );
};
interface SidebarLinkProps {
    href: string;
    icon: LucideIcon;
    label: string;
}

const SidebarLink = ({
    href,
    icon: Icon,
    label,
}: SidebarLinkProps) => {
    const pathname = usePathname();
    const isActive =
        pathname === href || (pathname === "/" && href === "/dashboard");

    return (
        <Link href={href} className="w-full">
            <div
                className={`bg-brand-300 hover:bg-brand-500 justify-start px-8 py-3 relative flex cursor-pointer items-center gap-3 transition-colors ${isActive ? "bg-brand-100 text-brand-600" : ""}`}
            >
                {isActive && (
                    <div className="absolute top-0 left-0 h-full w-1.5 bg-blue-200" />
                )}
                <Icon className="text-brand-800 h-6 w-6" />
                <span className="text-brand-800 font-medium">{label}</span>
            </div>
        </Link>
    );
};

export default Sidebar;
