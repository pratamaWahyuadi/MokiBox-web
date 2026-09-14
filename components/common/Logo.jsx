"use client";

import Image from "next/image";

/**
 * Logo MokiBox. Dipakai sebagai brand mark di header, loading state, dll.
 *
 * Props:
 * - size: number (px) untuk kotak box saja (tanpa wordmark)
 * - showWordmark: boolean — tampilkan teks "MokiBox" di samping
 * - width/height: override untuk mode withWordmark
 */
export default function Logo({ size = 48, showWordmark = false, className = "" }) {
  if (showWordmark) {
    // aspect 1:1 untuk box, wordmark proporsional
    const h = Math.round(size * 2.6);
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <Image
          src="/logo.jpg"
          alt="MokiBox"
          width={size}
          height={size}
          className="rounded-xl"
          unoptimized
          priority
        />
        <span
          className="font-black tracking-tight font-brand"
          style={{ fontSize: Math.round(size * 0.55) }}
        >
          <span className="text-moki-gold">Moki</span>
          <span className="text-moki-ink">Box</span>
        </span>
      </span>
    );
  }
  return (
    <Image
      src="/logo.jpg"
      alt="MokiBox"
      width={size}
      height={size}
      className={`rounded-xl ${className}`}
      unoptimized
      priority
    />
  );
}
