"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

/**
 * Input search dengan debounce bawaan (300ms).
 *
 * Props:
 * - value, onChange: kontrol nilai input langsung
 * - onDebouncedChange: (q) => dipanggil 300ms setelah user berhenti mengetik
 * - placeholder
 */
export default function SearchInput({
  value,
  onChange,
  onDebouncedChange,
  placeholder = "Cari",
}) {
  const [local, setLocal] = useState(value || "");
  const timerRef = useRef(null);

  useEffect(() => {
    setLocal(value || "");
  }, [value]);

  const emit = (next) => {
    setLocal(next);
    if (typeof onChange === "function") onChange(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (typeof onDebouncedChange === "function") {
      timerRef.current = setTimeout(() => onDebouncedChange(next.trim()), 300);
    }
  };

  const clear = () => {
    setLocal("");
    if (typeof onChange === "function") onChange("");
    if (timerRef.current) clearTimeout(timerRef.current);
    if (typeof onDebouncedChange === "function") onDebouncedChange("");
  };

  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), []);

  return (
    <div className="relative">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-moki-mute"
        aria-hidden="true"
      />
      <input
        type="text"
        value={local}
        onChange={(e) => emit(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-moki-surface border border-moki-line rounded-full pl-9 pr-9 py-2 text-sm text-moki-text placeholder:text-moki-mute focus:outline-none focus:border-moki-accent"
        aria-label="Pencarian"
      />
      {local ? (
        <button
          type="button"
          onClick={clear}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-moki-mute hover:text-moki-text hover:bg-moki-bg"
          aria-label="Clear pencarian"
        >
          <X className="w-4 h-4" />
        </button>
      ) : null}
    </div>
  );
}
