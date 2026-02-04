"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { auth } from "@/lib/api";

export function useAuth(requireAuth = true) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, isHydrated, hydrate, setUser, logout } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    async function fetchUser() {
      const { accessToken, isHydrated } = useAuthStore.getState();
      if (!isHydrated) return;

      if (!accessToken) {
        useAuthStore.setState({ isLoading: false });
        return;
      }

      try {
        const userData = await auth.me();
        setUser(userData);
      } catch {
        logout();
      }
    }

    if (isHydrated && isAuthenticated && !user) {
      fetchUser();
    } else if (isHydrated && !isAuthenticated) {
      useAuthStore.setState({ isLoading: false });
    }
  }, [isHydrated, isAuthenticated, user, setUser, logout]);

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, requireAuth, isAuthenticated, router]);

  return {
    user,
    isLoading,
    isAuthenticated,
    logout,
  };
}

export function useRequireAuth() {
  return useAuth(true);
}

export function useOptionalAuth() {
  return useAuth(false);
}
