'use client';

import { Task, useDeleteTaskMutation } from '@/state/api';
import { useState } from 'react';
import {
    AlertCircle,
    CalendarDays,
    MessageSquare,
    Pencil,
    Target,
    Trash2,
} from 'lucide-react';
import ModalEditTask from '@/components/ModalEditTask';
import AttachmentList from '@/components/AttachmentList';
import {
    PriorityChip,
    StatusChip,
    TagChips,
    UserAvatar,
} from '@/components/TaskChips';
import { taskDateInfo } from '@/lib/taskStyles';

type TaskCardProps = {
    task: Task;
    variant?: 'grid' | 'board';
    isDragging?: boolean;
};

const TaskCard = ({ task, variant = 'grid', isDragging = false }: TaskCardProps) => {
    const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
    const [isEditOpen, setIsEditOpen] = useState(false);

    const isBoard = variant === 'board';
    const dates = taskDateInfo(task);
    const comments = task.comments?.length ?? 0;

    const handleDelete = async () => {
        if (!window.confirm(`Delete task "${task.title}"? This cannot be undone.`)) return;

        try {
            await deleteTask(task.id).unwrap();
        } catch {
            window.alert('Failed to delete the task. Please try again.');
        }
    };

    return (
        <>
            <article
                className={`group bg-brand-100 relative flex flex-col border transition-all duration-200 ${
                    isBoard
                        ? 'cursor-grab gap-2.5 rounded-xl p-3.5 active:cursor-grabbing'
                        : 'h-full gap-3 rounded-2xl p-4'
                } ${
                    isDragging
                        ? 'border-brand-600 scale-[1.01] rotate-[0.4deg] shadow-2xl ring-2 ring-brand-600/20'
                        : 'border-brand-500/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:-translate-y-0.5 hover:border-brand-600 hover:shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)] focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/15'
                }`}
            >
                {/* Priority, identity and state */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <PriorityChip priority={task.priority} weight="semibold" />
                        <span className="text-brand-700 dark:text-brand-800 font-mono text-[11px]">
                            #{task.id}
                        </span>
                        {task.author && (
                            <UserAvatar
                                user={task.author}
                                size="xs"
                                title={`Created by ${task.author.username}`}
                            />
                        )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                        {!isBoard && (
                            <StatusChip status={task.status} weight="medium" />
                        )}

                        <div className="flex items-center gap-0.5 transition-opacity duration-150 sm:pointer-events-none sm:opacity-0 sm:group-focus-within:pointer-events-auto sm:group-focus-within:opacity-100 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100">
                            <button
                                type="button"
                                onClick={() => setIsEditOpen(true)}
                                title="Edit task"
                                aria-label={`Edit task ${task.title}`}
                                className="text-brand-800 hover:bg-brand-400 hover:text-brand-900 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                title="Delete task"
                                aria-label={`Delete task ${task.title}`}
                                className="text-brand-800 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Title, description and compact attachment preview */}
                <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                        <h3
                            className={`text-brand-900 line-clamp-2 leading-snug font-semibold tracking-[-0.01em] ${
                                isBoard ? 'text-sm' : 'text-[15px]'
                            }`}
                        >
                            {task.title}
                        </h3>
                        {task.description?.trim() && (
                            <p className="text-brand-800/80 dark:text-brand-800 mt-1 line-clamp-2 text-[13px] leading-relaxed">
                                {task.description}
                            </p>
                        )}
                    </div>

                    <AttachmentList
                        attachments={task.attachments}
                        variant="preview"
                        size={isBoard ? 'sm' : 'md'}
                    />
                </div>

                <TagChips tags={task.tags} max={isBoard ? 2 : 3} />

                {/* People and key metadata */}
                <div
                    className={`border-brand-500/70 mt-auto flex items-center justify-between gap-2 border-t ${
                        isBoard ? 'pt-2' : 'pt-2.5'
                    }`}
                >
                    <div className="flex min-w-0 items-center gap-2">
                        <UserAvatar
                            user={task.assignee}
                            size={isBoard ? 'xs' : 'sm'}
                            title={
                                task.assignee
                                    ? `Assigned to ${task.assignee.username}`
                                    : 'Unassigned'
                            }
                        />
                        <span className="text-brand-900 truncate text-xs font-medium">
                            {task.assignee?.username ?? 'Unassigned'}
                        </span>
                    </div>

                    <div className="text-brand-700 dark:text-brand-800 flex shrink-0 items-center gap-2.5 text-[11px] font-medium">
                        {dates.label && (
                            <span
                                className={`inline-flex items-center gap-1 ${
                                    dates.overdue ? 'text-red-600 dark:text-red-400' : ''
                                }`}
                                title={dates.overdue ? 'Overdue' : undefined}
                            >
                                {dates.overdue ? (
                                    <AlertCircle className="h-3.5 w-3.5" />
                                ) : (
                                    <CalendarDays className="h-3.5 w-3.5" />
                                )}
                                <span>{isBoard ? dates.shortLabel : dates.label}</span>
                            </span>
                        )}

                        {!isBoard && typeof task.points === 'number' && (
                            <span
                                className="inline-flex items-center gap-1"
                                title={`${task.points} points`}
                            >
                                <Target className="h-3.5 w-3.5" />
                                {task.points} pts
                            </span>
                        )}

                        {comments > 0 && (
                            <span
                                className="inline-flex items-center gap-1"
                                title={`${comments} comment${comments === 1 ? '' : 's'}`}
                            >
                                <MessageSquare className="h-3.5 w-3.5" />
                                {comments}
                            </span>
                        )}
                    </div>
                </div>
            </article>

            {isEditOpen && (
                <ModalEditTask
                    isOpen={isEditOpen}
                    task={task}
                    onClose={() => setIsEditOpen(false)}
                />
            )}
        </>
    );
};

export default TaskCard;
