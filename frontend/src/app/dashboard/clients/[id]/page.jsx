"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FolderKanban, FileText, Mail, Phone, Globe } from "lucide-react";
import { Card, Badge, EmptyState } from "@/components/ui/Primitives";
import Button from "@/components/ui/Button";
import { useClient } from "@/lib/hooks/useClients";
import { formatCurrency, formatDate } from "@/lib/format";

export default function ClientDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data, isLoading } = useClient(id);
  const client = data?.client;

  if (isLoading) return <div className="h-40 animate-pulse bg-white/5 rounded-2xl" />;
  if (!client) return null;

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white cursor-pointer">
        <ArrowLeft className="size-4" /> Back to Clients
      </button>

      <Card className="p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{client.companyName}</h1>
            <p className="text-sm text-slate-400 mt-1">{client.contactName}</p>
          </div>
          <Link href={`/dashboard/invoices/new?clientId=${client.id}`}>
            <Button>Generate Invoice</Button>
          </Link>
        </div>

        <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-white/10">
          {client.email && (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Mail className="size-4 text-slate-500" /> {client.email}
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Phone className="size-4 text-slate-500" /> {client.phone}
            </div>
          )}
          {client.country && (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Globe className="size-4 text-slate-500" /> {client.country} · {client.currency}
            </div>
          )}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FolderKanban className="size-4.5 text-primary" />
            <h2 className="text-base font-semibold text-white">Projects</h2>
          </div>
          {!client.projects?.length ? (
            <EmptyState icon={FolderKanban} title="No projects yet" className="py-8" />
          ) : (
            <div className="space-y-3">
              {client.projects.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-navy-900/50 border border-white/5">
                  <div>
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.budget ? formatCurrency(p.budget, p.currency) : "No budget set"}</p>
                  </div>
                  <Badge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="size-4.5 text-primary" />
            <h2 className="text-base font-semibold text-white">Invoices</h2>
          </div>
          {!client.invoices?.length ? (
            <EmptyState icon={FileText} title="No invoices yet" className="py-8" />
          ) : (
            <div className="space-y-3">
              {client.invoices.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/dashboard/invoices/${inv.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-navy-900/50 border border-white/5 hover:border-primary/30 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{inv.invoiceNumber}</p>
                    <p className="text-xs text-slate-500">{formatDate(inv.issueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{formatCurrency(inv.total, inv.currency)}</p>
                    <Badge status={inv.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
