"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Users, Trash2, Pencil, ArrowRight } from "lucide-react";
import { Card, EmptyState, Modal } from "@/components/ui/Primitives";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from "@/lib/hooks/useClients";
import { CURRENCIES } from "@/lib/format";

const emptyForm = { companyName: "", contactName: "", email: "", phone: "", country: "", currency: "INR", notes: "" };

export default function ClientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [justAdded, setJustAdded] = useState(false);

  const { data, isLoading } = useClients(search);
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setModalOpen(true);
      router.replace("/dashboard/clients");
    }
  }, [searchParams, router]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setJustAdded(false);
    setModalOpen(true);
  };

  const openEdit = (client) => {
    setEditing(client);
    setForm({ ...emptyForm, ...client });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await updateClient.mutateAsync({ id: editing.id, data: form });
      setModalOpen(false);
    } else {
      await createClient.mutateAsync(form);
      setJustAdded(true);
    }
  };

  const clients = data?.clients || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-sm text-slate-400 mt-1">Manage the people and companies you work with.</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>Create Client</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clients..."
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-navy-800/60 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-400/60"
        />
      </div>

      {!isLoading && clients.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No clients yet"
            description="Add your first client to start creating projects and invoices."
            actionLabel="Add Client"
            onAction={openCreate}
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => (
            <Card key={c.id} hover className="p-5">
              <div className="flex items-start justify-between">
                <Link href={`/dashboard/clients/${c.id}`} className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{c.companyName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{c.contactName || "—"}</p>
                </Link>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(c)} className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer" aria-label="Edit client">
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => confirm(`Delete ${c.companyName}?`) && deleteClient.mutate(c.id)}
                    className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 cursor-pointer"
                    aria-label="Delete client"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                <span>{c._count?.projects ?? 0} projects</span>
                <span>{c._count?.invoices ?? 0} invoices</span>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-white/5">{c.currency}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Client" : "Add Client"}>
        {justAdded ? (
          <div className="text-center py-4">
            <div className="size-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Users className="size-6 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">Client Added Successfully</h3>
            <p className="text-sm text-slate-400 mb-6">Would you like to create a project for them?</p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>
                Not now
              </Button>
              <Button className="flex-1" icon={ArrowRight} onClick={() => router.push("/dashboard/projects?new=1")}>
                Create Project
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Company Name" required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            <Input label="Contact Name" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              <Select
                label="Currency"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                options={CURRENCIES.map((c) => ({ value: c, label: c }))}
              />
            </div>
            <Button type="submit" className="w-full" loading={createClient.isPending || updateClient.isPending}>
              {editing ? "Save Changes" : "Add Client"}
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
