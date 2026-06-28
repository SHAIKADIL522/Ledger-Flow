"use client";

import { Check } from "lucide-react";

export default function Checkbox({ checked, onChange, id, label }) {
  return (
    <label htmlFor={id} className="inline-flex items-center gap-2.5 cursor-pointer select-none">
      <span className="relative">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />
        <span className="size-5 rounded-md border border-white/20 bg-navy-800 flex items-center justify-center peer-checked:bg-primary peer-checked:border-primary transition-colors">
          {checked && <Check className="size-3.5 text-navy-950" strokeWidth={3} />}
        </span>
      </span>
      {label && <span className="text-sm text-slate-300">{label}</span>}
    </label>
  );
}
