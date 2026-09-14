# MokiBox — Fase 3 Index (3 Sub-Task)

## Konteks

Fase 1 (fondasi) & Fase 2 (feed FYP) sudah selesai. Saat ini MokiBox punya:
- Login mock +5 user di `/login`
- Feed FYP di `/home` dengan VideoPlayer (hls.js), CommentDrawer, action overlay, infinite scroll, optimistic like
- Layout `(main)` dengan Sidebar (desktop) + BottomNav (mobile), auth-gated
- Token warna sudah support dark/light via class `.moki-mellow` di tailwind config + CSS variables

## Pemecahan Fase 3

Fase 3 dipecah jadi **3 sub-task** agar AI agent dengan context window terbatas bisa eksekusi satu per satu. Sub-task **harus berurutan** (A → B → C) karena ada dependensi.

| Sub-Task | File prompt | Dependency |
|---|---|---|
| **A. Theme System** | `fase3-subtask-A-theme.md` | Tidak ada (foundation) |
| **B. Profile + Detail Video** | `fase3-subtask-B-profile-detailvideo.md` | Tergantung A (untuk UI kontras tema) — secara teknis bisa tanpa A, tapi akan inkonsisten |
| **C. Search + Upload + Inbox + Notifikasi** | `fase3-subtask-C-search-upload-inbox-notif.md` | Tergantung A. B tidak wajib (link ke profile/video akan 404 kalau B belum jalan, B bisa ditambah nanti) |

## Cara pakai

1. **Jalankan sub-task A dulu** (theme system). Setelah selesai, agent berikutnya bisa lanjut ke B.
2. **Jalankan sub-task B** (profile + detail video). Refactor `Feed.jsx` dan `CommentDrawer.jsx` untuk extract komponen reusable (`VideoActions`, `CommentList`, `ErrorState`) — dipakai di kedua tempat.
3. **Jalankan sub-task C** (search, upload, inbox, notifikasi). Update nav agar link ke halaman-halaman ini aktif. Nav sebelumnya adalah placeholder dengan toast "segera hadir".

## Tabel ringkasan halaman yang akan dibuat

| Route | Sub-Task | Tipe |
|---|---|---|
| `app/(main)/[handle]/page.jsx` | B | Profil publik |
| `app/(main)/[handle]/video/[id]/page.jsx` | B | Detail video dengan comments |
| `app/(main)/discover/page.jsx` | C | Search/Temukan |
| `app/(main)/upload/page.jsx` | C | Upload wizard 3-step |
| `app/(main)/inbox/page.jsx` | C | List DM |
| `app/(main)/inbox/[conversationId]/page.jsx` | C | Detail chat |
| `app/(main)/notifications/page.jsx` | C | List notifikasi |

## Komponen & store baru (overview)

### Sub-task A
- `stores/useThemeStore.js` (zustand + persist)
- `hooks/useResolvedTheme.js` (OS detection + reactive listener)
- `components/common/ThemeScript.jsx` (inline pre-hydrate script)
- `components/common/ThemeApplier.jsx` (runtime class sync)
- `components/common/ThemePicker.jsx` (first-launch modal)
- `components/common/ThemeToggle.jsx` (cycle button)

### Sub-task B
- `app/(main)/[handle]/page.jsx` (Profil)
- `app/(main)/[handle]/video/[id]/page.jsx` (Detail Video)
- `components/feed/VideoActions.jsx` (extracted dari Feed.jsx FeedOverlay)
- `components/feed/CommentList.jsx` (extracted dari CommentDrawer)
- `components/common/ErrorState.jsx` (extracted dari Feed.jsx)
- `lib/paths.js` (helper `profileHref`, `videoHref`)

### Sub-task C
- `app/(main)/discover/page.jsx` (Search)
- `app/(main)/upload/page.jsx` (Upload)
- `app/(main)/inbox/page.jsx` (Inbox list)
- `app/(main)/inbox/[conversationId]/page.jsx` (Inbox detail)
- `app/(main)/notifications/page.jsx` (Notifikasi)
- `components/common/ChatBubble.jsx`
- `components/common/NotificationItem.jsx`
- `components/common/SearchInput.jsx`
- `components/common/EmptyState.jsx` (kalau belum)
- `components/common/Spinner.jsx` (kalau belum)
- `lib/api.js` ditambah: `getConversations`, `getMessages`, `sendMessage` (chat mock)

## Yang TIDAK dilakukan (reserved untuk Fase 4)

- Zitadel OAuth integration
- Real backend fetch
- React Query / SWR untuk caching
- Real R2 upload
- WebSocket/SSE realtime
- i18n / bahasa
- Push notification permission
- SEO metadata per-page
- Error boundary per-halaman
- Polish loading skeleton

## Verifikasi per sub-task

Setiap sub-task punya checklist verifikasi sendiri. Lihat file prompt masing-masing untuk detail.

## Aturan umum lintas sub-task

- **Stack**: Next.js 14 App Router + JSX murni (no TypeScript)
- **Styling**: Tailwind + token `moki-*` (no raw hex)
- **State**: Zustand + local `useState`/`useCallback`
- **Data**: `lib/api.js` (mock) — semua lewat adapter, jangan akses `mocks/` langsung
- **No emoji, no comments** (kecuali JSDoc)
- **Icon**: lucide-react
- **Pattern reuse**: pakai `Avatar`, `Button`, `Logo` dari `components/common/`
- **Auth-aware**: render berbeda untuk `is_owner` vs `!is_owner`, protected routes di `(main)/layout.jsx` sudah handle
