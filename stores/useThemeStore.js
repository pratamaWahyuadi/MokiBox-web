"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Theme store — "warm" | "mellow" | "system".
 * - "system" = follow OS prefers-color-scheme.
 * - Disimpan ke localStorage, persisted lintas reload.
 * - First-launch default: "system".
 */
export const useThemeStore = create(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (t) =>
        set({ theme: t === "warm" || t === "mellow" ? t : "system" }),
    }),
    {
      name: "mokibox.theme",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : undefined
      ),
    }
  )
);
