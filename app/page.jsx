"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import api from "@/lib/api";

/**
 /entry redirector:
 - kalau belum ada currentUserId di store -> /login
 - kalau sudah -> sinkronkan ke api adapter dan ke /home (placeholder Fase 2)
 */
export default function HomeEntry() {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.currentUserId);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (currentUserId) {
      api.setCurrentUserId(currentUserId);
      router.replace("/home");
    } else {
      router.replace("/login");
    }
  }, [hasHydrated, currentUserId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-moki-mute">
      <div className="animate-pulse text-sm">MokiBox…</div>
    </div>
  );
}
