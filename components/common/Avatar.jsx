"use client";

import Image from "next/image";

/**
 * Avatar seragam. Support src null -> initial fallback.
 */
export default function Avatar({ src, alt = "", size = 40, className = "" }) {
  const px = `${size}px`;
  if (!src) {
    const initial = (alt || "?").trim().charAt(0).toUpperCase();
    return (
      <div
        className={`rounded-full bg-moki-surface border border-moki-line flex items-center justify-center text-moki-mute font-semibold ${className}`}
        style={{ width: px, height: px, fontSize: size * 0.4 }}
        aria-label={alt}
      >
        {initial}
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover border border-moki-line ${className}`}
      unoptimized
    />
  );
}
