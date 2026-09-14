# MokiBox — Fase 3 Sub-Task C: Search, Upload, Inbox, Notifikasi

## Konteks

Kamu adalah AI agent yang melanjutkan pembangunan **MokiBox**. **Fase 1, 2, Sub-Task A (theme), Sub-Task B (profile + detail video) sudah selesai**. Tugas kamu **HANYA sub-task C**: implement halaman **Search/Temukan**, **Upload**, **Inbox/DM**, dan **Notifikasi**.

Jangan kerjakan: profile, detail video (sub-task B), atau theme system (sub-task A).

## Setup & bacaan wajib (WAJIB sebelum ngoding)

1. Baca `/root/MokiBox/PLAN.md` — fokus ke Fase 3 poin 11, 13, 14, 15 (Search, Upload, Inbox, Notifikasi).
2. Baca `/root/MokiBox/api_contracts.md` — fokus ke:
   - `GET /api/feed/home` (referensi), `searchUsers(q)`, `searchVideos(q)` (sudah ada di `lib/api.js` di luar kontrak resmi, OK untuk dipakai)
   - `POST /api/videos/upload-intent`, `POST /api/videos/confirm` (untuk Upload)
   - `GET /api/notifications`, `PUT /api/notifications/read-all`
3. Eksplorasi: `lib/api.js` (semua function tersedia, signature lengkap), `components/feed/VideoPlayer.jsx`, `components/feed/Feed.jsx`, `components/nav/Sidebar.jsx`, `components/nav/BottomNav.jsx`, `app/(main)/layout.jsx`, `stores/useAuthStore.js`, `stores/usePlayerStore.js`.

## Stack & aturan ketat (TIDAK boleh dilanggar)

- **Next.js 14 App Router**, JavaScript murni (JSX), **TANPA TypeScript**
- **Tailwind CSS** token `moki-*` (sudah support dark/light)
- **State**: Zustand + local state
- **Data**: `lib/api.js` adapter mock
- **Tidak ada library baru**
- **Tidak ada emoji, tidak ada komentar** kecuali JSDoc
- **Icon**: `lucide-react`

## Cakupan Sub-Task C — yang harus dibangun

### 1. Search / Temukan — `app/(main)/discover/page.jsx`

**Layout:**
- Search bar di atas (sticky): input + icon `Search` + tombol clear (icon `X`)
- Tabs: **Akun** | **Video** (default: empty input → tampilkan "Trending" placeholder)
- Hasil list:
  - **Tab Akun**: tiap row = avatar + display_name + username + tombol Follow/Following (kalau `!is_owner`)
  - **Tab Video**: tiap row = thumbnail kecil + title + username creator + likes_count
- Klik row akun → navigate ke `app/(main)/[handle]/page.jsx` (pakai pola dari Sub-Task B `profileHref`)
- Klik row video → navigate ke `app/(main)/[handle]/video/[id]/page.jsx`
- Empty state: "Coba kata kunci lain"
- No-results state: ilustrasi + "Tidak ada hasil untuk '...'"

**Behavior:**
- Pakai `api.searchUsers(q)` + `api.searchVideos(q)` (sudah ada di adapter, line 575+)
- Debounce input 300ms sebelum call API
- Loading state per-tab
- `q` dari URL search param `?q=...` (deep-linkable)

**API behavior catatan:**
- `searchUsers` + `searchVideos` di `lib/api.js` adalah **extra di luar kontrak resmi** (lihat comment "mock — di luar kontrak resmi"). Pakai saja, return shape `{ data: [] }`.

**Trending placeholder (kalau sempat):**
- 5-10 hardcoded tag/keyword (e.g. "Kucing Lucu", "Resep Harian", "Skate", "DIY", "Comedy") → clickable chip → set input + trigger search.

### 2. Upload — `app/(main)/upload/page.jsx`

**Layout (3-step wizard):**

**Step 1: Pilih file**
- Dropzone besar (full-width, dashed border, icon `Upload` center)
- Klik / drop file video (accept `video/*`)
- Preview video (HTML5 `<video>` lokal, controls, no autoplay) setelah file dipilih
- Tampilkan: file name, size (formatted MB), duration
- Tombol "Lanjut" disabled kalau file belum dipilih

**Step 2: Form metadata**
- Input title (required, max 100 char sesuai konvensi, meski kontrak tidak strict)
- Textarea description (optional, max 1000 char — ada validasi)
- Privacy toggle: `Publik` (default) / `Privat` — mapping ke `is_private` user (TODO konfirmasi: API upload pakai `is_private` di user atau di video? Cek kontrak: `is_private` di user profile, video tidak punya flag privacy di VideoObject. **Untuk Fase 3, pakai `is_private` user sebagai gantinya** — kalau user set privat, semua video private. Catat di deliverables.)
- Tombol "Upload" + "Kembali"

