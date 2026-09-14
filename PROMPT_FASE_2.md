# Tugas: Membangun Fase 2 (Feed FYP) — MokiBox

Kamu adalah AI agent yang akan melanjutkan pembangunan **MokiBox** (clone TikTok versi web). **Fase 1 (Fondasi) sudah selesai.** Tugas kamu **hanya Fase 2** — bangun feed FYP. Jangan kerjakan Fase 3, 4, atau perubahan di luar scope.

## Setup & bacaan wajib (WAJIB dilakukan sebelum ngoding)

1. Baca `/root/MokiBox/PLAN.md` — terutama bagian "Fase 2 — Feed Inti / FYP" (poin 5–9).
2. Baca `/root/MokiBox/api_contracts.md` — fokus ke `GET /api/feed/home`, `VideoObject`, dan pola `getHomeFeed` (cursor pagination `next_cursor`).
3. Eksplorasi struktur project yang sudah ada:
   - `app/`, `components/`, `lib/`, `hooks/`, `stores/`, `mocks/`, `public/`
   - **PENTING**: buka dan pahami `lib/api.js` (adapter mock), `stores/useAuthStore.js`, `hooks/useApi.js`, `components/common/{Logo,Avatar,Button}.jsx`, dan placeholder di `app/home/page.jsx`. Komponen baru harus konsisten dengan pola yang sudah ada (JavaScript murni tanpa TypeScript, Tailwind, "use client" di komponen interaktif, JSDoc untuk tipe).
4. Cek `package.json` — `next 14`, `react 18`, `zustand`, `lucide-react`, `tailwindcss`. **Install dependency baru** hanya yang terbukti perlu (lihat di bawah).
5. Jalankan `npm run dev` di akhir untuk verifikasi; `npm run lint` harus bersih sebelum selesai.

## Stack & aturan ketat (tidak boleh dilanggar)

- **Next.js 14 App Router**, JavaScript murni (JSX), **TANPA TypeScript**.
- **Tailwind CSS** pakai tokens `moki-*` yang sudah didefinisikan di `tailwind.config.js` (`moki-bg`, `moki-surface`, `moki-line`, `moki-text`, `moki-mute`, `moki-accent`, `moki-accent2`). **Jangan pakai raw hex** di komponen — pakai token.
- **State management**: pakai Zustand (lihat `stores/useAuthStore.js` untuk pola). Tambah store baru jika perlu, jangan pakai Redux/Context berlebihan.
- **Data**: SEMUA panggilan data lewat `lib/api.js` (adapter mock). **Jangan akses mocks/ langsung dari komponen.** Signature & return shape harus identik dengan kontrak API (snake_case, `{ data, pagination: { next_cursor } }`).
- **Dark mode default** — sudah di-set di `app/layout.jsx` dan `app/globals.css`. Tetap konsisten.
- **Komponen reusable**: pakai `Logo`, `Avatar`, `Button` yang sudah ada. Boleh tambah komponen baru di `components/` (jangan taruh di `app/`).
- **TIDAK ADA emoji di file** kecuali untuk konten caption/comment (data).
- **TIDAK ADA komentar** di kode kecuali untuk JSDoc tipe/data.
- Icon pakai `lucide-react`.

## Cakupan Fase 2 — yang harus dibangun

### 1. `VideoPlayer` component (`components/feed/VideoPlayer.jsx`)
- HTML5 `<video>` + **`hls.js`** (install: `npm i hls.js`). Pakai dynamic import untuk hindari SSR error (`if (typeof window !== "undefined")`).
- **Autoplay** hanya untuk video yang sedang visible — pakai `IntersectionObserver` dengan threshold ~0.7, pause & reset saat keluar viewport.
- **Mute/unmute** global — state disimpan di Zustand store baru `stores/usePlayerStore.js` (jangan bikin toggle per-video). Ikon speaker di-overlay.
- **Tap-to-pause** (klik area video toggle play/pause). Jangan double-fire saat klik tombol mute.
- **Progress bar** tipis di bawah, update real-time, clickable untuk seek.
- **Loading spinner** saat buffer.
- Props: `{ video, isActive, onToggleMute, onLike, onOpenComments, ... }`.
- Handle Safari native HLS (cek `video.canPlayType('application/vnd.apple.mpegurl')`).

### 2. `Feed` component (`components/feed/Feed.jsx`)
- **Vertical scroll-snap** pakai CSS murni: container `h-screen overflow-y-scroll snap-y snap-mandatory`, tiap item `snap-start h-full`.
- **Infinite scroll cursor-based**: pakai `IntersectionObserver` di sentinel item terakhir → panggil `api.getHomeFeed({ cursor })` dan append. Sudah ada pola di `hooks/useApi.js` (tapi `useApi` saat ini single-fetch — boleh bikin custom hook `hooks/useFeed.js` atau extend logika).
- Loading state: skeleton tipis atau spinner kecil.
- Empty state: ilustrasi + pesan.
- Error state: tombol retry.

### 3. Action overlay (letakkan di sisi kanan item feed, ala TikTok)
- Avatar creator + tombol **+ Follow** (kalau `!is_owner && !is_following`).
- Tombol **Like** (ikon `Heart` dari lucide, filled merah saat `liked_by_me`, **optimistic update** — update state UI dulu, rollback kalau `api.likeVideo`/`unlikeVideo` throw).
- Tombol **Komentar** (ikon `MessageCircle`) + counter. Klik → buka side panel/drawer komentar (lihat poin 5).
- Tombol **Bookmark** (UI only, state lokal `useState`, tidak perlu API call di fase ini).
- Tombol **Share** (UI only, bisa `navigator.share?.()` kalau ada, fallback copy link dummy).
- Caption (nama + text) di bawah video.
- Judul "musik" dummy di paling bawah.

