"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Bell, ChevronDown, LogOut, Settings as SettingsIcon } from "lucide-react";
import { useNotifications, useMarkAllRead } from "@/lib/hooks/useFinance";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";

export default function Topbar({ onMenuClick }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);
  const { data } = useNotifications();
  const markAllRead = useMarkAllRead();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const unread = data?.unreadCount || 0;

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearUser();
      router.push("/login");
    }
  };

  return (
    <header className="h-20 border-b border-white/10 flex items-center justify-between px-6 sticky top-0 bg-navy-950/80 backdrop-blur-md z-30">
      <button onClick={onMenuClick} className="lg:hidden size-10 flex items-center justify-center text-slate-300 cursor-pointer" aria-label="Open menu">
        <Menu className="size-5" />
      </button>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="Notifications"
            className="relative size-10 rounded-xl flex items-center justify-center text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Bell className="size-5" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-white/10 bg-navy-800 shadow-card overflow-hidden animate-fadeUp">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <p className="text-sm font-semibold text-white">Notifications</p>
                {unread > 0 && (
                  <button onClick={() => markAllRead.mutate()} className="text-xs text-primary cursor-pointer">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {!data?.notifications?.length && (
                  <p className="text-sm text-slate-500 text-center py-8">You're all caught up.</p>
                )}
                {data?.notifications?.map((n) => (
                  <div key={n.id} className={`px-4 py-3 border-b border-white/5 ${!n.read ? "bg-primary/5" : ""}`}>
                    <p className="text-sm text-slate-200">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setUserOpen(!userOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 h-10 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="size-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-primary text-sm font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <span className="hidden sm:block text-sm text-slate-200">{user?.name || "Account"}</span>
            <ChevronDown className="size-3.5 text-slate-500" />
          </button>

          {userOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-white/10 bg-navy-800 shadow-card overflow-hidden animate-fadeUp">
              <button
                onClick={() => { setUserOpen(false); router.push("/dashboard/settings"); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 cursor-pointer"
              >
                <SettingsIcon className="size-4" /> Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-rose-400 hover:bg-white/5 cursor-pointer border-t border-white/5"
              >
                <LogOut className="size-4" /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
