# MokiBox — Fase 3 Sub-Task A: Theme System (Dark/Light/System)

> **Prompt untuk AI agent selanjutnya.** Lihat juga `fase3-INDEX.md` untuk konteks 3 sub-task secara keseluruhan.

## Konteks

Kamu adalah AI agent yang melanjutkan pembangunan **MokiBox** (clone TikTok versi web). **Fase 1 & 2 sudah selesai**. Saat ini website punya 2 tema visual (warm cream + mellow dark) tapi theme **belum bisa di-toggle** oleh user. Setup token warna sudah ada di `tailwind.config.js` & `globals.css` dengan `darkMode: ["class", ".moki-mellow"]` dan CSS variables di `:root` (warm, default) + `.moki-mellow` (dark).

**Tugas kamu HANYA sub-task A ini**: implement theme system lengkap (first-launch picker + inline toggle + 3 state: warm/mellow/system). Jangan kerjakan halaman Fase 3 (Profil, Search, Detail Video, Upload, Inbox, Notifikasi) — itu di sub-task B & C.

## Setup & bacaan wajib (WAJIB sebelum ngoding)

1. Baca `/root/MokiBox/PLAN.md` — fokus ke keputusan teknis (Fase 1) + struktur folder.
2. Baca `/root/MokiBox/api_contracts.md` — tidak ada endpoint baru untuk tema (semua client-side), hanya referensi.
3. Baca `/root/MokiBox/tailwind.config.js` — sudah ada `darkMode: ["class", ".moki-mellow"]`, warna pakai `rgb(var(--moki-X) / <alpha-value>)`.
4. Baca `/root/MokiBox/app/globals.css` — sudah ada CSS variables: warm (default di `:root`) + mellow (di `.moki-mellow`). Body pakai `rgb(var(--moki-bg))` + `transition: 200ms`.
5. Baca `/root/MokiBox/stores/useAuthStore.js` — pola `zustand + persist + createJSONStorage` untuk localStorage. **Tiru pola ini untuk theme store.**
6. Baca `/root/MokiBox/stores/usePlayerStore.js` — contoh store tanpa persist (untuk resolved-theme hook).
7. Eksplorasi struktur: `app/layout.jsx`, `app/(main)/layout.jsx`, `components/nav/Sidebar.jsx`, `components/nav/BottomNav.jsx`, `components/common/Button.jsx`, `components/common/Logo.jsx`.

## Stack & aturan ketat (TIDAK boleh dilanggar)

- **Next.js 14 App Router**, JavaScript murni (JSX), **TANPA TypeScript**
- **Tailwind CSS** pakai token `moki-*` dari CSS variables — JANGAN pakai raw hex di komponen
- **State**: Zustand dengan `persist` (seperti `useAuthStore`)
- **Dark mode strategy**: class-based via `darkMode: ["class", ".moki-mellow"]` di tailwind.config — tambah/hapus class di `<html>` untuk swap tema
- **Tidak boleh pakai library baru** kecuali untuk ikon (pakai `lucide-react` yang sudah ada)
- **Tidak ada emoji** di kode
- **Tidak ada komentar** di kode kecuali JSDoc untuk tipe/data
- **Komponen reusable** di `components/common/` atau `components/nav/`
- Tema default user pertama = **"system"** (follow OS preference). User bisa pilih warm/mellow/system via first-launch modal ATAU toggle nanti

## Cakupan Sub-Task A — yang harus dibangun

### 1. `stores/useThemeStore.js` (BARU)

```js
"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Theme store — "warm" | "mellow" | "system".
 * - "system" = follow OS prefers-color-scheme.
 * - Disimpan ke localStorage, persisted lintas reload.
 * - First-launch default: "system".
 */
export const useThemeStore = create(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (t) => set({ theme: t === "warm" || t === "mellow" ? t : "system" }),
    }),
    {
      name: "mokibox.theme",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : undefined)),
    }
  )
);
```

### 2. `hooks/useResolvedTheme.js` (BARU)

Hook yang me-resolve "system" ke "warm"/"mellow" berdasarkan `prefers-color-scheme` OS, dan reactive (listen ke `mq.addEventListener("change", ...)`).

```js
"use client";
import { useEffect, useState } from "react";
import { useThemeStore } from "@/stores/useThemeStore";

/**
 * Resolve theme "system" ke "warm" | "mellow" berdasarkan OS preference.
 * Return: "warm" | "mellow"
 */
export function useResolvedTheme() {
  const theme = useThemeStore((s) => s.theme);
  const [resolved, setResolved] = useState("warm");
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (theme !== "system") {
      setResolved(theme);
      return undefined;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setResolved(mq.matches ? "mellow" : "warm");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);
  return resolved;
}
```