### 4. Navigasi
- **Mobile (<768px)**: `BottomNav` di bawah — 5 item: Beranda (aktif di FYP), Temukan, +, Inbox, Profil. Ikon + label kecil.
- **Desktop (≥768px)**: `Sidebar` di kiri — item yang sama vertikal dengan lebar tetap (~240px), avatar user + logout di bawah.
- Tulis keduanya sebagai komponen (`components/nav/BottomNav.jsx` & `components/nav/Sidebar.jsx`). Item yang **belum ada halaman**nya (Temukan, +, Inbox) cukup disable atau tampil toast "coming soon".
- Layout: buat wrapper responsif di `app/(main)/layout.jsx` (route group, agar tidak konflik dengan `/login`) yang render Sidebar di desktop + BottomNav di mobile + children.

### 5. Drawer Komentar (`components/feed/CommentDrawer.jsx`)
- Slide-up dari bawah (mobile) atau panel kanan (desktop), semi-transparan backdrop.
- List komentar pakai `api.getComments(videoId)`. Tampilkan top-level + reply (saring berdasar `parent_id`, indent reply 8px). Field `user.display_name` + `user.avatar_url` + `content` + `created_at` (format relatif singkat: "2j", "5h", "3d").
- Input + tombol "Post" di bawah — panggil `api.createComment(videoId, content)`. Optimistic append + rollback kalau gagal.
- Tombol "Reply" di tiap comment (opsional, kalau sempat — panggil `api.replyComment(parentId, content)`).
- Escape / backdrop click menutup drawer.

### 6. Halaman FYP (`app/(main)/home/page.jsx`)
- Ganti placeholder yang ada. Render `<Feed />` di area center.
- Komposisi layout desktop: `<Sidebar />` | `<Feed />` | panel interaksi/detail (opsional untuk fase ini — comment drawer sudah cukup).
- Komposisi mobile: `<Feed />` fullscreen + `<BottomNav />` floating di bawah.
- **Penting**: layout `app/(main)/layout.jsx` WAJIB cek auth (`useAuthStore`) — kalau belum login, redirect ke `/login`. Pola redirect sudah ada di `app/page.jsx`, tiru.

### 7. View tracking
- Panggil `api.trackView(videoId)` saat video pertama kali mulai play (sekali per video per mount). Jangan spam.

## Yang TIDAK boleh dilakukan

- Jangan kerjakan halaman Profil, Temukan, Upload, Inbox, Notifikasi, Detail Video (itu Fase 3).
- Jangan integrasi Zitadel, R2, atau backend nyata (Fase 4).
- Jangan ubah `lib/api.js` kecuali tambah fungsi yang missing dan terjustifikasi (catat alasannya). Komponen yang sudah ada di Fase 1 tidak boleh di-break.
- Jangan ubah `tailwind.config.js` untuk menambah warna arbitrary — pakai token `moki-*`.
- Jangan pakai library berat lain (framer-motion, swiper, dll). Scroll-snap native + hls.js cukup.
- Jangan tambahkan TypeScript, Prettier config baru, atau test framework.

## State management yang perlu dibuat/diupdate

- `stores/usePlayerStore.js` — `isMuted: boolean`, `toggleMute()`, `setMuted(v)`. **Global** singleton.
- `stores/useFeedStore.js` (opsional) — kalau pakai cache optimistic like count di luar komponen, bikin store. Kalau cukup `useState` lokal, skip.
- `stores/useAuthStore.js` sudah ada — pakai apa adanya.

## Verifikasi sebelum selesaikan

1. `npm run lint` → harus clean.
2. `npm run dev` → buka `http://localhost:3000`, login, lalu:
   - Feed FYP muncul dengan video mock (10 video mock sudah tersedia).
   - Scroll vertikal snap per video.
   - Klik tombol like → counter naik langsung, request ke adapter terjadi.
   - Buka comment drawer, kirim komentar → muncul di list.
   - Resize ke mobile (<768px) → sidebar hilang, bottom nav muncul, feed fullscreen.
   - Klik toggle mute → state global, video lain ikut.
3. `npm run build` → harus sukses (build pertama emang lama di env low-spec, sabar).

## deliverables

- List file baru & yang diubah (singkat).
- Catatan asumsi/keputusan kecil yang kamu ambil saat jalan (misal: "pakai lazy load untuk hls.js karena X").
- Screenshot/gif opsional (tidak wajib).

## Aturan kerja

- **Selalu baca file dulu sebelum edit** — pakai `read` tool, bukan asumsi dari nama.
- **Edit** pakai `edit` tool dengan `oldString` unik. Untuk file baru, `write`.
- **Jalankan tool secara paralel** kalau tidak ada dependensi (misal: baca 3 file sekaligus dalam 1 pesan).
- **Jangan meniru** style dari project lain — ikuti pola yang sudah ada di Fase 1 (JSDoc, nama function, struktur file).
- Kalau ada ambiguitas di PLAN.md, pilih opsi yang **paling minimal & fungsional**, lalu dokumentasikan pilihanmu.

Mulai. Kalau setelah eksplorasi awal ada hal yang mengharuskan klarifikasi (misal: mau split Fase 2 jadi sub-task), tanyakan ke user sebelum lanjut.
