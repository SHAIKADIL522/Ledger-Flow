"use client";

import { forwardRef } from "react";
import clsx from "clsx";

const Input = forwardRef(({ label, error, helperText, className, id, required, ...props }, ref) => {
  const inputId = id || props.name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-300">
          {label}
          {required && <span className="text-rose-400 ml-0.5">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          // text-white (not slate-100) — fully covered by our CSS-var override
          // so it correctly flips dark/light. slate-100 was NOT overridden
          // and stayed a fixed light grey, invisible on light backgrounds.
          "w-full h-11 px-4 rounded-xl bg-navy-800/60 border text-white placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-primary-400/60 transition-colors",
          error ? "border-rose-500/60" : "border-white/10 focus:border-primary-400/60",
          className
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-rose-400">
          {error}
        </p>
      )}
      {!error && helperText && <p className="text-xs text-slate-500">{helperText}</p>}
    </div>
  );
});

Input.displayName = "Input";
export default Input;