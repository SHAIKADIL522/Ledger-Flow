"use client";

import { useState, useEffect } from "react";
import { Palette, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Primitives";
import Toggle from "@/components/ui/Toggle";
import { api } from "@/lib/api";

const THEMES  = ["dark", "light", "system"];
const ACCENTS = [
  { color: "#22D3C5", name: "Teal (default)" },
  { color: "#6366F1", name: "Indigo" },
  { color: "#EC4899", name: "Pink" },
  { color: "#F59E0B", name: "Amber" },
  { color: "#10B981", name: "Emerald" },
  { color: "#3B82F6", name: "Blue" },
];

const DEFAULTS = { theme: "dark", accentColor: "#22D3C5", compactMode: false, animations: true };

function hexToRgb(hex) {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return "34 211 197";
  return m.map((h) => parseInt(h, 16)).join(" ");
}

function setCookie(name, value, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

// Apply theme to DOM immediately — also persists to localStorage + cookie
// so it survives page navigation and SSR reads it correctly next load.
function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");

  if (theme === "system") {
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.add(systemDark ? "dark" : "light");
  } else {
    root.classList.add(theme);
  }

  localStorage.setItem("lf-theme", theme);
  setCookie("lf-theme", theme);
}

function applyAccent(color) {
  document.documentElement.style.setProperty("--color-primary", hexToRgb(color));
  localStorage.setItem("lf-accent", color);
  setCookie("lf-accent", color);
}

function applyToggles({ compactMode, animations }) {
  const root = document.documentElement;
  root.classList.toggle("compact-mode", !!compactMode);
  root.classList.toggle("no-animations", animations === false);
}

export default function AppearanceSection() {
  const [prefs,  setPrefs]  = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get("/settings/appearance")
      .then((d) => {
        if (d.prefs) {
          // localStorage (set by user's last click) wins over stale DB value
          // until the DB has actually been saved with current selection.
          const localTheme = localStorage.getItem("lf-theme");
          const localAccent = localStorage.getItem("lf-accent");

          const finalPrefs = {
            ...d.prefs,
            theme: localTheme || d.prefs.theme,
            accentColor: localAccent || d.prefs.accentColor,
          };

          setPrefs(finalPrefs);
          applyTheme(finalPrefs.theme);
          applyAccent(finalPrefs.accentColor);
          applyToggles(finalPrefs);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const updateTheme = (theme) => {
    setPrefs((p) => ({ ...p, theme }));
    applyTheme(theme);
  };

  const updateAccent = (accentColor) => {
    setPrefs((p) => ({ ...p, accentColor }));
    applyAccent(accentColor);
  };

  const updateToggle = (key, value) => {
    setPrefs((p) => {
      const next = { ...p, [key]: value };
      applyToggles(next);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/settings/appearance", prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <Card className="p-6">
        <div className="h-40 animate-pulse bg-white/5 rounded-xl" />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
        <Palette className="size-4.5 text-primary" />
        <h2 className="text-base font-semibold text-white">Appearance</h2>
      </div>

      <div className="space-y-6">
        {/* Theme */}
        <div>
          <p className="text-sm font-medium text-slate-300 mb-3">Theme</p>
          <div className="flex gap-3">
            {THEMES.map((t) => (
              <button
                key={t}
                onClick={() => updateTheme(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize border transition-colors cursor-pointer ${
                  prefs.theme === t
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "text-slate-400 border-white/10 hover:text-white hover:border-white/20"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">Applies instantly across the app.</p>
        </div>

        {/* Accent colour */}
        <div>
          <p className="text-sm font-medium text-slate-300 mb-3">Accent Color</p>
          <div className="flex gap-3 flex-wrap">
            {ACCENTS.map(({ color, name }) => (
              <button
                key={color}
                onClick={() => updateAccent(color)}
                title={name}
                className={`size-8 rounded-full border-2 transition-all cursor-pointer ${
                  prefs.accentColor === color
                    ? "border-white scale-110 shadow-lg"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-4 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Compact Mode</p>
              <p className="text-xs text-slate-500 mt-0.5">Reduce spacing and padding throughout the UI</p>
            </div>
            <Toggle checked={!!prefs.compactMode} onChange={(v) => updateToggle("compactMode", v)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Animations</p>
              <p className="text-xs text-slate-500 mt-0.5">Enable UI transitions and motion effects</p>
            </div>
            <Toggle checked={!!prefs.animations} onChange={(v) => updateToggle("animations", v)} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-navy-950 hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Appearance"}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-primary">
              <CheckCircle2 className="size-4" /> Saved
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}