**Step 3: Processing state**
- "Mengupload..." spinner
- "Memproses..." spinner (kalau API simulasi processing butuh waktu)
- Pakai `api.uploadIntent({ title, description })` → dapat `upload_url` + `r2_key`
- Karena Fase 3 UI-only dan adapter mock tidak butuh real R2 upload, **simulasi**: skip real PUT ke `upload_url`, langsung panggil `api.confirmUpload({ video_id, r2_key })`
- `confirmUpload` di adapter mock menset video ke PROCESSING, lalu setelah 2.5s set ke READY (lihat `lib/api.js` line 393-419)
- Poll `api.getVideoStatus(video_id)` setiap 1s sampai `status === "READY"` atau `FAILED` (ada `setInterval` + cleanup)
- Success: navigate ke `app/(main)/[handle]/video/[id]/page.jsx` video baru
- Failure: tampilkan error + tombol retry

**Catatan teknis:**
- File input pakai `<input type="file" accept="video/*">` (hidden), trigger via button click
- Validasi client: max 200MB (sesuai `max_size_bytes` di kontrak), min 1KB — pakai `File.size`
- Drag & drop: pakai `onDragOver` + `onDrop` events
- File preview: `URL.createObjectURL(file)` lalu `<video src={localUrl} />`, revoke saat unmount

**Validasi form:**
- Title required (1-100 char)
- Description optional (0-1000 char, max enforced)
- Error message inline di bawah field

### 3. Inbox / DM — `app/(main)/inbox/page.jsx`

**Layout 2-pane (desktop) / single (mobile):**

**Desktop (≥md):**
- Sidebar list chat di kiri (300px):
  - Tiap row: avatar user lain + display_name + last message preview + timestamp (relative)
  - Active chat: bg `moki-surface`
  - Unread badge: bulat kecil `moki-accent` di kanan
- Panel chat di kanan:
  - Header: avatar + display_name user lain + tombol back (mobile only)
  - Message list (scrollable): chat bubbles
    - **Bubble incoming** (kiri, dari user lain): bg `moki-surface`, text `moki-text`
    - **Bubble outgoing** (kanan, dari current user): bg `moki-accent`, text `moki-bg` (kontras tinggi)
    - Timestamp kecil di bawah tiap bubble
    - Auto-scroll ke message terbaru
  - Input area di bawah: input + tombol send (icon `Send`)

**Mobile (<md):**
- Tampil list chat saja
- Klik chat → navigate ke `app/(main)/inbox/[conversationId]/page.jsx` (detail chat)
- Back button di header untuk kembali ke list

**Data:**
- `lib/api.js` saat ini **tidak punya endpoint DM** — semua endpoint chat ada di Fase 4 (realtime). Untuk Fase 3, **buat mock di komponen** dengan beberapa hardcoded conversation + messages, atau tambah minimal di adapter:
  - `api.getConversations()` → list `{ id, user: UserSummary, last_message, unread_count, updated_at }`
  - `api.getMessages(conversationId)` → list `{ id, conversation_id, sender_id, content, created_at }`
  - `api.sendMessage(conversationId, content)` → create
- **WAJIB tambah di adapter** (justifikasi: "endpoint chat belum ada di kontrak resmi, mock di adapter untuk konsistensi dengan pola Fase 1/2 di mana semua data via api.js"). Boleh hardcoded data + local state mutation.

### 4. Notifikasi — `app/(main)/notifications/page.jsx`

**Layout:**
- Header sticky: judul "Notifikasi" + tombol "Tandai semua dibaca" (icon `CheckCheck` atau `Check`)
- Tab filter (optional, kalau sempat): **Semua** | **Suka** | **Komentar** | **Follow**
- List notifikasi:
  - Tiap row: avatar actor (user yang melakukan aksi) + content (e.g. "alice menyukai video kamu" / "bob mengomentari video kamu" / "charlie mulai mengikuti kamu") + thumbnail kecil video (kalau notif type like/comment) + timestamp relative
  - Unread: bg `moki-surface/50` atau dot kecil `moki-accent` di kiri
  - Klik row → navigate ke context (video detail / profile)
- Infinite scroll cursor-based (kalau data banyak) atau simple list kalau data sedikit
- Empty state: ilustrasi + "Belum ada notifikasi"

**Data:**
- `api.getNotifications({ cursor, limit })` (sudah ada di adapter line 552-560)
- `api.markAllNotificationsRead()` (sudah ada)
- Pakai `makeNotificationsFor(currentUserId)` (di mocks/notifications.js) — ini generator mock

**Behavior:**
- Saat halaman mount: panggil `markAllNotificationsRead()` (fire-and-forget) + refetch list
- Filter by type: client-side filter dari data yang sudah di-fetch
- Tabs styling: pill / chip style, active = `moki-text` bg `moki-surface`, inactive = `moki-mute`

### 5. Update navigation

