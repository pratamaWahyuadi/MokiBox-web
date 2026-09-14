"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import api from "@/lib/api";
import Sidebar from "@/components/nav/Sidebar.jsx";
import BottomNav from "@/components/nav/BottomNav.jsx";
import ThemePicker from "@/components/common/ThemePicker.jsx";

/**
 * Layout untuk halaman "main" (post-login).
 * - Auth gate: kalau belum login -> redirect ke /login.
 * - Desktop: render Sidebar + children.
 * - Mobile: render children fullscreen + BottomNav floating.
 * - Item nav yang belum ada halamannya tampilkan toast "coming soon".
 */
export default function MainLayout({ children }) {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.currentUserId);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!currentUserId) {
      router.replace("/login");
      return;
    }
    api.setCurrentUserId(currentUserId);
  }, [hasHydrated, currentUserId, router]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  if (!hasHydrated || !currentUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-moki-mute">
        <div className="animate-pulse text-sm">Mengarahkan…</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-moki-bg flex">
      <Sidebar onDisabledClick={(label) => setToast(`${label} — segera hadir`)} />

      <main className="relative flex-1 min-w-0 h-full overflow-hidden pb-14 md:pb-0">
        {children}
      </main>

      <BottomNav onDisabledClick={(label) => setToast(`${label || "Fitur"} — segera hadir`)} />

      {toast ? (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 bg-moki-surface text-moki-text text-xs px-3 py-2 rounded-full border border-moki-line shadow-lg z-50">
          {toast}
        </div>
      ) : null}

      <ThemePicker />
    </div>
  );
}