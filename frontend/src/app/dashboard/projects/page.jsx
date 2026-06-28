"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, FolderKanban, Trash2, Pencil } from "lucide-react";
import { Card, EmptyState, Modal, Badge } from "@/components/ui/Primitives";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from "@/lib/hooks/useProjects";
import { useClients } from "@/lib/hooks/useClients";
import { formatCurrency, formatDate, CURRENCIES } from "@/lib/format";

const STATUS_OPTIONS = ["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];
const emptyForm = { clientId: "", name: "", description: "", budget: "", currency: "INR", deadline: "", status: "ACTIVE" };

// Format ISO date → "yyyy-MM-dd" for <input type="date">
function toDateInput(iso) {
  if (!iso) return "";
  return new Date(iso).toISOString().split("T")[0];
}

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen]     = useState(false);
  const [editTarget, setEditTarget] = useState(null); // project being edited
  const [form, setForm]             = useState(emptyForm);
  const [justCreated, setJustCreated] = useState(false);

  const { data, isLoading } = useProjects();
  const { data: clientsData } = useClients();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setCreateOpen(true);
      router.replace("/dashboard/projects");
    }
  }, [searchParams, router]);

  const clients  = clientsData?.clients || [];
  const projects = data?.projects       || [];
  const noClients = !isLoading && clients.length === 0;

  // ── Create ──────────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm(emptyForm);
    setJustCreated(false);
    setCreateOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await createProject.mutateAsync({
      ...form,
      budget:   form.budget   ? Number(form.budget)              : undefined,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
    });
    setJustCreated(true);
  };

  // ── Edit ────────────────────────────────────────────────────────────────
  const openEdit = (p) => {
    setEditTarget(p);
    setForm({
      clientId:    p.clientId    || "",
      name:        p.name        || "",
      description: p.description || "",
      budget:      p.budget      ? String(Number(p.budget)) : "",
      currency:    p.currency    || "INR",
      deadline:    toDateInput(p.deadline),
      status:      p.status      || "ACTIVE",
    });
    setEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    await updateProject.mutateAsync({
      id: editTarget.id,
      data: {
        ...form,
        budget:   form.budget   ? Number(form.budget)              : undefined,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      },
    });
    setEditOpen(false);
    setEditTarget(null);
  };

  // ── Shared form fields ───────────────────────────────────────────────────
  const ProjectForm = ({ onSubmit, loading, submitLabel }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <Select
        label="Client"
        required
        placeholder="Select a client"
        value={form.clientId}
        onChange={(e) => setForm({ ...form, clientId: e.target.value })}
        options={clients.map((c) => ({ value: c.id, label: c.companyName }))}
      />
      <Input
        label="Project Name"
        required
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <Input
        label="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Budget"
          type="number"
          min="0"
          value={form.budget}
          onChange={(e) => setForm({ ...form, budget: e.target.value })}
        />
        <Select
          label="Currency"
          value={form.currency}
          onChange={(e) => setForm({ ...form, currency: e.target.value })}
          options={CURRENCIES.map((c) => ({ value: c, label: c }))}
        />
      </div>
      {/* Date wrapper — overflow visible so calendar popup isn't clipped */}
      <div style={{ overflow: "visible", position: "relative" }}>
        <Input
          label="Deadline"
          type="date"
          value={form.deadline}
          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
        />
      </div>
      <Select
        label="Status"
        value={form.status}
        onChange={(e) => setForm({ ...form, status: e.target.value })}
        options={STATUS_OPTIONS.map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ") }))}
      />
      <Button type="submit" className="w-full" loading={loading}>
        {submitLabel}
      </Button>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-sm text-slate-400 mt-1">Track scope, budget, and deadlines for client work.</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>Create Project</Button>
      </div>

      {!isLoading && projects.length === 0 ? (
        <Card>
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description={noClients ? "Add a client first, then create a project for them." : "Create your first project to start tracking work."}
            actionLabel={noClients ? "Add Client" : "Create Project"}
            onAction={() => (noClients ? router.push("/dashboard/clients?new=1") : openCreate())}
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Card key={p.id} hover className="p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{p.client?.companyName}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {/* Edit button */}
                  <button
                    onClick={() => openEdit(p)}
                    className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-white/5 cursor-pointer"
                    aria-label="Edit project"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  {/* Delete button */}
                  <button
                    onClick={() => confirm(`Delete "${p.name}"?`) && deleteProject.mutate(p.id)}
                    className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 cursor-pointer"
                    aria-label="Delete project"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-slate-300">{p.budget ? formatCurrency(p.budget, p.currency) : "No budget"}</p>
                <Badge status={p.status} />
              </div>
              <p className="text-xs text-slate-500 mt-2">Deadline: {p.deadline ? formatDate(p.deadline) : "—"}</p>
              <Link href={`/dashboard/invoices/new?projectId=${p.id}&clientId=${p.clientId}`} className="block mt-4">
                <Button variant="secondary" size="sm" className="w-full">Generate Invoice</Button>
              </Link>
            </Card>
          ))}
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Project">
        {justCreated ? (
          <div className="text-center py-4">
            <div className="size-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="size-6 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">Project Created!</h3>
            <p className="text-sm text-slate-400 mb-6">Would you like to generate an invoice for it?</p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setCreateOpen(false)}>Not now</Button>
              <Button className="flex-1" onClick={() => router.push("/dashboard/invoices/new")}>Generate Invoice</Button>
            </div>
          </div>
        ) : noClients ? (
          <EmptyState
            icon={FolderKanban}
            title="Add a client first"
            description="Projects must belong to a client."
            actionLabel="Add Client"
            onAction={() => router.push("/dashboard/clients?new=1")}
          />
        ) : (
          <ProjectForm
            onSubmit={handleCreate}
            loading={createProject.isPending}
            submitLabel="Create Project"
          />
        )}
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Project">
        <ProjectForm
          onSubmit={handleEdit}
          loading={updateProject.isPending}
          submitLabel="Save Changes"
        />
      </Modal>
    </div>
  );
}