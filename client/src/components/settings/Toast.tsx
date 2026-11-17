"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export type ToastTone = "success" | "error";

export type ToastState = {
  id: number;
  tone: ToastTone;
  message: string;
} | null;

/**
 * Tiny local toast state. Deliberately dependency-free and scoped to settings;
 * the dashboard does not need a global provider for two panels.
 */
export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);

  const show = useCallback((tone: ToastTone, message: string) => {
    setToast({ id: Date.now(), tone, message });
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return { toast, show, dismiss };
}

export default function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastState;
  onDismiss: () => void;
}) {
  if (!toast) return null;

  const isError = toast.tone === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={`animate-toast-in fixed right-4 bottom-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm items-start gap-2.5 rounded-xl border px-3.5 py-3 shadow-xl ${
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p className="flex-1 text-[11px] leading-relaxed font-medium">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-current opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-current/30 focus-visible:outline-none"
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  );
}
