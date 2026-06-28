"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function AuthProvider({ children }) {
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/auth/me")
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) clearUser();
      });
    return () => {
      cancelled = true;
    };
  }, [setUser, clearUser]);

  return children;
}
