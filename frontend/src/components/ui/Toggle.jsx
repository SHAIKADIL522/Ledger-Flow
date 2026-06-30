"use client";

/**
 * Shared toggle switch. Uses inline style transform instead of Tailwind
 * translate-x classes — avoids JIT class generation glitches under rapid
 * state changes (seen in Appearance + Notifications sections).
 */
export default function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-[22px] rounded-full shrink-0 transition-colors duration-200 ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${checked ? "bg-primary" : "bg-white/10"}`}
    >
      <span
        className="absolute top-[3px] left-[3px] size-4 rounded-full bg-white shadow transition-transform duration-200 will-change-transform"
        style={{ transform: checked ? "translateX(18px)" : "translateX(0px)" }}
      />
    </button>
  );
}