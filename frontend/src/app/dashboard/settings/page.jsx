"use client";

import { useState } from "react";
import {
  User, Building2, FileText, Bell, ShieldCheck,
  Palette, Database, Key, AlertTriangle, ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/Primitives";
import ProfileSection         from "@/components/settings/ProfileSection";
import BusinessSection        from "@/components/settings/BusinessSection";
import InvoiceDefaultsSection from "@/components/settings/InvoiceDefaultsSection";
import NotificationsSection   from "@/components/settings/NotificationsSection";
import SecuritySection        from "@/components/settings/SecuritySection";
import AppearanceSection      from "@/components/settings/AppearanceSection";
import DataSection            from "@/components/settings/DataSection";
import ApiKeysSection         from "@/components/settings/ApiKeysSection";
import DangerZoneSection      from "@/components/settings/DangerZoneSection";

const TABS = [
  { id: "profile",    label: "Profile",          icon: User,          section: ProfileSection },
  { id: "business",   label: "Business",         icon: Building2,     section: BusinessSection },
  { id: "invoice",    label: "Invoice Defaults", icon: FileText,      section: InvoiceDefaultsSection },
  { id: "notifs",     label: "Notifications",    icon: Bell,          section: NotificationsSection },
  { id: "security",   label: "Security",         icon: ShieldCheck,   section: SecuritySection },
  { id: "appearance", label: "Appearance",       icon: Palette,       section: AppearanceSection },
  { id: "data",       label: "Data",             icon: Database,      section: DataSection },
  { id: "apikeys",    label: "API Keys",         icon: Key,           section: ApiKeysSection },
  { id: "danger",     label: "Danger Zone",      icon: AlertTriangle, section: DangerZoneSection, danger: true },
];

function TabButton({ tab, active, onClick }) {
  const Icon = tab.icon;
  return (
    <button
      onClick={() => onClick(tab.id)}
      className={[
        "w-full flex items-center gap-3 px-4 h-10 rounded-xl text-sm font-medium",
        "transition-colors text-left cursor-pointer border",
        active
          ? "bg-primary/10 text-primary border-primary/20"
          : tab.danger
          ? "text-rose-400 hover:bg-rose-400/5 border-transparent"
          : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent",
      ].join(" ")}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 text-left">{tab.label}</span>
      {active && <ChevronRight className="size-3.5 shrink-0 opacity-60" />}
    </button>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const ActiveSection = TABS.find((t) => t.id === activeTab)?.section || ProfileSection;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your account, business info, and preferences.
        </p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Left nav */}
        <Card className="w-56 shrink-0 p-3 space-y-1 sticky top-6">
          {TABS.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              active={activeTab === tab.id}
              onClick={setActiveTab}
            />
          ))}
        </Card>

        {/* Section content */}
        <div className="flex-1 min-w-0">
          <ActiveSection />
        </div>
      </div>
    </div>
  );
}