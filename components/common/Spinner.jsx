"use client";

/**
 * Spinner ringan untuk loading state. Pakai token moki-*.
 */
export default function Spinner({ size = 16, className = "" }) {
  return (
    <span
      role="status"
      aria-label="Memuat"
      className={`inline-block rounded-full border-2 border-moki-mute border-t-transparent animate-spin ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
