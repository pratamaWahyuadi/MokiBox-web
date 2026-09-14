# MokiBox — Fase 3 Sub-Task B: Profile + Detail Video

## Konteks

Kamu adalah AI agent yang melanjutkan pembangunan **MokiBox**. **Fase 1, 2, dan Sub-Task A (theme system) sudah selesai**. Tugas kamu **HANYA sub-task B**: implement halaman **Profil** (`/@username`) dan **Detail Video** (`/@username/video/:id`).

Jangan kerjakan: Search, Upload, Inbox, Notifikasi (sub-task C), atau theme system (sub-task A).

## Setup & bacaan wajib (WAJIB sebelum ngoding)

1. Baca `/root/MokiBox/PLAN.md` — fokus ke Fase 3 poin 10 & 12 (Profil, Detail Video). Perhatikan **catatan teknis** di bawah Fase 3 tentang route `@username`.
2. Baca `/root/MokiBox/api_contracts.md` — fokus ke:
   - `GET /api/users/:id` → `UserProfile` + `is_following` + follower/following count
   - `GET /api/users/:id/videos` → list `VideoObject` (cursor pagination)
   - `GET /api/videos/:id` → detail `VideoObject`
   - `GET /api/videos/:id/comments` → flat list + reply (parent_id)
3. Eksplorasi: `lib/api.js` (semua function sudah ada, signature persis kontrak), `components/feed/VideoPlayer.jsx`, `components/feed/CommentDrawer.jsx`, `components/feed/Feed.jsx`, `components/common/Avatar.jsx`, `components/nav/Sidebar.jsx`, `stores/useAuthStore.js`, `app/(main)/layout.jsx`.
4. Pola routing penting: Next.js 14 App Router — folder `app/[handle]/` dimana `handle` menangkap string `@alice` sebagai satu segment. URL `/@username` ditangkep oleh dynamic segment ini.

## Stack & aturan ketat (TIDAK boleh dilanggar)

- **Next.js 14 App Router**, JavaScript murni (JSX), **TANPA TypeScript**
- **Tailwind CSS** pakai token `moki-*` (sudah support dark/light via class `.moki-mellow` dari Sub-Task A)
- **State**: Zustand, plus `useState`/`useCallback` lokal
- **Data**: SEMUA via `lib/api.js` adapter mock
- **Video**: pakai `VideoPlayer` (Fase 2) + `CommentDrawer` (Fase 2) **langsung**, jangan duplikasi
- **Tidak ada library baru** — pakai Next built-in navigation, lucide-react, zustand
- **Tidak ada emoji** di kode
- **Tidak ada komentar** kecuali JSDoc
- **Icon**: `lucide-react`
- Pakai `Avatar`, `Button`, `Logo` reusable components Fase 1

## Cakupan Sub-Task B — yang harus dibangun

### 1. Routing structure

- `app/(main)/[handle]/page.jsx` → halaman **Profil**
- `app/(main)/[handle]/video/[id]/page.jsx` → halaman **Detail Video**

Path `/@alice` ditangkep sebagai `params.handle = "@alice"`. Path `/@alice/video/v-d-1` ditangkep sebagai `params.handle = "@alice"` + `params.id = "v-d-1"`. **Cara resolve `handle` ke user_id**: pakai `api.getUserByIdOrUsername(handle)` — adapter mock sudah handle baik ID maupun username. Untuk handle dengan prefix `@`, strip dulu sebelum lookup, atau biarkan adapter handle (cek implementasi `getUserByIdOrUsername` di `lib/api.js` line 152-167 — kalau tidak handle `@`, tambahkan strip `@` di route loader).

Kalau perlu resolve display_name vs identifier:
- Username `alice` → path `@alice`
- `params.handle` masuk sebagai `@alice` (URL dengan @)
- Strip `@` → lookup user by `username` field

### 2. Halaman Profil — `app/(main)/[handle]/page.jsx`

Layout ala TikTok profile (mobile-first, juga responsive desktop):

**Header (sticky top):**
- Tombol back (kiri, `ArrowLeft` icon) — `router.back()` atau `router.push("/home")`
- Username + `display_name` (center, hidden on very small)
- Tombol share/settings (kanan, `Share2` icon) — UI only, no action

**Profile header (bawah sticky header):**
- Avatar besar (96px-128px), display_name, bio, stats row (Following / Followers / Likes)
- Stats angka: pakai `follower_count`, `following_count`, dan `likes_count` = total likes dari semua video user (compute client-side dari `getUserVideos`)
- Action buttons row:
  - **Edit profil** (kalau `is_owner === true`) → buka modal edit (UI only, panggil `api.updateMe` + optimistic)
  - **Follow / Following** (kalau `!is_owner`):
    - Kalau `!is_following` → button primary "+ Follow" → panggil `api.followUser(id)`, optimistic update
    - Kalau `is_following` → button outline "Following" + icon checkmark → klik = `api.unfollowUser(id)`
  - **Share** button outline (icon Share2)
