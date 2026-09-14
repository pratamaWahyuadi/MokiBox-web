"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Auth store untuk mock layer.
 * currentUserId = null artinya belum login (mock) -> redirect ke /login.
 * Persisted ke localStorage agar halaman berikutnya masih ingat pilihan user.
 * `hasHydrated` menandai selesai rehydrate (untuk hindari race redirect di first paint).
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      currentUserId: null,
      hasHydrated: false,
      setCurrentUserId: (id) => set({ currentUserId: id }),
      logout: () => set({ currentUserId: null }),
      setHasHydrated: (v) => set({ hasHydrated: Boolean(v) }),
    }),
    {
      name: "mokibox.auth",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : undefined
      ),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated?.(true);
      },
    }
  )
);
