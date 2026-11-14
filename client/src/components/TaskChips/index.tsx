'use client';

import Image from 'next/image';
import { User as UserIcon } from 'lucide-react';
import {
    priorityMeta,
    splitTags,
    statusMeta,
    type TaskAccent,
} from '@/lib/taskStyles';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const AVATAR_SIZES: Record<AvatarSize, { box: string; px: number }> = {
    xs: { box: 'h-[18px] w-[18px] text-[8px]', px: 20 },
    sm: { box: 'h-6 w-6 text-[9px]', px: 24 },
    md: { box: 'h-7 w-7 text-[10px]', px: 28 },
    lg: { box: 'h-8 w-8 text-[11px]', px: 32 },
    xl: { box: 'h-14 w-14 text-sm', px: 56 },
    '2xl': { box: 'h-16 w-16 text-base', px: 64 },
};

const initials = (name: string): string =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase() || '?';

type AvatarUser = {
    username?: string | null;
    profilePictureUrl?: string | null;
};

type UserAvatarProps = {
    user?: AvatarUser;
    size?: AvatarSize;
    title?: string;
    className?: string;
};

export const UserAvatar = ({
    user,
    size = 'sm',
    title,
    className = '',
}: UserAvatarProps) => {
    const name = user?.username?.trim();
    const src = user?.profilePictureUrl;
    const { box, px } = AVATAR_SIZES[size];

    return (
        <span
            title={title ?? name}
            className={`bg-brand-400 text-brand-800 relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border font-semibold uppercase ${box} ${
                name ? 'border-brand-500' : 'border-brand-600 border-dashed'
            } ${className}`}
        >
            {src ? (
                <Image
                    src={`/${src}`}
                    alt={name ?? 'User'}
                    width={px}
                    height={px}
                    className="h-full w-full object-cover"
                />
            ) : name ? (
                <span aria-hidden="true">{initials(name)}</span>
            ) : (
                <UserIcon className="h-3 w-3" aria-hidden="true" />
            )}
        </span>
    );
};

type TaskChipProps = {
    meta?: TaskAccent;
    /** Overrides `meta.label`, e.g. for project phases. */
    label?: string;
    weight?: 'medium' | 'semibold';
    className?: string;
};

/** A status/priority pill shared by cards, the table and both timelines. */
const TaskChip = ({
    meta,
    label,
    weight = 'medium',
    className = '',
}: TaskChipProps) => {
    const text = label ?? meta?.label;

    if (!text) return null;

    return (
        <span
            className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] ${
                weight === 'semibold' ? 'font-semibold' : 'font-medium'
            } ${
                meta?.chip ??
                'border-brand-500 bg-brand-300 text-brand-700'
            } ${className}`}
        >
            {meta && (
                <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`}
                />
            )}
            <span className="truncate">{text}</span>
        </span>
    );
};

export const StatusChip = ({
    status,
    weight = 'medium',
    className,
}: {
    status?: string | null;
    weight?: 'medium' | 'semibold';
    className?: string;
}) => (
    <TaskChip
        meta={status ? statusMeta[status] : undefined}
        weight={weight}
        className={className}
    />
);

export const PriorityChip = ({
    priority,
    weight = 'medium',
    className,
}: {
    priority?: string | null;
    weight?: 'medium' | 'semibold';
    className?: string;
}) => (
    <TaskChip
        meta={priority ? priorityMeta[priority] : undefined}
        weight={weight}
        className={className}
    />
);

type TagChipsProps = {
    tags?: string | null;
    /** Maximum number of chips shown before collapsing into `+N`. */
    max?: number;
    className?: string;
};

export const TagChips = ({ tags, max = 3, className = '' }: TagChipsProps) => {
    const items = splitTags(tags);

    if (items.length === 0) return null;

    const visible = items.slice(0, max);
    const hidden = items.length - visible.length;

    return (
        <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
            {visible.map((tag) => (
                <span
                    key={tag}
                    title={`#${tag}`}
                    className="bg-brand-400/70 text-brand-800 dark:bg-white/5 inline-flex max-w-[140px] items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium"
                >
                    <span className="truncate">#{tag}</span>
                </span>
            ))}
            {hidden > 0 && (
                <span
                    title={items.join(', ')}
                    className="text-brand-800 text-[11px] font-medium"
                >
                    +{hidden}
                </span>
            )}
        </div>
    );
};

export { TaskChip };
