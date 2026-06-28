"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, Modal } from "@/components/ui/Primitives";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";

export default function DangerZoneSection() {
  const { clearUser } = useAuthStore();
  const [open,     setOpen]     = useState(false);
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const deleteAccount = async () => {
    setError("");
    setLoading(true);
    try {
      await api.delete("/settings/account", { password });
      clearUser();
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Failed to delete account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 border-rose-500/20">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
        <AlertTriangle className="size-4.5 text-rose-400" />
        <h2 className="text-base font-semibold text-rose-400">Danger Zone</h2>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5">
          <p className="text-sm font-medium text-white mb-1">Delete Account</p>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Permanently deletes your account, all clients, invoices, expenses, and projects.
            This action cannot be undone.
          </p>
          <Button
            size="sm"
            onClick={() => setOpen(true)}
            className="bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:bg-rose-500/30"
          >
            Delete My Account
          </Button>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => { setOpen(false); setPassword(""); setError(""); }}
        title="Confirm Account Deletion"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <p className="text-sm text-rose-300 leading-relaxed">
              This will permanently delete everything in your account. This cannot be undone.
            </p>
          </div>
          <Input
            label="Confirm your password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => { setOpen(false); setPassword(""); setError(""); }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:bg-rose-500/30"
              loading={loading}
              onClick={deleteAccount}
            >
              Delete Forever
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}