### 3. `components/common/ThemeScript.jsx` (BARU) — inline script pre-hydrate

Server-render component yang inject inline `<script>` di `<head>` baca localStorage SEBELUM React hydrate. **Penting**: ini mencegah flash warna (FOUC) saat reload.

```jsx
"use client";

/**
 * Inline script di <head> yang pasang class .moki-mellow di <html>
 * SEBELUM React hydrate, supaya tidak ada flash warna saat page load.
 * Baca dari localStorage "mokibox.theme" (sesuai nama store).
 */
export default function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem("mokibox.theme");var s=t?JSON.parse(t).state&&JSON.parse(t).state.theme:"system";if(s==="mellow"||(s==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("moki-mellow")}else{document.documentElement.classList.remove("moki-mellow")}}catch(e){}})();`,
      }}
    />
  );
}
```

Pasang `<ThemeScript />` di dalam `<head>` di `app/layout.jsx` (root layout, bukan `(main)/layout.jsx`).

### 4. `components/common/ThemeApplier.jsx` (BARU) — sync class saat runtime

Client component (return `null`) yang listen `useThemeStore` dan apply/remove class `.moki-mellow` di `<html>` setiap kali theme berubah. Pasang di `app/layout.jsx` (di body, setelah children — aman untuk dipanggil di server tapi logic-nya hanya jalan di client karena pakai `useEffect`).

```jsx
"use client";
import { useEffect } from "react";
import { useThemeStore } from "@/stores/useThemeStore";
import { useResolvedTheme } from "@/hooks/useResolvedTheme";

/**
 * Pasang/hapus class .moki-mellow di <html> saat theme berubah.
 * Return null — efek samping murni.
 */
export default function ThemeApplier() {
  const theme = useThemeStore((s) => s.theme);
  const resolved = useResolvedTheme();
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (resolved === "mellow") {
      document.documentElement.classList.add("moki-mellow");
    } else {
      document.documentElement.classList.remove("moki-mellow");
    }
  }, [theme, resolved]);
  return null;
}
```

### 5. `components/common/ThemePicker.jsx` (BARU) — first-launch modal

Modal full-screen dengan 3 kartu pilihan tema: **Terang** (warm) / **Gelap** (mellow) / **Ikuti Sistem** (system). Tampilkan **HANYA** saat first launch (belum pernah ada interaksi tema sebelumnya).

Deteksi first-launch: cek localStorage key `"mokibox.theme.chosen"` (boolean string `"1"`). Flag ini di-set saat user pertama kali memilih tema (baik via modal maupun toggle inline). **BUKAN** bagian dari `useThemeStore` — flag terpisah supaya reset tema tidak reset flag.

Props: tidak ada (komponen self-contained).

Behavior:
- Tampilkan backdrop semi-transparan + card center
- 3 tombol besar dengan ikon (Sun untuk Terang, Moon untuk Gelap, Monitor/Computer untuk Ikuti Sistem)
- Klik salah satu → `setTheme(t)` + `localStorage.setItem("mokibox.theme.chosen", "1")` + modal hilang
- Klik backdrop = set default "system" + flag chosen
- Tutup dengan Escape = set default "system" + flag chosen
- Jangan render apa-apa (return null) setelah flag chosen

Pasang di `app/(main)/layout.jsx` agar hanya muncul di area authenticated (login page tidak butuh tema dulu, default system sudah cukup).

### 6. `components/common/ThemeToggle.jsx` (BARU) — cycle button

Tombol toggle yang cycle 3 state: warm → mellow → system → warm. Icon berubah:
- warm = `Sun` (lucide)
- mellow = `Moon`
- system = `Monitor` atau `Laptop`

Props: `className?: string` (untuk posisi di parent).

Behavior:
- Klik = `setTheme(next)`
- Tampilkan tooltip/aria-label current state
- Pakai `useResolvedTheme` untuk icon (saat state "system", icon ikut OS resolved)
- Cycle logic: `theme === "warm" → setTheme("mellow")`, `theme === "mellow" → setTheme("system")`, `theme === "system" → setTheme("warm")`

### 7. Pasang toggle di Sidebar + BottomNav

- **`components/nav/Sidebar.jsx`**: tambah `<ThemeToggle />` di header area, **di samping `<Logo />`** (pojok kanan). Tetap di atas logout user area.
- **`components/nav/BottomNav.jsx`**: tambah `<ThemeToggle />` sebagai tombol **floating pojok kanan-atas** (di atas list nav, fixed). Class: `fixed top-3 right-3 z-50 md:hidden`.

Pastikan tidak bentrok dengan `ThemePicker` first-launch modal — toggle inline set flag chosen juga supaya modal tidak muncul lagi (idealnya `ThemePicker` mount hanya saat first launch dan setelah mount set flag, jadi setelah user klik toggle sebelum modal muncul pun aman).

### 8. Update `app/layout.jsx` (root layout)

- Import `ThemeScript` + `ThemeApplier`
- Pasang `<ThemeScript />` di dalam `<head>` (sebelum Nunito font link)
- Pasang `<ThemeApplier />` di body (boleh sebelum atau sesudah `{children}`)

### 9. Update `app/(main)/layout.jsx`

- Import `ThemePicker` dari `@/components/common/ThemePicker.jsx`
- Render `<ThemePicker />` di akhir JSX (selain Sidebar, BottomNav, toast)

## Yang TIDAK boleh dilakukan

- **Jangan kerjakan halaman Fase 3** (Profil, Search, Detail Video, Upload, Inbox, Notifikasi) — itu sub-task B & C
- **Jangan tambah bahasa/i18n**, notifikasi push permission, full Settings page dengan section lain
- **Jangan ubah `lib/api.js`**, **tailwind.config.js** (sudah siap), **globals.css` (CSS variables sudah ada, jangan ubah nilai warna kecuali Anda menemukan bug kontras)
- **Jangan ubah struktur route** — cukup tambah file komponen baru dan pasang di layout existing
- **Jangan pakai library baru** (semua bisa pakai Next/React/zustand/lucide yang sudah ada)
- **Jangan ubah Feed, VideoPlayer, CommentDrawer** (Fase 2)

