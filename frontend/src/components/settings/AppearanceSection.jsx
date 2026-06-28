"use client";

import { useState, useEffect } from "react";
import { Palette, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Primitives";
import Button from "@/components/ui/Button";
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

function Toggle({ checked, onChange, label, desc }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-[22px] rounded-full transition-colors cursor-pointer shrink-0 ${
          checked ? "bg-primary" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-[3px] size-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-[3px]"
          }`}
        />
      </button>
    </div>
  );
}

export default function AppearanceSection() {
  const [prefs,  setPrefs]  = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    api.get("/settings/appearance")
      .then((d) => { if (d.prefs) setPrefs(d.prefs); })
      .catch(() => {});
  }, []);

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
                onClick={() => setPrefs({ ...prefs, theme: t })}
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
        </div>

        {/* Accent colour */}
        <div>
          <p className="text-sm font-medium text-slate-300 mb-3">Accent Color</p>
          <div className="flex gap-3 flex-wrap">
            {ACCENTS.map(({ color, name }) => (
              <button
                key={color}
                onClick={() => setPrefs({ ...prefs, accentColor: color })}
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
          <Toggle
            checked={!!prefs.compactMode}
            onChange={(v) => setPrefs({ ...prefs, compactMode: v })}
            label="Compact Mode"
            desc="Reduce spacing and padding throughout the UI"
          />
          <Toggle
            checked={!!prefs.animations}
            onChange={(v) => setPrefs({ ...prefs, animations: v })}
            label="Animations"
            desc="Enable UI transitions and motion effects"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" loading={saving} onClick={save}>
            Save Appearance
          </Button>
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