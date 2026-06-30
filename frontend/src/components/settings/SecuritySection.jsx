"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle2, Monitor, Trash2, Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/Primitives";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";

const RULES = [
  { re: /.{8,}/,                                   label: "At least 8 characters" },
  { re: /[A-Z]/,                                   label: "One uppercase letter" },
  { re: /[a-z]/,                                   label: "One lowercase letter" },
  { re: /[0-9]/,                                   label: "One number" },
  { re: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,  label: "One special character" },
];

function PasswordStrength({ password }) {
  if (!password) return null;
  const passed = RULES.filter((r) => r.re.test(password)).length;
  const score  = Math.min(3, Math.floor((passed / RULES.length) * 4));
  const colors = ["bg-rose-500", "bg-amber-400", "bg-emerald-400", "bg-emerald-500"];
  const labels = ["Weak", "Fair", "Strong", "Very Strong"];
  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1">
        {[0,1,2,3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? colors[score] : "bg-white/10"}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${score >= 2 ? "text-emerald-400" : score === 1 ? "text-amber-400" : "text-rose-400"}`}>
        {labels[score]}
      </p>
      <div className="space-y-1">
        {RULES.map((r) => {
          const ok = r.re.test(password);
          return (
            <div key={r.label} className={`flex items-center gap-1.5 text-xs ${ok ? "text-emerald-400" : "text-slate-500"}`}>
              <span>{ok ? "✓" : "○"}</span><span>{r.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PwInput({ label, value, onChange, required, helper }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full h-11 px-4 pr-11 rounded-xl bg-navy-800/60 border border-white/10 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button type="button" onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer" tabIndex={-1}>
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {helper && <p className="text-xs text-slate-500">{helper}</p>}
    </div>
  );
}

export default function SecuritySection() {
  const { user } = useAuthStore();
  const [form,     setForm]     = useState({ currentPassword: "", newPassword: "" });
  const [sessions, setSessions] = useState([]);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    api.get("/settings/sessions").then((d) => setSessions(d.sessions || [])).catch(() => {});
  }, []);

  const allRulesPass = RULES.every((r) => r.re.test(form.newPassword));
  const canSubmit    = !saving && form.currentPassword.trim().length > 0 && allRulesPass;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.currentPassword.trim()) return setError("Current password is required.");
    if (!allRulesPass) return setError("New password doesn't meet all requirements listed above.");
    if (form.currentPassword === form.newPassword) return setError("New password must be different from current.");
    setSaving(true);
    try {
      await api.post("/auth/change-password", { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm({ currentPassword: "", newPassword: "" });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  const revokeSession = async (id) => {
    try { await api.delete(`/settings/sessions/${id}`); setSessions((s) => s.filter((x) => x.id !== id)); } catch {}
  };
  const revokeAll = async () => {
    if (!confirm("Log out all other devices?")) return;
    try { await api.delete("/settings/sessions"); setSessions((s) => s.filter((x) => x.isCurrent)); } catch {}
  };

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
          <ShieldCheck className="size-4.5 text-primary" />
          <h2 className="text-base font-semibold text-white">Security</h2>
        </div>
        <div className="mb-5 text-sm text-slate-400">
          Email: <span className="text-white">{user?.email}</span>
          {user?.googleId && <span className="ml-3 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">Google Connected</span>}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PwInput label="Current Password" value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} required />
          <div>
            <PwInput label="New Password" value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required
              helper="Min 8 chars, uppercase, lowercase, number, special character." />
            <PasswordStrength password={form.newPassword} />
          </div>
          {error && <p className="text-sm text-rose-400 bg-rose-400/10 border border-rose-400/20 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={!canSubmit}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                canSubmit ? "bg-primary text-navy-950 hover:bg-primary/90 cursor-pointer" : "bg-white/5 text-slate-500 cursor-not-allowed"
              }`}>
              {saving ? "Updating…" : "Update Password"}
            </button>
            {saved && <span className="flex items-center gap-1.5 text-sm text-emerald-400"><CheckCircle2 className="size-4" /> Password updated</span>}
          </div>
        </form>
      </Card>

      {sessions.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Active Sessions</h3>
            <button onClick={revokeAll} className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer">Logout all devices</button>
          </div>
          <div className="space-y-1">
            {sessions.map((s, idx) => (
              <div key={s.id} className={`flex items-center gap-3 py-3 ${idx < sessions.length - 1 ? "border-b border-white/5" : ""}`}>
                <Monitor className="size-4 text-slate-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{s.deviceName}</p>
                  <p className="text-xs text-slate-500">{new Date(s.lastActive).toLocaleDateString()}</p>
                </div>
                {s.isCurrent
                  ? <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Current</span>
                  : <button onClick={() => revokeSession(s.id)} className="size-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 cursor-pointer"><Trash2 className="size-3.5" /></button>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}