"use client";

import { AnimatePresence, m, type PanInfo } from "motion/react";
import { Lock, Plus, RotateCcw } from "lucide-react";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

const COLUMNS = [
  { id: "backlog", label: "Backlog", dot: "bg-slate-400" },
  { id: "progress", label: "In progress", dot: "bg-amber-500" },
  { id: "shipped", label: "Shipped", dot: "bg-emerald-500" },
] as const;

type ColumnId = (typeof COLUMNS)[number]["id"];

const TAGS = ["Design", "Engineering", "Marketing"] as const;
type Tag = (typeof TAGS)[number];
type Filter = Tag | "All";
type Priority = "High" | "Medium" | "Low";

type DemoCard = {
  id: string;
  title: string;
  tag: Tag;
  priority: Priority;
  assignee: string;
  code: string;
  column: ColumnId;
};

const INITIAL_CARDS: DemoCard[] = [
  {
    id: "card-1",
    title: "Map the onboarding journey",
    tag: "Design",
    priority: "High",
    assignee: "Maya",
    code: "BP-104",
    column: "backlog",
  },
  {
    id: "card-2",
    title: "Draft the launch announcement",
    tag: "Marketing",
    priority: "Medium",
    assignee: "Iris",
    code: "BP-108",
    column: "backlog",
  },
  {
    id: "card-3",
    title: "Audit empty states",
    tag: "Design",
    priority: "Low",
    assignee: "Noah",
    code: "BP-112",
    column: "backlog",
  },
  {
    id: "card-4",
    title: "Build the invitation flow",
    tag: "Engineering",
    priority: "High",
    assignee: "Noah",
    code: "BP-117",
    column: "progress",
  },
  {
    id: "card-5",
    title: "Polish drag interactions",
    tag: "Engineering",
    priority: "Medium",
    assignee: "Maya",
    code: "BP-121",
    column: "progress",
  },
  {
    id: "card-6",
    title: "Ship role permissions",
    tag: "Engineering",
    priority: "High",
    assignee: "Iris",
    code: "BP-096",
    column: "shipped",
  },
  {
    id: "card-7",
    title: "Refresh workspace settings",
    tag: "Design",
    priority: "Medium",
    assignee: "Noah",
    code: "BP-101",
    column: "shipped",
  },
];

const TAG_STYLES: Record<Tag, string> = {
  Design: "border-indigo-200 bg-indigo-50 text-indigo-700",
  Engineering: "border-sky-200 bg-sky-50 text-sky-700",
  Marketing: "border-amber-200 bg-amber-50 text-amber-700",
};

const TAG_DOTS: Record<Tag, string> = {
  Design: "bg-indigo-500",
  Engineering: "bg-sky-500",
  Marketing: "bg-amber-500",
};

const PRIORITY_DOTS: Record<Priority, string> = {
  High: "bg-rose-500",
  Medium: "bg-amber-500",
  Low: "bg-slate-400",
};

const AVATAR_TONES = [
  "from-indigo-500 to-sky-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-fuchsia-500 to-violet-500",
];

const initialsFor = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";

const avatarTone = (name: string): string =>
  AVATAR_TONES[(name.charCodeAt(0) || 0) % AVATAR_TONES.length];

const columnLabel = (id: ColumnId): string =>
  COLUMNS.find((column) => column.id === id)?.label ?? id;

/**
 * The dragged card is rendered under the pointer, so skip its subtree when
 * resolving the column and read the first real column underneath it.
 */
const findColumnAt = (
  x: number,
  y: number,
  draggedId: string,
): ColumnId | null => {
  const dragged = document.querySelector(`[data-card-id="${draggedId}"]`);
  const stack = document.elementsFromPoint(x, y);

  for (const element of stack) {
    if (dragged && (element === dragged || dragged.contains(element))) {
      continue;
    }

    const column = element.closest<HTMLElement>("[data-column]");
    const id = column?.dataset.column;

    if (id) return id as ColumnId;
  }

  return null;
};

const pointFromEvent = (
  event: MouseEvent | TouchEvent | PointerEvent,
  info: PanInfo,
): { x: number; y: number } => {
  if ("changedTouches" in event) {
    const touch = event.changedTouches[0];
    if (touch) return { x: touch.clientX, y: touch.clientY };
  } else if (event.clientX !== 0 || event.clientY !== 0) {
    return { x: event.clientX, y: event.clientY };
  }

  return {
    x: info.point.x - window.scrollX,
    y: info.point.y - window.scrollY,
  };
};

