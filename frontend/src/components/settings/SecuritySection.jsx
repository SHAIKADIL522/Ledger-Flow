"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle2, Monitor, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Primitives";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";

function PasswordStrength({ password }) {
  const rules = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/];
  const score = rules.filter((r) => r.test(password)).length;
  const bars  = ["", "bg-rose-500", "bg-amber-400", "bg-emerald-400", "bg-emerald-500"];
  const label = ["", "Weak", "Fair", "Strong", "Very Strong"];
  if (!password) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? bars[score] : "bg-white/10"}`}
          />
        ))}
      </div>
      <p className="text-xs text-slate-400">{label[score]}</p>
    </div>
  );
}

export default function SecuritySection() {
  const { user } = useAuthStore();
  const [pwForm, setPwForm]  = useState({ currentPassword: "", newPassword: "" });
  const [sessions, setSessions] = useState([]);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    api.get("/settings/sessions")
      .then((d) => setSessions(d.sessions || []))
      .catch(() => {});
  }, []);

  const changePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/auth/change-password", pwForm);
      setPwForm({ currentPassword: "", newPassword: "" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || "Couldn't update password.");
    } finally {
      setSaving(false);
    }
  };

  const revokeSession = async (id) => {
    await api.delete(`/settings/sessions/${id}`);
    setSessions((s) => s.filter((x) => x.id !== id));
  };

  const revokeAll = async () => {
    if (!confirm("Log out all other devices?")) return;
    await api.delete("/settings/sessions");
    setSessions((s) => s.filter((x) => x.isCurrent));
  };

  return (
    <div className="space-y-5">
      {/* Password */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
          <ShieldCheck className="size-4.5 text-primary" />
          <h2 className="text-base font-semibold text-white">Security</h2>
        </div>

        <div className="mb-5 text-sm text-slate-400">
          Email:{" "}
          <span className="text-white">{user?.email}</span>
          {user?.googleId && (
            <span className="ml-3 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
              Google Connected
            </span>
          )}
        </div>

        <form onSubmit={changePassword} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            required
          />
          <div className="space-y-2">
            <Input
              label="New Password"
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              required
              helperText="Minimum 8 characters."
            />
            <PasswordStrength password={pwForm.newPassword} />
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={saving}>
              Update Password
            </Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-primary">
                <CheckCircle2 className="size-4" /> Updated
              </span>
            )}
          </div>
        </form>
      </Card>

      {/* Sessions */}
      {sessions.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Active Sessions</h3>
            <button
              onClick={revokeAll}
              className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
            >
              Logout all devices
            </button>
          </div>
          <div className="space-y-1">
            {sessions.map((s, idx) => (
              <div
                key={s.id}
                className={`flex items-center gap-3 py-3 ${
                  idx < sessions.length - 1 ? "border-b border-white/5" : ""
                }`}
              >
                <Monitor className="size-4 text-slate-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{s.deviceName}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(s.lastActive).toLocaleDateString()}
                  </p>
                </div>
                {s.isCurrent ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Current
                  </span>
                ) : (
                  <button
                    onClick={() => revokeSession(s.id)}
                    className="size-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 cursor-pointer"
                    title="Revoke session"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}