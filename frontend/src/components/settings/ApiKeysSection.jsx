"use client";

import { useState, useEffect } from "react";
import { Key, Plus, Copy, Trash2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Primitives";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { api } from "@/lib/api";

export default function ApiKeysSection() {
  const [keys,     setKeys]     = useState([]);
  const [name,     setName]     = useState("");
  const [newKey,   setNewKey]   = useState(null);
  const [creating, setCreating] = useState(false);
  const [show,     setShow]     = useState(false);
  const [copied,   setCopied]   = useState(false);

  useEffect(() => {
    api.get("/settings/api-keys")
      .then((d) => setKeys(d.keys || []))
      .catch(() => {});
  }, []);

  const generate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const data = await api.post("/settings/api-keys", { name });
      setNewKey(data.key);
      setKeys((k) => [
        { id: `new-${Date.now()}`, name, prefix: data.prefix, createdAt: new Date() },
        ...k,
      ]);
      setName("");
    } finally {
      setCreating(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const revoke = async (id) => {
    if (!confirm("Revoke this API key?")) return;
    await api.delete(`/settings/api-keys/${id}`);
    setKeys((k) => k.filter((x) => x.id !== id));
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
        <Key className="size-4.5 text-primary" />
        <h2 className="text-base font-semibold text-white">API Keys</h2>
      </div>

      {/* One-time key reveal */}
      {newKey && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-xs text-emerald-400 font-medium mb-2">
            Copy this key now — it won't be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono text-white bg-navy-900 px-3 py-2 rounded-lg truncate">
              {show ? newKey : `${newKey.slice(0, 12)}${"•".repeat(20)}`}
            </code>
            <button
              onClick={() => setShow(!show)}
              className="size-8 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              title={show ? "Hide" : "Show"}
            >
              {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
            <button
              onClick={copy}
              className="size-8 flex items-center justify-center text-slate-400 hover:text-primary cursor-pointer"
              title="Copy"
            >
              {copied
                ? <CheckCircle2 className="size-3.5 text-primary" />
                : <Copy className="size-3.5" />
              }
            </button>
          </div>
        </div>
      )}

      {/* Generate form */}
      <div className="flex gap-3 mb-6">
        <Input
          placeholder="Key name (e.g. Production)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generate()}
        />
        <Button icon={Plus} loading={creating} onClick={generate}>
          Generate
        </Button>
      </div>

      {/* Key list */}
      <div className="space-y-1">
        {keys.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">
            No API keys yet. Generate one above.
          </p>
        ) : (
          keys.map((k, idx) => (
            <div
              key={k.id}
              className={`flex items-center gap-3 py-3 ${
                idx < keys.length - 1 ? "border-b border-white/5" : ""
              }`}
            >
              <code className="text-xs font-mono text-slate-400 bg-navy-800 px-2 py-1 rounded">
                {k.prefix}••••
              </code>
              <span className="flex-1 text-sm text-white">{k.name}</span>
              <span className="text-xs text-slate-500">
                {new Date(k.createdAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => revoke(k.id)}
                className="size-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 cursor-pointer"
                title="Revoke key"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}