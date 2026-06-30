"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import clsx from "clsx";

const VARIANTS = {
  primary:
    "bg-gradient-to-b from-primary-400 to-primary-700 text-navy-950 border-t border-primary-300/60 shadow-[0_4px_20px_rgba(34,211,197,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] hover:brightness-110",
  secondary:
    "bg-navy-800 border border-white/10 text-slate-200 hover:bg-navy-700 hover:border-white/20",
  ghost: "bg-transparent text-slate-300 hover:bg-white/5 hover:text-white",
  danger:
    "bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20",
  outline:
    "bg-transparent border border-primary-500/40 text-primary-400 hover:bg-primary-500/10",
};

const SIZES = {
  sm: "h-9 px-4 text-sm rounded-lg",
  md: "h-11 px-6 text-sm rounded-xl",
  lg: "h-14 px-8 text-base rounded-xl",
};

const Button = forwardRef(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className,
      icon: Icon,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={clsx(
          "group relative inline-flex items-center justify-center gap-2 font-semibold overflow-hidden",
          "transition-all duration-200 active:translate-y-[1px]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950",
          "cursor-pointer touch-manipulation select-none",
          VARIANTS[variant],
          SIZES[size],
          className
        )}
        {...props}
      >
        {variant === "primary" && !isDisabled && (
          <span
            aria-hidden="true"
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:animate-shimmer pointer-events-none"
          />
        )}
        {loading && (
          <Loader2 className="relative z-10 size-4 animate-spin shrink-0" aria-hidden="true" />
        )}
        {!loading && Icon && (
          <Icon className="relative z-10 size-4 shrink-0" aria-hidden="true" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;