- **Private account badge** kalau `is_private === true` (icon `Lock`)

**Tabs (sticky di bawah header):**
- 2 tab: **Videos** (default) | **Liked** (kalau `is_owner` saja, sesuai konvensi TikTok)
- Pakai URL search param `?tab=liked` atau state lokal
- Active tab: text `moki-text` + border bottom `moki-accent`
- Inactive: text `moki-mute`

**Content area:**
- **Tab Videos**: grid 3-kolom video thumbnails (mobile 3, desktop 3-4)
  - Tiap cell: thumbnail image (`video.thumbnail_url`), overlay kecil icon `Play` + views count di pojok kiri bawah
  - Klik cell → navigate ke `/${handle}/video/${video.id}`
  - Infinite scroll cursor-based pakai `api.getUserVideos(id, { cursor })` (mirip Feed.jsx pola)
  - Empty state: ilustrasi + "No videos yet"
- **Tab Liked** (kalau `is_owner`): grid yang sama, **tapi via `getUserVideos` lalu filter `liked_by_me`** — karena kontrak API tidak punya endpoint khusus untuk liked videos di Fase 2, gunakan approach client-side. Alternatif: filter dari `getHomeFeed` (tidak ideal). **Rekomendasi**: tambah field/endpoint di adapter kalau perlu, atau filter dari `getUserVideos` dan cache likes. Diskusikan di prompt Final.

**Loading & error:**
- Initial loading: skeleton header + skeleton grid
- Error: tombol retry (sama pola ErrorState di Feed.jsx)
- Empty: ilustrasi + pesan

**Auth-aware behavior:**
- `is_owner` true = user yang sedang login = profile owner
- Pakai `useAuthStore.currentUserId` dibanding `user.id` dari API

### 3. Halaman Detail Video — `app/(main)/[handle]/video/[id]/page.jsx`

Layout ala TikTok (mobile-first):

**Mobile (default, <md):**
- Fullscreen `<VideoPlayer>` (reuse Fase 2 component) dengan `isActive={true}`
- Action overlay (like, comment, share, follow) di sisi kanan — **REUSE pola dari Feed.jsx FeedOverlay**, extract kalau perlu ke `components/feed/VideoActions.jsx` untuk dipakai di kedua tempat
- Caption, username, musik di bawah kiri (sama dengan FeedOverlay)

**Desktop (≥md):**
- 2-kolom layout:
  - Kiri: `<VideoPlayer>` besar (max-width 400-500px, centered, sticky)
  - Kanan: panel scrollable berisi:
    - Header: avatar + username + follow button (sama profil)
    - Caption + title + description
    - Musik bar
    - Tabs: **Comments** (default) | **Likes** (counter saja, no list)
    - Comment list (pakai `CommentDrawer` content extracted ke `components/feed/CommentList.jsx`, atau render inline)
    - Input "Tambah komentar…" di bawah

**Comment posting:**
- Pakai `api.createComment(videoId, content)` + `api.replyComment(parentId, content)`
- Optimistic update sama seperti CommentDrawer

**Reuse strategi (PENTING):**
- **Refactor FeedOverlay → `components/feed/VideoActions.jsx`**: extract action buttons (like, comment, share, follow) dari Feed.jsx ke komponen reusable. Feed.jsx pakai ini, dan halaman Detail Video juga pakai ini. Jangan duplikasi.
- **Refactor comment list ke `components/feed/CommentList.jsx`**: CommentDrawer pakai ini sebagai konten. Halaman Detail Video pakai ini juga. Tetap dukung tree view (top-level + reply indent, sama seperti CommentDrawer saat ini).

### 4. Navigasi links (update existing components)

- **`Feed.jsx`**: caption username link (klik `@username`) → `router.push(\`/\${video.user.username.startsWith('@') ? video.user.username : '@'+video.user.username}\`)` → navigate ke `app/(main)/[handle]/page.jsx`. Tambah `onClick` di element username + cursor pointer.
- **`CommentDrawer.jsx`**: comment username link → navigate ke profile.
- **`Sidebar.jsx` + `BottomNav.jsx`**: item "Profil" (yang saat ini disabled) → `router.push(\`/@\${currentUserId}\`)` atau pakai username dari `useAuthStore` (perlu resolve ID→username, atau simpan di store juga). **Cuma enable untuk item "Profil"**, sisanya tetap disabled.
- **`Logo.jsx`** di Sidebar (desktop): klik → `router.push("/home")` (sudah berfungsi).

### 5. Edge cases

