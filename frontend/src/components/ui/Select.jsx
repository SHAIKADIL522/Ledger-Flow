"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

const Select = forwardRef(({ label, error, options = [], className, id, required, placeholder, ...props }, ref) => {
  const selectId = id || props.name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-300">
          {label}
          {required && <span className="text-rose-400 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={clsx(
            "w-full h-11 pl-4 pr-10 rounded-xl bg-navy-800/60 border text-white appearance-none",
            "focus:outline-none focus:ring-2 focus:ring-primary-400/60 transition-colors",
            error ? "border-rose-500/60" : "border-white/10 focus:border-primary-400/60",
            className
          )}
          aria-invalid={!!error}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="size-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
});

Select.displayName = "Select";
export default Select;