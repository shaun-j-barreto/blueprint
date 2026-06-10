import { Project } from '@/state/api';
import { format } from 'date-fns';
import { Briefcase, Calendar } from 'lucide-react';
import React from 'react';

type Props = {
    project: Project;
};

const ProjectCard = ({ project }: Props) => {
    const renderDate = (dateString?: string) => {
        if (!dateString) return "Not set";
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? "Not set" : format(date, "MMM dd, yyyy");
    };

    return (
        <div className="flex h-full flex-col justify-between rounded-xl border border-brand-700 bg-brand-200 p-6 shadow-sm transition-all hover:shadow-md">
            <div>
                {/* Header: Icon & Title */}
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-400 text-indigo-500 border border-brand-600">
                        <Briefcase className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-brand-900 line-clamp-1">
                        {project.name}
                    </h3>
                </div>

                {/* Body: Description */}
                <p className="mb-6 text-sm leading-relaxed text-brand-800 line-clamp-3">
                    {project.description || "No description provided."}
                </p>
            </div>

            {/* Footer: Timeline Metadata */}
            <div className="mt-auto border-t border-brand-100 pt-4">
                <div className="flex items-center justify-between gap-2 text-xs text-gray-500 sm:flex-row flex-col sm:items-center items-start">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-brand-800 flex-shrink-0" />
                        <span className="truncate text-brand-800">
                            <strong className="font-medium text-brand-800">Start:</strong> {renderDate(project.startDate)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-brand-800 flex-shrink-0" />
                        <span className="truncate text-brand-800">
                            <strong className="font-medium text-brand-800">End:</strong> {renderDate(project.endDate)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;