Update `Sidebar.jsx` + `BottomNav.jsx`:
- **Discover / Temukan**: enable, link `/discover`
- **Upload (+)**: enable, link `/upload`
- **Inbox**: enable, link `/inbox`
- **Profile / Profil**: enable, link `profileHref(currentUser)` (perlu resolve current user ID → username; tambah field di `useAuthStore` atau fetch dari `api.getMe()` di nav, atau tambah `currentUsername` di store)
- **Notifikasi**: tambah item ke-6 di BottomNav atau taruh di header area Sidebar? **Diskusikan di deliverables**. Saya rekomendasikan: taruh icon `Bell` di header Sidebar (desktop, sebelah ThemeToggle) + sebagai item ke-6 di BottomNav mobile.

**Badge unread count:**
- `Bell` icon dapat badge merah kecil kalau ada unread notifikasi. Implementasi: fetch `getNotifications({ limit: 1 })` di nav mount, kalau ada `is_read: false` tampilkan badge. Re-fetch setiap 30s (polling sederhana).

### 6. Komponen reusable (extract kalau perlu)

- `components/common/ChatBubble.jsx` — bubble chat (incoming/outgoing variant)
- `components/common/NotificationItem.jsx` — row notifikasi (avatar + content + thumbnail + timestamp)
- `components/common/SearchInput.jsx` — debounced search input
- `components/common/EmptyState.jsx` (kalau belum ada) — extract dari Feed.jsx
- `components/common/ErrorState.jsx` (kalau belum ada) — extract dari Feed.jsx

Pakai `Spinner` (extract dari Feed.jsx) untuk loading.

## Yang TIDAK boleh dilakukan

- **Jangan kerjakan profile atau detail video** (sub-task B)
- **Jangan kerjakan theme system** (sub-task A)
- **Jangan ubah Feed, VideoPlayer, CommentDrawer** (Fase 2)
- **Jangan ubah `tailwind.config.js`**
- **Jangan tambah library baru** (real-time chat pakai local state + simulasi, bukan WebSocket/SSE — itu Fase 4)
- **Jangan implementasi upload video real ke R2** (Fase 4)
- **Jangan implementasi Zitadel auth** (Fase 4)

## Verifikasi sebelum selesaikan

1. `npm run lint` → clean
2. `npm run dev` → buka `http://localhost:3000`:
   - Login, klik Temukan di nav → search bar muncul, ketik "alice" → hasil akun tampil
   - Klik akun alice → navigate ke profile (kalau Sub-Task B selesai) — kalau belum, tampilkan placeholder
   - Klik tab Video → search results video
   - Klik + di nav → upload page → drop file → preview muncul → isi form → klik Upload → processing → success navigate ke video
   - Klik Inbox di nav → list chat tampil, klik salah satu → panel chat, kirim pesan → muncul di list
   - Klik icon Bell (notifikasi) → list notifikasi tampil, klik "Tandai semua dibaca" → badge hilang
   - Resize ke mobile → layout responsive
3. `npm run build` → sukses

## Tradeoff & keputusan kecil

1. **Chat data**: harus tambah mock di `lib/api.js` untuk konsistensi. Implementasi minimal: 3 conversation hardcoded, masing-masing 5-10 message. `sendMessage` cuma append ke local array (sama pola mutation di Fase 1).
2. **Upload real R2**: skip, langsung `confirmUpload` setelah `uploadIntent`. Adapter mock sudah simulasi PROCESSING → READY.
3. **Privacy toggle di upload**: VideoObject kontrak tidak punya field `is_private`. Mapping ke user `is_private` adalah hack. Lebih akurat: tampilkan toggle tapi catat sebagai TODO untuk Fase 4. Atau hilangkan toggle di upload, kasih catatan "Privacy mengikuti setting akun" dengan link ke edit profile. Saya rekomendasikan opsi kedua.
4. **Drag & drop file**: pakai `onDragOver` + `onDrop` events. `e.preventDefault()` di dragOver untuk allow drop. Handle `e.dataTransfer.files[0]`.
5. **Notification badge di nav**: fetch `getNotifications({ limit: 1 })` di nav mount, set interval 30s. **Tradeoff**: extra request tiap 30s. Untuk mock gapapa. Untuk real nanti optimize dengan `?unread=true` filter.
6. **Inbox mobile navigation**: bisa pakai nested route `/inbox/[conversationId]/page.jsx` atau pakai state lokal. Saya rekomendasikan nested route untuk konsistensi dengan profile/video pattern.
7. **Trending search**: optional, hardcode 5-10 keyword. Skip kalau time-limited.

## Deliverables

- List file baru & yang diubah (singkat)
- Catatan asumsi/keputusan kecil
- Kalau ada perubahan ke `lib/api.js` (untuk chat), catat **apa** dan **mengapa**
- Konfirmasi `npm run lint` clean & `npm run dev` OK

## Aturan kerja

- Baca file dulu sebelum edit
- `edit` dengan `oldString` unik
- File baru pakai `write`
- Tools paralel kalau tidak ada dependensi
- Ikuti pola Fase 1 & 2: JSDoc untuk tipe, "use client" di komponen interaktif, no comments di kode, no raw hex, no emoji

Mulai. Kalau ada ambiguitas, tanyakan sebelum lanjut.
