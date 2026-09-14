# 📱 MokiBox — Plan Frontend Web (TikTok Clone)

## Ringkasan

MokiBox adalah aplikasi & website mirip TikTok. Versi pertama yang dibangun adalah **website** (mobile app menyusul), dengan pendekatan **bertahap (phased)**: mulai dari UI + mock data, baru integrasi fitur nyata setelah backend siap.

## Keputusan Teknis

| Aspek | Keputusan |
|---|---|
| Framework | Next.js 14 (App Router) |
| Bahasa | JavaScript murni (JSX) — tanpa TypeScript |
| Styling | Tailwind CSS |
| State management | Zustand |
| Backend | API custom (dikerjakan teman, kontrak di `api_contracts.md`) |
| Auth backend | Zitadel (Bearer JWT) |
| Video hosting | Cloudflare R2 (upload) + HLS streaming (`.m3u8`) |
| Video player | `hls.js` (native HLS cuma jalan di Safari) |
| Data saat development | Mock data + adapter layer (`lib/api.js`) |
| Icon | lucide-react |

**Catatan arsitektur:** Semua komponen memanggil data lewat adapter di `lib/api.js`. Saat development pakai implementasi dummy, dengan bentuk data yang disamakan persis dengan kontrak API asli (field `snake_case`, status lifecycle video, cursor pagination, dll) supaya nanti tinggal ganti isi fungsi jadi HTTP call tanpa mengubah komponen.

---

## Fase 1 — Fondasi & Setup

1. Init project: Next.js (JavaScript) + Tailwind + ESLint/Prettier
2. Struktur folder:

   ```
   app/          # routes (App Router)
   components/   # UI components
   lib/          # api.js (adapter)
   hooks/        # custom hooks
   stores/       # state management (zustand)
   mocks/        # data dummy
   ```

3. Definisikan bentuk data inti via objek mock + JSDoc, mengikuti kontrak API:
   - `UserSummary` / `UserProfile` — id, username, display_name, avatar_url, bio, is_private, follower/following_count
   - `VideoObject` — id, status (`PENDING_UPLOAD → PROCESSING → READY/FAILED`), hls_playlist_url, thumbnail_url, likes/views/comments_count, liked_by_me, is_owner
   - `CommentObject` — id, video_id, parent_id (untuk reply), content, user
   - `NotificationObject` — type (like/comment/follow), payload, is_read
4. Buat `lib/api.js`: fungsi adapter dummy untuk tiap endpoint di kontrak — `getMe`, `getHomeFeed`, `uploadIntent`, `confirmUpload`, `getVideoStatus`, `getVideoPlaylist`, `likeVideo`, `createComment`, `followUser`, `getNotifications`, dll — termasuk `ApiError` class dan cursor pagination (`next_cursor`) sesuai kontrak

## Fase 2 — Feed Inti / FYP ⭐ prioritas utama

5. Layout ala TikTok:
   - Mobile: fullscreen feed, swipe vertikal
   - Desktop: sidebar kiri + feed center + panel interaksi kanan
6. Komponen `VideoPlayer`:
   - HTML5 video + `hls.js` (video dari backend berformat HLS `.m3u8`, bukan mp4 langsung)
   - Autoplay saat terlihat (IntersectionObserver), mute/unmute (state global), tap-to-pause, progress bar
7. Feed scroll-snap vertikal (CSS scroll snap, tanpa library berat) + infinite scroll cursor-based
8. Overlay aksi: like ❤️ (optimistic update), komentar, bookmark, share, avatar + tombol follow, caption, judul musik
9. Navigasi — Beranda, Temukan, ＋ Upload, Inbox, Notifikasi, Profil:
   - Mobile: bottom nav
   - Desktop: sidebar

## Fase 3 — Halaman Pendukung (semua mock data)

10. **Profil** (`/@username`) — header (avatar, stats, follow/edit profil), tab Videos/Liked, grid video
11. **Temukan/Search** — search bar, trending, hasil akun & video
12. **Detail Video** (`/@username/video/:id`) — player besar + kolom komentar (support reply/nested via `parent_id`)
13. **Upload** — dropzone file, preview video, form caption & privacy (UI saja)
14. **Inbox/DM** — list chat + tampilan chat bubble
15. **Notifikasi** — list aktivitas (like, komentar, follow), tandai semua dibaca
16. Responsif penuh + dark mode (default gelap ala TikTok)

**Catatan teknis:** route profil sebaiknya pakai folder `app/[handle]/` bukan `app/@[username]/` — prefix `@` di Next.js App Router reserved untuk *parallel routes*, jadi bakal bentrok kalau dipakai literal. URL `/@username` tetap bisa dicapai lewat dynamic segment biasa yang menangkap seluruh teks `@username` sebagai satu segment.

## Fase 4 — Integrasi Nyata *(menunggu/mengikuti spesifikasi API backend)*

### 4.1 Auth
17. Setup Zitadel client (login/register flow, OAuth/OIDC)
18. Simpan token (access + refresh), auto-refresh saat expired
19. Protected routes — redirect ke login kalau belum auth, khususnya untuk Upload, Inbox, Notifikasi, dan aksi (like/comment/follow)
20. Tampilkan/samarkan tombol Edit Profil vs Follow berdasar `is_owner` dari data user yang login

### 4.2 Ganti Adapter ke HTTP Nyata
21. Install & setup React Query (caching, refetch, invalidation)
22. Ganti isi tiap fungsi di `lib/api.js` dari dummy → `fetch()` ke API backend asli, pertahankan signature & shape return supaya komponen tidak berubah
23. Tangani `ApiError` nyata dari response `{ error: { code, message, details } }` — mapping ke pesan UI yang ramah
24. Sesuaikan cursor pagination dengan cursor asli dari backend

### 4.3 Upload Video Nyata
25. Alur: `uploadIntent()` → `PUT` file langsung ke presigned URL Cloudflare R2 → `confirmUpload()` → polling `getVideoStatus()` sampai `READY` (atau tangani `FAILED`/`retry_count`)
26. Tampilkan progress upload asli (`XMLHttpRequest` atau `fetch` dengan progress event)
27. Validasi ukuran file di client sesuai `min_size_bytes`/`max_size_bytes` dari response `uploadIntent`

### 4.4 Realtime
28. Notifikasi baru — polling interval atau WebSocket/SSE sesuai kemampuan backend
29. DM/Inbox — realtime chat sesuai kemampuan backend (fallback ke polling kalau belum support)
30. Update counter (likes/comments/views) di UI kalau ada aktivitas baru dari user lain

### 4.5 Polish sebelum rilis
31. Loading skeleton yang lebih halus untuk grid/list (mascot MokiMark dipertahankan sebagai identitas brand di loading state utama)
32. Error boundary halaman & retry UI kalau fetch gagal
33. SEO dasar — metadata per halaman profil/video (`generateMetadata` di Next.js)
34. Testing di device low-end/koneksi lambat (autoplay video, HLS buffering)

---

## Referensi

- Kontrak API: `api_contracts.md`
