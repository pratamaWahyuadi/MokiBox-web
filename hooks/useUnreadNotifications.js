"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * Cek jumlah notifikasi belum dibaca, polling tiap 30 detik.
 * Return: number (0 = tidak ada badge).
 */
export function useUnreadNotifications() {
  const currentUserId = useAuthStore((s) => s.currentUserId);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!currentUserId) return undefined;
    let alive = true;
    const check = async () => {
      try {
        const res = await api.getNotifications({ limit: 50 });
        if (alive) setCount((res?.data || []).filter((n) => !n.is_read).length);
      } catch (err) {
        /* abaikan */
      }
    };
    check();
    const id = setInterval(check, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [currentUserId]);

  return count;
}
