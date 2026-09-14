"use client";

import { Loader2 } from "lucide-react";

/**
 * Tombol seragam. Varian: primary, ghost, outline.
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  ...rest
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-moki-accent/60 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-moki-accent text-moki-bg hover:brightness-110",
    ghost: "text-moki-text hover:bg-moki-surface",
    outline: "border border-moki-line text-moki-text hover:bg-moki-surface",
  };
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
