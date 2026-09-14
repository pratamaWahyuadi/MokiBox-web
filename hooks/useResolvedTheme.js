"use client";

import { useEffect, useState } from "react";
import { useThemeStore } from "@/stores/useThemeStore";

/**
 * Resolve theme "system" ke "warm" | "mellow" berdasarkan OS preference.
 * Return: "warm" | "mellow"
 */
export function useResolvedTheme() {
  const theme = useThemeStore((s) => s.theme);
  const [resolved, setResolved] = useState("warm");

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (theme !== "system") {
      setResolved(theme);
      return undefined;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setResolved(mq.matches ? "mellow" : "warm");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  return resolved;
}
