'use client';

import { Gantt, Willow, WillowDark } from '@svar-ui/react-gantt';
import type {
    IColumnConfig,
    IScaleConfig,
    ITask,
} from '@svar-ui/react-gantt';
import '@svar-ui/react-gantt/all.css';
import { CalendarRange, Plus } from 'lucide-react';

export type TimelineViewMode = 'day' | 'week' | 'month';

export const TIMELINE_SCALES: Record<TimelineViewMode, IScaleConfig[]> = {
    day: [
        { unit: 'month', step: 1, format: '%F %Y' },
        { unit: 'day', step: 1, format: '%j %M' },
    ],
    week: [
        { unit: 'month', step: 1, format: '%F %Y' },
        { unit: 'week', step: 1, format: 'Week %W' },
    ],
    month: [
        { unit: 'year', step: 1, format: '%Y' },
        { unit: 'month', step: 1, format: '%F' },
    ],
};

const RANGE_OPTIONS: { value: TimelineViewMode; label: string }[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
];

export const TimelineRangeControl = ({
    value,
    onChange,
    label = 'Timeline range',
}: {
    value: TimelineViewMode;
    onChange: (mode: TimelineViewMode) => void;
    label?: string;
}) => (
    <div
        role="group"
        aria-label={label}
        className="border-brand-500/80 bg-brand-200/80 inline-flex items-center gap-0.5 rounded-xl border p-0.5"
    >
        {RANGE_OPTIONS.map((option) => {
            const isActive = option.value === value;

            return (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    aria-pressed={isActive}
                    className={`cursor-pointer rounded-[10px] px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                        isActive
                            ? 'bg-brand-100 text-brand-900 ring-brand-500/70 shadow-sm ring-1'
                            : 'text-brand-700 hover:text-brand-900 hover:bg-brand-300/70'
                    }`}
                >
                    {option.label}
                </button>
            );
        })}
    </div>
);

type TimelineChartProps = {
    tasks: ITask[];
    columns: IColumnConfig[];
    scales: IScaleConfig[];
    isDarkMode: boolean;
    start?: Date;
    end?: Date;
    height?: number;
    emptyMessage?: string;
    emptyHint?: string;
    onAddTask?: () => void;
};

/**
 * Shared SVAR Gantt wrapper used by the project timeline and the global
 * `/timeline` page. The `.task-timeline` scope supplies brand-aware theme
 * variables for both light and dark mode.
 */
const TimelineChart = ({
    tasks,
    columns,
    scales,
    isDarkMode,
    start,
    end,
    height = 460,
    emptyMessage = 'No tasks scheduled yet.',
    emptyHint = 'Add a task to start building this timeline.',
    onAddTask,
}: TimelineChartProps) => {
    const ThemeWrapper = isDarkMode ? WillowDark : Willow;

    return (
        <div className="task-timeline w-full" style={{ height }}>
            {tasks.length === 0 ? (
                <div className="border-brand-500/60 flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                    <span className="bg-brand-300 text-brand-700 flex h-11 w-11 items-center justify-center rounded-full">
                        <CalendarRange className="h-5 w-5" />
                    </span>
                    <div>
                        <p className="text-brand-900 text-sm font-semibold">
                            {emptyMessage}
                        </p>
                        <p className="text-brand-700 mt-1 max-w-xs text-xs leading-relaxed">
                            {emptyHint}
                        </p>
                    </div>
                    {onAddTask && (
                        <button
                            type="button"
                            onClick={onAddTask}
                            className="border-brand-500 text-brand-800 hover:bg-brand-300 mt-1 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add task
                        </button>
                    )}
                </div>
            ) : (
                <ThemeWrapper>
                    <Gantt
                        tasks={tasks}
                        links={[]}
                        columns={columns}
                        scales={scales}
                        start={start}
                        end={end}
                    />
                </ThemeWrapper>
            )}
        </div>
    );
};

export default TimelineChart;
