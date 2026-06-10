import { Task } from '@/state/api';
import { format } from 'date-fns';
import Image from 'next/image';
import React from 'react';
import { Calendar, User, Tag } from 'lucide-react';

type TaskCardProps = {
    task: Task;
}

const TaskCard = ({ task }: TaskCardProps) => {
    const renderDate = (dateString?: string) => {
        if (!dateString) return "Not set";
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? "Not set" : format(date, "MMM dd, yyyy");
    };

    return (
        <div className='flex flex-col justify-between mb-4 rounded-xl bg-brand-100 p-5 shadow-sm border border-brand-500 transition-all hover:shadow-md'>
            <div>
                {/* 1. Header: Status, Priority & ID */}
                <div className='flex items-center justify-between gap-2 mb-3'>
                    <div className='flex flex-wrap gap-1.5 items-center'>
                        {task.priority && (
                            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${task.priority === "Urgent" ? "bg-red-200 text-red-700" :
                                task.priority === "High" ? "bg-orange-200 text-orange-700" :
                                    task.priority === "Medium" ? "bg-green-200 text-green-700" :
                                        task.priority === "Low" ? "bg-blue-200 text-blue-700" :
                                            "bg-brand-400 text-brand-700"
                                }`}>
                                {task.priority}
                            </span>
                        )}
                        {task.status && (
                            <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-600 text-brand-900 border border-brand-500'>
                                {task.status}
                            </span>
                        )}
                    </div>
                    <span className='text-xs font-mono text-brand-800'>#{task.id}</span>
                </div>

                {/* 2. Image Attachment Layer */}
                {task.attachments && task.attachments.length > 0 && (
                    <div className="relative w-full h-44 mb-4 rounded-lg overflow-hidden border border-brand-500 bg-brand-300">
                        <Image
                            src={`/${task.attachments[0].fileUrl || task.attachments[0].fileUrl}`}
                            alt={task.attachments[0].filename || task.attachments[0].filename || "Attachment"}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                            priority={false}
                        />
                    </div>
                )}

                {/* 3. Typography Content Body */}
                <div className='mb-4'>
                    <h4 className='text-base font-bold text-brand-900 tracking-tight mb-1 line-clamp-1'>
                        {task.title}
                    </h4>
                    <p className='text-xs text-brand-800 line-clamp-2 leading-relaxed'>
                        {task.description || "No description provided."}
                    </p>
                </div>

                {/* 4. Categorized Metadata Rows */}
                <div className='space-y-2 border-t border-brand-500 pt-3 mb-4'>
                    {task.tags && (
                        <div className='flex items-center text-xs text-brand-800 gap-2'>
                            <Tag className='w-3.5 h-3.5 text-brand-700 flex-shrink-0' />
                            <span className='truncate'>
                                <strong className='font-medium text-brand-900'>Tags:</strong> {task.tags}
                            </span>
                        </div>
                    )}
                    <div className='flex items-center text-xs text-brand-800 gap-2'>
                        <Calendar className='w-3.5 h-3.5 text-brand-800 flex-shrink-0' />
                        <span className='truncate'>
                            <strong className='font-medium text-brand-900'>Timeline:</strong> {renderDate(task.startDate)} – {renderDate(task.dueDate)}
                        </span>
                    </div>
                </div>
            </div>

            {/* 5. Footer Stakeholders Row (Expanded Avatars) */}
            <div className='flex items-center justify-between gap-2 border-t border-brand-500 pt-3 mt-auto bg-brand-200 -mx-5 -mb-5 p-4 rounded-b-xl'>
                <div className='flex items-center gap-2.5 max-w-[50%]'>
                    <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-400 border border-brand-500 text-brand-800 font-semibold text-xs uppercase'>
                        <User className='w-4 h-4 text-brand-800' />
                    </div>
                    <div className='truncate leading-tight'>
                        <span className='block text-[10px] text-brand-800 uppercase tracking-wider font-bold'>Author</span>
                        <span className='text-xs font-semibold text-brand-900 truncate block'>{task.author ? task.author.username : "Unknown"}</span>
                    </div>
                </div>

                <div className='flex items-center gap-2.5 max-w-[50%] text-right justify-end'>
                    <div className='truncate leading-tight'>
                        <span className='block text-[10px] text-brand-800 uppercase tracking-wider font-bold'>Assignee</span>
                        <span className='text-xs font-semibold text-brand-900 truncate block'>{task.assignee ? task.assignee.username : "Unassigned"}</span>
                    </div>
                    <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 text-brand-900 border border-brand-600 font-bold text-xs uppercase shadow-sm'>
                        {task.assignee?.username ? task.assignee.username.substring(0, 2) : "?"}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskCard;