"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import Button from "./Button";

export function Card({ children, className, hover = false }) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-white/10 bg-navy-800/40 backdrop-blur-sm shadow-card",
        hover && "transition-all duration-300 hover:border-primary-500/30 hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </div>
  );
}

const BADGE_STYLES = {
  DRAFT: "bg-slate-700/40 text-slate-300 border-slate-600/40",
  SENT: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  PAID: "bg-primary/10 text-primary border-primary/30",
  OVERDUE: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  ACTIVE: "bg-primary/10 text-primary border-primary/30",
  ON_HOLD: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  COMPLETED: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  CANCELLED: "bg-rose-500/10 text-rose-400 border-rose-500/30",
};

export function Badge({ status, children, className }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border",
        BADGE_STYLES[status] || "bg-white/5 text-slate-300 border-white/10",
        className
      )}
    >
      {children || status}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className }) {
  return (
    <div className={clsx("flex flex-col items-center justify-center text-center py-16 px-6", className)}>
      {Icon && (
        <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
          <Icon className="size-7 text-primary" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-1.5">{title}</h3>
      {description && <p className="text-sm text-slate-400 max-w-sm mb-6">{description}</p>}
      {actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-navy-950/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={clsx(
          "relative w-full rounded-2xl border border-white/10 bg-navy-800 shadow-card animate-fadeUp max-h-[90vh] overflow-y-auto scrollbar-thin",
          maxWidth
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-navy-800 z-10">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="size-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
