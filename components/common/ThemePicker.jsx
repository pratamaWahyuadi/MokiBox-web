"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useThemeStore } from "@/stores/useThemeStore";

const CHOSEN_KEY = "mokibox.theme.chosen";

const OPTIONS = [
  { value: "warm", label: "Terang", description: "Tampilan cream klasik", Icon: Sun },
  { value: "mellow", label: "Gelap", description: "Tampilan mellow gelap", Icon: Moon },
  { value: "system", label: "Ikuti Sistem", description: "Otomatis ikut perangkat", Icon: Monitor },
];

/**
 * First-launch modal untuk pilih tema. Tampil sekali sampai user memilih
 * (atau menutup dengan Escape / backdrop, yang otomatis set default "system").
 * Flag disimpan ke localStorage terpisah supaya reset tema tidak reset flag.
 */
export default function ThemePicker() {
  const setTheme = useThemeStore((s) => s.setTheme);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setMounted(true);
    try {
      const chosen = window.localStorage.getItem(CHOSEN_KEY);
      if (chosen !== "1") setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") finalize("system");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function finalize(value) {
    setTheme(value);
    try {
      window.localStorage.setItem(CHOSEN_KEY, "1");
    } catch {}
    setOpen(false);
  }

  if (!mounted || !open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pilih tema"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={() => finalize("system")}
    >
      <div
        className="w-full max-w-md bg-moki-surface text-moki-text border border-moki-line rounded-2xl shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <h2 className="font-brand font-black text-xl">Pilih Tema</h2>
          <p className="text-sm text-moki-mute mt-1">
            Tentukan tampilan MokiBox. Bisa diganti nanti dari menu.
          </p>
        </div>

        <ul className="flex flex-col gap-2">
          {OPTIONS.map(({ value, label, description, Icon }) => (
            <li key={value}>
              <button
                type="button"
                onClick={() => finalize(value)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-moki-line bg-moki-bg hover:bg-moki-surface/70 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-moki-accent/60"
              >
                <span className="w-10 h-10 rounded-full bg-moki-surface border border-moki-line flex items-center justify-center text-moki-accent">
                  <Icon className="w-5 h-5" />
                </span>
                <span className="flex-1 text-left">
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="block text-xs text-moki-mute">{description}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <p className="text-[11px] text-moki-mute text-center mt-4">
          Esc atau klik luar untuk lewati (default: Ikuti Sistem).
        </p>
      </div>
    </div>
  );
}
