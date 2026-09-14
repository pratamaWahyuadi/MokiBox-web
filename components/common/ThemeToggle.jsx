"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useThemeStore } from "@/stores/useThemeStore";
import { useResolvedTheme } from "@/hooks/useResolvedTheme";

const CHOSEN_KEY = "mokibox.theme.chosen";

const ORDER = ["warm", "mellow", "system"];

const LABEL = {
  warm: "Tema: Terang",
  mellow: "Tema: Gelap",
  system: "Tema: Ikuti Sistem",
};

const ICON_FOR_RESOLVED = {
  warm: Sun,
  mellow: Moon,
  system: Monitor,
};

/**
 * Tombol toggle yang cycle warm -> mellow -> system -> warm.
 * Icon saat "system" mengikuti OS preference (resolved).
 */
export default function ThemeToggle({ className = "" }) {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const resolved = useResolvedTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showResolved = mounted && theme === "system";
  const visualTheme = showResolved ? resolved : theme;
  const Icon = ICON_FOR_RESOLVED[visualTheme] || Monitor;

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    try {
      window.localStorage.setItem(CHOSEN_KEY, "1");
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={LABEL[theme] || "Ganti tema"}
      title={LABEL[theme] || "Ganti tema"}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full border border-moki-line bg-moki-surface text-moki-text hover:bg-moki-bg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-moki-accent/60 ${className}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
