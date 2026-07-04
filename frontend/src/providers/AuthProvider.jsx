"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const PUBLIC_ROUTES = ["/login", "/signup", "/verify-email", "/onboarding"];

export default function AuthProvider({ children }) {
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname?.startsWith(r));

  useEffect(() => {
    // No session to check on login/signup/etc — skip the call so we don't
    // burn the auth rate-limit budget before the user even submits a form.
    if (isPublicRoute) {
      clearUser();
      return;
    }

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
  }, [setUser, clearUser, isPublicRoute]);

  return children;
}