## Verifikasi sebelum selesaikan

1. `npm run lint` → harus clean
2. `npm run dev` → buka `http://localhost:3000`:
   - First load: modal tema muncul (jika flag belum chosen)
   - Pilih salah satu → tema terapan, modal hilang, flag chosen
   - Reload → tema persist, **tidak ada flash warna** (FOUC) berkat ThemeScript inline
   - Klik toggle di Sidebar (desktop) atau pojok kanan-atas (mobile) → cycle warm/mellow/system
   - Pilih "system" → switch OS theme (kalau bisa di-test) → tema ikut
   - Cek kontras WCAG AA di kedua tema: button primary (kuning accent + text gelap), body text, surface borders
3. `npm run build` → sukses (kalau env low-spec sabar, build pertama memang lama)

## Tradeoff & keputusan kecil yang harus diambil agent

1. **Icon untuk "system"**: pakai `Monitor` atau `Laptop` dari lucide-react. Saya usulkan `Monitor` karena lebih universal.
2. **Animation transition**: sudah ada `transition: background-color 200ms` di body globals.css. CSS variable transition otomatis. Tidak perlu tambah apa-apa.
3. **First-launch trigger alternatif**: bisa juga pakai `useThemeStore.persist.hasHydrated` + cek state. Tapi pendekatan localStorage flag `"mokibox.theme.chosen"` lebih simple dan tidak coupled dengan zustand persist internals.
4. **Toggle posisi di BottomNav**: floating pojok kanan-atas. Alternatif: ganti 1 item nav (misal Temukan) dengan toggle. Saya rekomendasikan floating karena tidak mengurangi5 item nav.
5. **Apakah ThemePicker render di /login?**: Tidak — saya sarankan ThemePicker hanya di `(main)/layout.jsx` (post-login). User di /login dapat default system (FOUC-free via ThemeScript) dan bisa pilih tema setelah login.

## Deliverables

- List file baru & yang diubah (singkat)
- Catatan asumsi/keputusan kecil
- Konfirmasi `npm run lint` clean & `npm run dev` OK

## Aturan kerja

- Baca file dulu sebelum edit
- Pakai `edit` tool dengan `oldString` unik
- Untuk file baru, `write` tool
- Jalankan tool secara paralel kalau tidak ada dependensi
- Ikuti pola Fase 1 & 2: JSDoc untuk tipe, "use client" di komponen interaktif, no comments di kode, no raw hex, no emoji

Mulai. Kalau ada ambiguitas yang mengharuskan klarifikasi, tanyakan sebelum lanjut.
