"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  Receipt,
  CreditCard,
  BarChart3,
  Settings,
  Bot,
  X,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { useAIStore } from "@/store/aiStore";
import clsx from "clsx";

const NAV = [
  { href: "/dashboard",          label: "Overview",  icon: LayoutDashboard },
  { href: "/dashboard/clients",  label: "Clients",   icon: Users },
  { href: "/dashboard/projects", label: "Projects",  icon: FolderKanban },
  { href: "/dashboard/invoices", label: "Invoices",  icon: FileText },
  { href: "/dashboard/expenses", label: "Expenses",  icon: Receipt },
  { href: "/dashboard/payments", label: "Payments",  icon: CreditCard },
  { href: "/dashboard/reports",  label: "Reports",   icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings",  icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();
  const { togglePanel, isOpen: aiOpen } = useAIStore();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-navy-950/70 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          "fixed lg:sticky top-0 left-0 z-50 lg:z-0 h-screen w-64 shrink-0",
          "bg-navy-900 border-r border-white/10 flex flex-col",
          "transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/10">
          <Logo size="sm" />
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-thin">
          {NAV.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  "flex items-center gap-3 px-4 h-11 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                )}
              >
                <Icon className="size-4.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* AI Assistant — pinned to bottom */}
        <div className="px-4 pb-6 border-t border-white/10 pt-4">
          <button
            onClick={togglePanel}
            className={clsx(
              "w-full flex items-center gap-3 px-4 h-11 rounded-xl text-sm font-medium",
              "transition-colors border cursor-pointer",
              aiOpen
                ? "bg-primary/10 text-primary border-primary/20"
                : "text-slate-400 hover:text-white hover:bg-white/5 border-white/10"
            )}
          >
            <Bot className="size-4.5 shrink-0" />
            AI Assistant
            {aiOpen && (
              <span className="ml-auto size-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}