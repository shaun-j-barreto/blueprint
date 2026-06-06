import Header from "@/components/Header";
import { Clock, Filter, Grid3X3, List, Share2, Table } from "lucide-react";
import React, { useState } from "react";

type Props = {
    activeTab: string;
    setActiveTab: (tabName: string) => void;
};
const TAB_CONFIG = [
    { name: "Board", icon: <Grid3X3 className="h-5 w-5" /> },
    { name: "List", icon: <List className="h-5 w-5" /> },
    { name: "Timeline", icon: <Clock className="h-5 w-5" /> },
    { name: "Table", icon: <Table className="h-5 w-5" /> },
];
const ProjectHeader = ({ activeTab, setActiveTab }: Props) => {
    const [isModalNewProjectOpen, setIsModalNewProjectOpen] = useState(false);

    return (
        <div className="px-4 xl:px-6">
            <div className="pt-6 pb-6 lg:pt-8 lg:pb-4">
                <Header name="Product Blueprint" />
            </div>
            {/* Tabs */}
            <div className="bprder-y border-brand-600 flex flex-wrap-reverse gap-2 pt-2 pb-[8px] md:items-center">
                <div className="flex flex-1 items-center gap-2 md:gap-4">
                    {TAB_CONFIG.map((tab) => (
                        <TabButton
                            key={tab.name}
                            name={tab.name}
                            icon={tab.icon}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                        />
                    ))}
                </div>
                <div className="flex items-center gap-2 ">
                    <button className="text-brand-800 hover:text-brand-600">
                        <Filter className="h-5 w-5" />
                    </button>
                    <button className="text-brand-800 hover:text-brand-600">
                        <Share2 className="h-5 w-5" />
                    </button>
                    <div className="relative">
                        <input type="text" placeholder="Search Task" className="rounded-md border border-brand-600 py-1 pl-10 pr-4 focus:outline-none" />
                        <Grid3X3 className="absolute left-3 top-2 h-4 w-4 text-brand-600" />

                    </div>
                </div>
            </div>
        </div>
    );
};

type TabButtonProps = {
    name: string;
    icon: React.ReactNode;
    setActiveTab: (tabName: string) => void;
    activeTab: string;
};

const TabButton = ({ name, icon, setActiveTab, activeTab }: TabButtonProps) => {
    const isActive = activeTab === name;

    return (
        <button
            className={`text-brand-800 relative flex items-center gap-2 px-1 cursor-pointer py-2 after:absolute after:-bottom-[9px] after:left-0 after:h-[1px] after:w-full hover:text-indigo-500 sm:px-2 lg:px-4 ${isActive ? "text-indigo-500 after:bg-indigo-500" : ""
                }`}
            onClick={() => setActiveTab(name)}
        >
            {icon}
            {name}
        </button>
    );
};
export default ProjectHeader;
