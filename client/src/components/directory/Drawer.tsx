"use client";

import { X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { MUTED_LABEL_CLASS } from "./styles";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const getFocusable = (root: HTMLElement | null): HTMLElement[] => {
  if (!root) return [];

  return Array.from(
    root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (element) =>
      element.getAttribute("aria-hidden") !== "true" &&
      (element.offsetParent !== null || element === document.activeElement),
  );
};

/**
 * Drawers form a stack so a nested person drawer can sit above a team drawer
 * without both responding to Escape, fighting over body scroll, or exposing
 * two dialogs to assistive technology.
 */
type DrawerStackEntry = {
  id: symbol;
  root: HTMLElement;
};

const drawerStack: DrawerStackEntry[] = [];
let scrollLocks = 0;
let previousBodyOverflow = "";

const syncDrawerAccessibility = () => {
  drawerStack.forEach((entry, index) => {
    if (index === drawerStack.length - 1) {
      entry.root.removeAttribute("aria-hidden");
    } else {
      entry.root.setAttribute("aria-hidden", "true");
    }
  });
};

const subscribeToHydration = () => () => {};
const isHydrated = () => true;
const isServer = () => false;

const lockBodyScroll = () => {
  if (scrollLocks === 0) {
    previousBodyOverflow = document.body.style.overflow;
  }

  scrollLocks += 1;
  document.body.style.overflow = "hidden";
};

const unlockBodyScroll = () => {
  scrollLocks = Math.max(0, scrollLocks - 1);

  if (scrollLocks === 0) {
    document.body.style.overflow = previousBodyOverflow;
  }
};

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  widthClassName?: string;
  layer?: number;
};

export const Drawer = ({
  open,
  onClose,
  title,
  eyebrow = "Details",
  subtitle,
  children,
  footer,
  widthClassName = "sm:max-w-[460px]",
  layer = 50,
}: DrawerProps) => {
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const drawerIdRef = useRef<symbol>(Symbol("drawer"));
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    isHydrated,
    isServer,
  );

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open || !mounted) return;

    const drawerId = drawerIdRef.current;
    const root = rootRef.current;

    if (!root) return;

    drawerStack.push({ id: drawerId, root });
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    lockBodyScroll();
    panelRef.current?.focus({ preventScroll: true });
    syncDrawerAccessibility();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (drawerStack[drawerStack.length - 1]?.id !== drawerId) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusable(panelRef.current);

      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === panelRef.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      unlockBodyScroll();

      const index = drawerStack.findIndex((entry) => entry.id === drawerId);
      if (index >= 0) drawerStack.splice(index, 1);
      syncDrawerAccessibility();

      document.removeEventListener("keydown", handleKeyDown);

      const previous = previousFocusRef.current;
      if (previous?.isConnected) {
        previous.focus({ preventScroll: true });
      }
    };
  }, [open, mounted]);

  if (!mounted || !open) return null;

  return createPortal(
    <div ref={rootRef} className="fixed inset-0" style={{ zIndex: layer }}>
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] motion-safe:animate-[directory-fade-in_150ms_ease-out]"
        aria-hidden="true"
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            onCloseRef.current();
          }
        }}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`border-brand-500 bg-brand-100 absolute inset-y-0 right-0 flex w-full max-w-full flex-col border-l shadow-2xl outline-none motion-safe:animate-[directory-slide-in_200ms_ease-out] ${widthClassName}`}
      >
        <div className="border-brand-500/70 flex items-start gap-3 border-b px-4 py-4 sm:px-5">
          <div className="min-w-0 flex-1">
            <p className={MUTED_LABEL_CLASS}>{eyebrow}</p>
            <h2
              id={titleId}
              className="text-brand-900 mt-1 truncate text-lg font-semibold tracking-tight"
            >
              {title}
            </h2>
            {subtitle && (
              <div className="text-brand-700 mt-0.5 text-xs">{subtitle}</div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label="Close details"
            className="border-brand-500 text-brand-700 hover:bg-brand-300 hover:text-brand-900 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="sidebar-scroll flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {children}
        </div>

        {footer && (
          <div className="border-brand-500/70 bg-brand-100 border-t px-4 py-3 sm:px-5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