- **Handle tidak ditemukan** (`api.getUserByIdOrUsername` throw NOT_FOUND): render halaman "User not found" dengan tombol "Kembali ke Beranda".
- **Akun private + bukan follower**: API akan throw NOT_FOUND. Handle sebagai "User not found" atau tampilkan placeholder "Akun ini private. Follow untuk lihat konten." (tergantung response API).
- **Video tidak ditemukan atau non-READY** (kalau bukan owner): API throw NOT_FOUND. Handle sebagai "Video not found".
- **User belum login**: `(main)/layout.jsx` sudah redirect ke `/login`, tidak perlu handle di sini.

### 6. Pola yang harus diikuti (konsistensi dengan Fase 1 & 2)

- Pakai `useApi` hook atau local `useState` + `useEffect` untuk fetch (lihat `Feed.jsx`)
- Cursor pagination sama dengan Feed.jsx
- Action overlay pakai token `moki-*`
- Skeleton loading pakai `<Spinner />` atau skeleton custom dengan animate-pulse
- Error state pakai `<ErrorState error onRetry />` (extract dari Feed.jsx ke `components/common/ErrorState.jsx` kalau perlu)
- Empty state ilustrasi + pesan singkat

## Yang TIDAK boleh dilakukan

- **Jangan kerjakan Search, Upload, Inbox, Notifikasi** (sub-task C)
- **Jangan kerjakan theme system** (sub-task A)
- **Jangan ubah Feed, VideoPlayer, CommentDrawer logic** — hanya boleh **refactor** extract komponen reusable (`VideoActions`, `CommentList`, `ErrorState`) dan pakai hasil extract di kedua tempat
- **Jangan ubah `lib/api.js` kecuali untuk fix minor yang terjustifikasi** (catat alasannya di deliverables). Kalau ada field yang missing, **bukan** tugas kamu menambah endpoint — diskusikan sebagai catatan.
- **Jangan ubah `tailwind.config.js`**
- **Jangan tambah library baru**

## Verifikasi sebelum selesaikan

1. `npm run lint` → clean
2. `npm run dev` → buka `http://localhost:3000`:
   - Login sebagai salah satu user
   - Di Feed, klik username di caption → navigate ke `/@<username>`
   - Profile page load, tampilkan info user, stats, grid video
   - Klik tab Videos (default), grid tampil, infinite scroll bekerja
   - Klik salah satu video thumbnail → navigate ke `/@<username>/video/<id>`
   - Detail video page: player load, comment list tampil (atau drawer di mobile), action buttons berfungsi
   - Like, comment, follow semua berfungsi
   - Resize ke mobile → layout responsive
   - Test edge case: navigate ke `/@nonexistent` → "User not found"
3. `npm run build` → sukses

## Tradeoff & keputusan kecil

1. **Liked tab**: API kontrak tidak punya endpoint `GET /api/users/:id/liked-videos` di Fase 2. Dua opsi:
   - **Opsi A**: Filter client-side dari `getUserVideos` (likes yang ada di adapter state). Loading lambat kalau user punya banyak video.
   - **Opsi B**: Tambah endpoint `getUserLikedVideos(id)` di adapter (mock implementation filter likes set), **TAPI** harus justify dan catat di deliverables. Boleh dilakukan.
   - **Rekomendasi**: Opsi B dengan implementasi minimal di adapter.
2. **CommentList extraction**: kalau CommentDrawer + Detail Video butuh comment list identik, refactor. Kalau beda signifikan (misal drawer mobile punya padding beda, desktop punya padding beda), duplikasi boleh. Saya rekomendasikan refactor.
3. **VideoActions extraction**: sangat direkomendasikan refactor. Action overlay di Feed item dan di Detail Video header right panel punya icon set + behavior sama. Refactor = hemat 100+ baris duplikasi.
4. **Profile Edit modal**: UI only, panggil `api.updateMe({ display_name, bio })` dengan optimistic. Field yang didukung: `display_name` (max 50 char), `bio` (max 500 char), `is_private` (toggle). `avatar_url` skip dulu (butuh upload, bukan scope Fase 3).
5. **Share profile**: `navigator.share` kalau ada, fallback copy link `/@username`.
6. **Username link generator**: bikin helper kecil `profileHref(user)` di `lib/paths.js` yang return `\`/@\${user.username}\``. Hindari hardcoded string di banyak tempat.

## Deliverables

- List file baru & yang diubah (singkat)
- Catatan asumsi/keputusan kecil
- Kalau ada perubahan ke `lib/api.js`, catat **apa** dan **mengapa**
- Konfirmasi `npm run lint` clean & `npm run dev` OK

## Aturan kerja

- Baca file dulu sebelum edit
- `edit` dengan `oldString` unik
- File baru pakai `write`
- Tools paralel kalau tidak ada dependensi
- Ikuti pola Fase 1 & 2: JSDoc untuk tipe, "use client" di komponen interaktif, no comments di kode, no raw hex, no emoji

Mulai. Kalau ada ambiguitas, tanyakan sebelum lanjut.
