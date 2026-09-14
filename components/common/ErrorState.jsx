"use client";

import { AlertTriangle } from "lucide-react";
import { ApiError } from "@/lib/apiError.js";

/**
 * Error state generic dengan tombol retry.
 *
 * Props:
 * - error: Error | ApiError | null
 * - onRetry: () => void
 * - title: string (opsional, default "Terjadi kesalahan")
 */
export default function ErrorState({ error, onRetry, title = "Terjadi kesalahan" }) {
  const msg =
    error instanceof ApiError
      ? `[${error.code}] ${error.message}`
      : error?.message || "Tidak diketahui.";
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <AlertTriangle className="w-10 h-10 text-moki-accent mb-3" aria-hidden="true" />
      <p className="text-sm font-semibold text-moki-text mb-1">{title}</p>
      <p className="text-xs text-moki-mute mb-4 max-w-xs break-words">{msg}</p>
      {typeof onRetry === "function" ? (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-full bg-moki-accent text-moki-bg text-sm font-semibold hover:brightness-110"
        >
          Coba lagi
        </button>
      ) : null}
    </div>
  );
}