const BOARD_AVATARS = ["Maya", "Noah", "Iris"];

export default function KanbanDemo() {
  const [cards, setCards] = useState<DemoCard[]>(() =>
    INITIAL_CARDS.map((card) => ({ ...card })),
  );
  const [filter, setFilter] = useState<Filter>("All");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverColumn, setHoverColumn] = useState<ColumnId | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [pickedOrigin, setPickedOrigin] = useState<ColumnId | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [addingTo, setAddingTo] = useState<ColumnId | null>(null);
  const [draft, setDraft] = useState("");
  const nextCode = useRef(0);

  const visibleCards = useMemo(
    () => cards.filter((card) => filter === "All" || card.tag === filter),
    [cards, filter],
  );

  const moveCard = useCallback((id: string, column: ColumnId) => {
    setCards((current) =>
      current.map((card) => (card.id === id ? { ...card, column } : card)),
    );
  }, []);

  const handleDragOver = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
    id: string,
  ) => {
    const point = pointFromEvent(event, info);
    const column = findColumnAt(point.x, point.y, id);
    setHoverColumn((current) => (current === column ? current : column));
  };

  const handleDragEnd = (
    card: DemoCard,
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const point = pointFromEvent(event, info);
    const target = findColumnAt(point.x, point.y, card.id);

    setDraggingId(null);
    setHoverColumn(null);

    if (!target || target === card.column) return;

    moveCard(card.id, target);
    setAnnouncement(`${card.title} moved to ${columnLabel(target)}.`);
  };

  const moveByKeyboard = (card: DemoCard, direction: -1 | 1) => {
    const currentIndex = COLUMNS.findIndex(
      (column) => column.id === card.column,
    );
    const nextIndex = Math.min(
      COLUMNS.length - 1,
      Math.max(0, currentIndex + direction),
    );
    const target = COLUMNS[nextIndex];

    if (!target || target.id === card.column) return;

    moveCard(card.id, target.id);
    setAnnouncement(`${card.title} moved to ${target.label}.`);

    window.setTimeout(() => {
      document
        .querySelector<HTMLElement>(`[data-card-id="${card.id}"]`)
        ?.focus();
    }, 0);
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    card: DemoCard,
  ) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      const nextPicked = pickedId === card.id ? null : card.id;
      setPickedId(nextPicked);
      setPickedOrigin(nextPicked ? card.column : null);
      setAnnouncement(
        nextPicked
          ? `Picked up ${card.title}. Use the left and right arrow keys to move it.`
          : `Dropped ${card.title}.`,
      );
      return;
    }

    if (pickedId !== card.id) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveByKeyboard(card, -1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveByKeyboard(card, 1);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      if (pickedOrigin && pickedOrigin !== card.column) {
        moveCard(card.id, pickedOrigin);
      }
      setPickedId(null);
      setPickedOrigin(null);
      setAnnouncement("Move cancelled.");

      window.setTimeout(() => {
        document
          .querySelector<HTMLElement>(`[data-card-id="${card.id}"]`)
          ?.focus();
      }, 0);
    }
  };

  const addCard = (event: FormEvent<HTMLFormElement>, column: ColumnId) => {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;

    nextCode.current += 1;
    const card: DemoCard = {
      id: `custom-${nextCode.current}`,
      title: title.slice(0, 64),
      tag: filter === "All" ? "Design" : filter,
      priority: "Medium",
      assignee: "You",
      code: `BP-${110 + nextCode.current}`,
      column,
    };

    setCards((current) => [...current, card]);
    setDraft("");
    setAnnouncement(`${title} added to ${columnLabel(column)}.`);
  };

  const resetBoard = () => {
    setCards(INITIAL_CARDS.map((card) => ({ ...card })));
    setFilter("All");
    setPickedId(null);
    setPickedOrigin(null);
    setAddingTo(null);
    setDraft("");
    setAnnouncement("Demo board reset.");
  };

  const changeFilter = (next: Filter) => {
    setFilter(next);
    setPickedId(null);
    setPickedOrigin(null);
  };

  return (
    <div className="relative">
      <p id="kanban-instructions" className="sr-only">
        Press Space or Enter to pick up a card, use the left and right arrow
        keys to move it between columns, and press Space or Enter to drop it.
        Escape cancels the move.
      </p>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div className="rounded-2xl border border-slate-800/80 bg-[#0b1120] p-2 shadow-[0_40px_90px_-34px_rgba(7,10,19,0.6)]">
        <div className="flex items-center gap-2 px-1.5 pt-0.5 pb-2">
          <span className="flex items-center gap-1" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-rose-400/80" />
            <span className="h-2 w-2 rounded-full bg-amber-400/80" />
            <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
          </span>
          <div className="mx-auto flex h-5 w-full max-w-[240px] items-center justify-center gap-1.5 rounded-md bg-white/[0.07] font-mono text-[9px] text-slate-400">
            <Lock className="h-2.5 w-2.5" aria-hidden="true" />
            blueprint.app/projects/atlas
          </div>
        </div>

        <div className="bg-brand-200 rounded-xl p-2.5">
          <div className="flex items-center justify-between gap-2 pb-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-cyan-400 text-[10px] font-bold text-white">
                A
              </span>
              <div className="min-w-0">
                <p className="text-brand-900 truncate text-[11px] leading-tight font-semibold">
                  Atlas launch
                </p>
                <p className="text-brand-700 font-mono text-[8px] tracking-[0.14em] uppercase">
                  Live demo · drag a card
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <div className="flex -space-x-1" aria-hidden="true">
                {BOARD_AVATARS.map((name) => (
                  <span
                    key={name}
                    title={name}
                    className={`ring-brand-200 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br text-[8px] font-bold text-white ring-2 ${avatarTone(name)}`}
                  >
                    {initialsFor(name)}
                  </span>
                ))}
              </div>
              <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[8px] font-semibold text-emerald-700">
                <span className="h-1 w-1 rounded-full bg-emerald-500" />
                Synced
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pb-2">
            <div className="flex flex-wrap items-center gap-1">
              {(["All", ...TAGS] as const).map((tag) => {
                const active = filter === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => changeFilter(tag)}
                    aria-pressed={active}
                    className={`h-5 cursor-pointer rounded-full px-2 text-[8px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none ${
                      active
                        ? "bg-brand-900 text-white"
                        : "border-brand-500/70 text-brand-700 hover:bg-brand-300 hover:text-brand-900 border bg-white"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={resetBoard}
              className="border-brand-500/70 text-brand-700 hover:bg-brand-300 hover:text-brand-900 flex h-5 shrink-0 cursor-pointer items-center gap-1 rounded-full border bg-white px-1.5 text-[8px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
            >
              <RotateCcw className="h-2.5 w-2.5" aria-hidden="true" />
              Reset
            </button>
          </div>

          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <div className="grid min-w-[520px] grid-cols-3 gap-1.5">
              {COLUMNS.map((column) => {
                const columnCards = visibleCards.filter(
                  (card) => card.column === column.id,
                );
                const isHovered = hoverColumn === column.id;

                return (
                  <div
                    key={column.id}
                    data-column={column.id}
                    className={`flex min-h-[286px] flex-col rounded-xl border p-1.5 transition-colors duration-200 ${
                      isHovered
                        ? "border-indigo-300 bg-indigo-50/80"
                        : "border-brand-500/60 bg-brand-300/50"
                    }`}
                  >
                    <div className="flex items-center justify-between px-0.5 py-1">
                      <span className="text-brand-800 flex items-center gap-1.5 text-[10px] font-semibold">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${column.dot}`}
                          aria-hidden="true"
                        />
                        {column.label}
                        <span className="text-brand-700 rounded-full bg-white/80 px-1 text-[9px] tabular-nums">
                          {
                            cards.filter((card) => card.column === column.id)
                              .length
                          }
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingTo(column.id);
                          setDraft("");
                        }}
                        aria-label={`Add a task to ${column.label}`}
                        className="text-brand-700 hover:text-brand-900 flex h-4 w-4 cursor-pointer items-center justify-center rounded transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
                      >
                        <Plus className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="flex flex-1 flex-col gap-1.5">
                      <AnimatePresence initial={false} mode="popLayout">
                        {columnCards.map((card) => {
                          const isPicked = pickedId === card.id;

                          return (
                            <m.div
                              key={card.id}
                              layout
                              layoutId={card.id}
                              data-card-id={card.id}
                              initial={{ opacity: 0, scale: 0.96 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.94 }}
                              transition={{
                                type: "spring",
                                stiffness: 420,
                                damping: 34,
                              }}
                              drag
                              dragSnapToOrigin
                              dragMomentum={false}
                              dragElastic={0.16}
                              whileDrag={{
                                scale: 1.05,
                                rotate: 1.5,
                                zIndex: 40,
                                boxShadow:
                                  "0 20px 45px -14px rgba(7,10,19,0.5)",
                              }}
                              onDragStart={() => {
                                setDraggingId(card.id);
                                setPickedId(null);
                                setPickedOrigin(null);
                              }}
                              onDrag={(event, info) =>
                                handleDragOver(event, info, card.id)
                              }
                              onDragEnd={(event, info) =>
                                handleDragEnd(card, event, info)
                              }
                              onKeyDown={(event) => handleKeyDown(event, card)}
                              tabIndex={0}
                              role="button"
                              aria-pressed={isPicked}
                              aria-describedby="kanban-instructions"
                              aria-label={`${card.title}. ${card.tag}. ${card.priority} priority. In ${columnLabel(card.column)}.`}
                              className={`group cursor-grab touch-none rounded-lg border bg-white p-2 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
                                isPicked
                                  ? "border-indigo-400 ring-2 ring-indigo-500/30"
                                  : "border-brand-500/70 hover:border-indigo-300"
                              } ${draggingId === card.id ? "cursor-grabbing" : ""}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-brand-700/80 font-mono text-[9px] font-semibold tracking-[0.1em]">
                                  {card.code}
                                </span>
                                <span className="text-brand-700 flex items-center gap-1 text-[9px] font-medium">
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOTS[card.priority]}`}
                                    aria-hidden="true"
                                  />
                                  {card.priority}
                                </span>
                              </div>

                              <p className="text-brand-900 mt-1.5 text-[11px] leading-snug font-semibold">
                                {card.title}
                              </p>

                              <div className="mt-2 flex items-center justify-between gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${TAG_STYLES[card.tag]}`}
                                >
                                  <span
                                    className={`h-1 w-1 rounded-full ${TAG_DOTS[card.tag]}`}
                                    aria-hidden="true"
                                  />
                                  {card.tag}
                                </span>
                                <span
                                  title={card.assignee}
                                  className={`flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br text-[8px] font-bold text-white ${avatarTone(card.assignee)}`}
                                >
                                  {initialsFor(card.assignee)}
                                </span>
                              </div>
                            </m.div>
                          );
                        })}
                      </AnimatePresence>

                      {addingTo === column.id && (
                        <form
                          onSubmit={(event) => addCard(event, column.id)}
                          className="rounded-lg border border-indigo-300 bg-white p-1.5"
                        >
                          <label
                            htmlFor={`new-task-${column.id}`}
                            className="sr-only"
                          >
                            New task title for {column.label}
                          </label>
                          <input
                            id={`new-task-${column.id}`}
                            autoFocus
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Escape") {
                                setAddingTo(null);
                                setDraft("");
                              }
                            }}
                            maxLength={64}
                            placeholder="Task title…"
                            className="text-brand-900 placeholder:text-brand-700/70 h-6 w-full rounded border-0 bg-transparent px-0.5 text-[10px] focus:outline-none"
                          />
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-brand-700 text-[8px]">
                              Enter to add
                            </span>
                            <button
                              type="submit"
                              disabled={draft.trim().length === 0}
                              className="h-5 cursor-pointer rounded bg-indigo-600 px-1.5 text-[8px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Add
                            </button>
                          </div>
                        </form>
                      )}

                      {columnCards.length === 0 && addingTo !== column.id && (
                        <div className="border-brand-500/60 text-brand-700/70 flex flex-1 items-center justify-center rounded-lg border border-dashed py-6 text-[9px] font-medium">
                          Drop a card here
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-brand-700 mt-1 text-center text-[8px] sm:hidden">
            Swipe to see every column
          </p>
        </div>
      </div>
    </div>
  );
}
