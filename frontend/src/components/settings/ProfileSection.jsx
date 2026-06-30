"use client";

import { useState } from "react";
import { User, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Primitives";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";

export default function ProfileSection() {
  const { user, setUser } = useAuthStore();

  const [form, setForm] = useState({
    name:      user?.name      || "",
    username:  user?.username  || "",
    phone:     user?.phone     || "",
    avatarUrl: user?.avatarUrl || "",
    language:  user?.language  || "en",
    timezone:  user?.timezone  || "Asia/Kolkata",
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState("");

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const data = await api.put("/settings/profile", form);
      setUser({ ...user, ...data.user });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
        <User className="size-4.5 text-primary" />
        <h2 className="text-base font-semibold text-white">Profile</h2>
      </div>

      {/* Avatar preview */}
      {form.avatarUrl && (
        <div className="mb-5">
          <img
            src={form.avatarUrl}
            alt="Avatar preview"
            className="size-16 rounded-full object-cover border-2 border-primary/30"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        </div>
      )}

      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Full Name"  value={form.name}     onChange={f("name")} />
          <Input
            label="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().trim() })}
            helperText="ledgerflow.com/u/username"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Phone"     value={form.phone}     onChange={f("phone")} />
          <Input label="Avatar URL" value={form.avatarUrl} onChange={f("avatarUrl")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Language"
            value={form.language}
            onChange={f("language")}
            options={[
              { value: "en", label: "English" },
              { value: "hi", label: "Hindi" },
            ]}
          />
          <Select
            label="Timezone"
            value={form.timezone}
            onChange={f("timezone")}
            options={[
              { value: "Asia/Kolkata",    label: "IST (Asia/Kolkata)" },
              { value: "UTC",             label: "UTC" },
              { value: "America/New_York",label: "EST (New York)" },
              { value: "Europe/London",   label: "GMT (London)" },
              { value: "Asia/Dubai",      label: "GST (Dubai)" },
            ]}
          />
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" loading={saving}>
            Save Profile
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-primary">
              <CheckCircle2 className="size-4" /> Saved
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}