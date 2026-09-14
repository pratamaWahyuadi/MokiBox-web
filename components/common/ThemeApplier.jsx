"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/stores/useThemeStore";
import { useResolvedTheme } from "@/hooks/useResolvedTheme";

/**
 * Pasang/hapus class .moki-mellow di <html> saat theme berubah.
 * Return null — efek samping murni.
 */
export default function ThemeApplier() {
  const theme = useThemeStore((s) => s.theme);
  const resolved = useResolvedTheme();

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (resolved === "mellow") {
      document.documentElement.classList.add("moki-mellow");
    } else {
      document.documentElement.classList.remove("moki-mellow");
    }
  }, [theme, resolved]);

  return null;
}
