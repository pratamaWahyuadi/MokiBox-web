// Adapter API untuk MokiBox.
// VERSI: mock implementation yang shape-nya identik dengan API contract.
// Saat backend siap, ganti isi fungsi-fungsi di sini dengan fetch() nyata
// tanpa mengubah signature/return shape — komponen tidak perlu diubah.

import {
  ApiError,
  forbidden,
  notFound,
  selfFollow,
  unauthorized,
  validation,
  videoNotReady,
  videoStatusConflict,
} from "./apiError.js";
import { MOCK_DELAY_MS, PAGINATION, VIDEO_STATUS } from "./constants.js";
import { COMMENTS } from "@/mocks/comments.js";
import { makeNotificationsFor } from "@/mocks/notifications.js";
import { USERS, getUserById, getUserByUsername, toUserSummary } from "@/mocks/users.js";
import { VIDEOS } from "@/mocks/videos.js";
import { PUBLIC_HLS_STREAMS } from "@/mocks/streams.js";

/* ------------------------------------------------------------------ *
 * In-memory mutable state untuk mock.
 * Saat integrasi nyata, bagian ini dihapus total.
 * ------------------------------------------------------------------ */

// id user yang sedang login (di-set oleh mock login).
let currentUserId = null;

export function setCurrentUserId(id) {
  currentUserId = id;
}
export function getCurrentUserId() {
  return currentUserId;
}

// state tambahan di-copy dari seed supaya mutation tidak mempengaruhi import asli
/** @type {Map<string, any>} */
const videoState = new Map(VIDEOS.map((v) => [v.id, { ...v }]));
/** @type {Map<string, any>} */
const userState = new Map(USERS.map((u) => [u.id, { ...u }]));
/** @type {any[]} */
let commentState = COMMENTS.map((c) => ({ ...c, user: { ...c.user } }));
/** @type {Set<string>} */
const likes = new Set(); // "viewerId:videoId"
/** @type {Set<string>} */
const follows = new Set(); // "followerId:followeeId"
/** @type {string|null} */
let pendingUploadVideoId = null;

function delay(ms = MOCK_DELAY_MS) {
  return new Promise((r) => setTimeout(r, ms));
}

function clampLimit(limit) {
  const n = Number(limit) || PAGINATION.DEFAULT_LIMIT;
  return Math.min(Math.max(1, n), PAGINATION.MAX_LIMIT);
}

function paginate(arr, cursor, limit) {
  const startIndex = cursor ? Number(cursor) || 0 : 0;
  const endIndex = startIndex + clampLimit(limit);
  const slice = arr.slice(startIndex, endIndex);
  const nextCursor = endIndex < arr.length ? String(endIndex) : null;
  return { slice, nextCursor };
}

function requireAuth() {
  if (!currentUserId) throw unauthorized();
}

function attachViewerFlags(video, viewerId) {
  if (!video) return video;
  const v = { ...video };
  v.liked_by_me = viewerId ? likes.has(`${viewerId}:${v.id}`) : false;
  v.is_owner = viewerId ? v.user_id === viewerId : false;
  return v;
}

function applyFollowCounts(user, viewerId) {
  if (!user) return user;
  const u = { ...user };
  if (viewerId) {
    u.is_following = follows.has(`${viewerId}:${u.id}`);
  } else {
    u.is_following = false;
  }
  return u;
}

/* ------------------------------------------------------------------ *
 * AUTH & USER
 * ------------------------------------------------------------------ */

/** GET /api/users/me */
export async function getMe() {
  await delay();
  requireAuth();
  const u = userState.get(currentUserId);
  if (!u) throw notFound("User not found");
  return { data: { ...u } };
}

/** PUT /api/users/me */
export async function updateMe({ display_name, bio, avatar_url, is_private } = {}) {
  await delay();
  requireAuth();
  const u = userState.get(currentUserId);
  if (!u) throw notFound();
  const details = [];
  if (display_name !== undefined) {
    if (typeof display_name !== "string" || display_name.length < 1 || display_name.length > 50) {
      details.push({ field: "display_name", message: "must be between 1 and 50 characters" });
    }
  }
  if (bio !== undefined && bio !== null) {
    if (typeof bio !== "string" || bio.length > 500) {
      details.push({ field: "bio", message: "must be at most 500 characters" });
    }
  }
  if (is_private !== undefined && typeof is_private !== "boolean") {
    details.push({ field: "is_private", message: "must be boolean" });
  }
  if (details.length) throw validation(details);
  const next = {
    ...u,
    display_name: display_name ?? u.display_name,
    bio: bio !== undefined ? bio : u.bio,
    avatar_url: avatar_url !== undefined ? avatar_url : u.avatar_url,
    is_private: is_private !== undefined ? is_private : u.is_private,
  };
  userState.set(u.id, next);
  return { data: { ...next } };
}

/** DELETE /api/users/me */
export async function deleteMe() {
  await delay();
  requireAuth();
  // hapus semua data user
  for (const [k, v] of videoState) if (v.user_id === currentUserId) videoState.delete(k);
  commentState = commentState.filter((c) => c.user_id !== currentUserId);
  for (const k of [...likes]) if (k.startsWith(`${currentUserId}:`) || k.endsWith(`:${currentUserId}`)) likes.delete(k);
  for (const k of [...follows]) if (k.startsWith(`${currentUserId}:`) || k.endsWith(`:${currentUserId}`)) follows.delete(k);
  userState.delete(currentUserId);
  currentUserId = null;
  return { status: 204 };
}

/** GET /api/users/:id */
export async function getUserByIdOrUsername(idOrUsername) {
  await delay();
  requireAuth();
  const u = getUserById(idOrUsername) || getUserByUsername(idOrUsername);
  if (!u) throw notFound();
  if (!u.is_active) throw notFound();
  // hitung counts
  const followerCount = [...follows].filter((k) => k.endsWith(`:${u.id}`)).length;
  const followingCount = [...follows].filter((k) => k.startsWith(`${u.id}:`)).length;
  return {
    data: applyFollowCounts(
      { ...u, follower_count: followerCount, following_count: followingCount },
      currentUserId
    ),
  };
}

/** GET /api/users/:id/videos */
export async function getUserVideos(id, { cursor, limit } = {}) {
  await delay();
  requireAuth();
  const target = userState.get(id);
  if (!target || !target.is_active) throw notFound();

  let videos = [...videoState.values()]
    .filter((v) => v.user_id === id && v.status !== VIDEO_STATUS.DELETED)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

  // rule visibility
  if (id !== currentUserId) {
    if (target.is_private && !follows.has(`${currentUserId}:${id}`)) throw notFound();
    videos = videos.filter((v) => v.status === VIDEO_STATUS.READY);
  } else {
    videos = videos.filter((v) => v.status !== VIDEO_STATUS.DELETED);
  }

  const { slice, nextCursor } = paginate(videos, cursor, limit);
  return {
    data: slice.map((v) => attachViewerFlags(v, currentUserId)),
    pagination: { next_cursor: nextCursor },
  };
}

/* ------------------------------------------------------------------ *
 * FOLLOW
 * ------------------------------------------------------------------ */

export async function followUser(id) {
  await delay();
  requireAuth();
  if (id === currentUserId) throw selfFollow();
  const target = userState.get(id);
  if (!target || !target.is_active) throw notFound();
  follows.add(`${currentUserId}:${id}`);
  return {
    data: {
      follower_id: currentUserId,
      followee_id: id,
      is_following: true,
      created_at: new Date().toISOString(),
    },
  };
}

export async function unfollowUser(id) {
  await delay();
  requireAuth();
  const target = userState.get(id);
  if (!target) throw notFound();
  follows.delete(`${currentUserId}:${id}`);
  return {
    data: {
      follower_id: currentUserId,
      followee_id: id,
      is_following: false,
    },
  };
}

export async function getFollowers(id, { cursor, limit } = {}) {
  await delay();
  requireAuth();
  const target = userState.get(id);
  if (!target) throw notFound();
  const list = [...follows]
    .filter((k) => k.endsWith(`:${id}`))
    .map((k) => k.split(":")[0])
    .filter((uid) => userState.get(uid)?.is_active)
    .map((uid) => ({
      user: toUserSummary(userState.get(uid)),
      created_at: new Date().toISOString(),
    }));
  const { slice, nextCursor } = paginate(list, cursor, limit);
  return { data: slice, pagination: { next_cursor: nextCursor } };
}

export async function getFollowing(id, { cursor, limit } = {}) {
  await delay();
  requireAuth();
  const target = userState.get(id);
  if (!target) throw notFound();
  const list = [...follows]
    .filter((k) => k.startsWith(`${id}:`))
    .map((k) => k.split(":")[1])
    .filter((uid) => userState.get(uid)?.is_active)
    .map((uid) => ({
      user: toUserSummary(userState.get(uid)),
      created_at: new Date().toISOString(),
    }));
  const { slice, nextCursor } = paginate(list, cursor, limit);
  return { data: slice, pagination: { next_cursor: nextCursor } };
}

/** GET /api/users/:id/videos/liked — tidak ada di kontrak resmi.
 *  CATATAN MOCK: kontrak belum punya endpoint "liked videos milik user".
 *  Adapter ini filter dari `likes` set internal. Saat backend siap,
 *  ganti dengan endpoint resmi tanpa ubah signature. */
export async function getUserLikedVideos(id, { cursor, limit } = {}) {
  await delay();
  requireAuth();
  const target = userState.get(id);
  if (!target || !target.is_active) throw notFound();
  if (id !== currentUserId && target.is_private && !follows.has(`${currentUserId}:${id}`)) {
    throw notFound();
  }
  const likedIds = [...likes]
    .filter((k) => k.startsWith(`${id}:`))
    .map((k) => k.split(":")[1]);
  const list = likedIds
    .map((vid) => videoState.get(vid))
    .filter((v) => v && v.status === VIDEO_STATUS.READY)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const { slice, nextCursor } = paginate(list, cursor, limit);
  return {
    data: slice.map((v) => attachViewerFlags(v, currentUserId)),
    pagination: { next_cursor: nextCursor },
  };
}

/* ------------------------------------------------------------------ *
 * FEED
 * ------------------------------------------------------------------ */

/** GET /api/feed/home */
export async function getHomeFeed({ cursor, limit } = {}) {
  await delay();
  requireAuth();
  // video READY dari user publik + user yang difollow (exclude diri sendiri)
  const all = [...videoState.values()].filter((v) => {
    if (v.status !== VIDEO_STATUS.READY) return false;
    if (v.user_id === currentUserId) return false;
    const owner = userState.get(v.user_id);
    if (!owner || !owner.is_active) return false;
    if (owner.is_private) return follows.has(`${currentUserId}:${owner.id}`);
    return true;
  });
  all.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const { slice, nextCursor } = paginate(all, cursor, limit);
  return {
    data: slice.map((v) => attachViewerFlags(v, currentUserId)),
    pagination: { next_cursor: nextCursor },
  };
}

/* ------------------------------------------------------------------ *
 * VIDEO
 * ------------------------------------------------------------------ */

export async function getVideoById(id) {
  await delay();
  requireAuth();
  const v = videoState.get(id);
  if (!v || v.status === VIDEO_STATUS.DELETED) throw notFound();
  if (v.user_id !== currentUserId) {
    if (v.status !== VIDEO_STATUS.READY) throw notFound();
    const owner = userState.get(v.user_id);
    if (!owner || !owner.is_active) throw notFound();
    if (owner.is_private && !follows.has(`${currentUserId}:${owner.id}`)) throw notFound();
  }
  return { data: attachViewerFlags(v, currentUserId) };
}

export async function getVideoStatus(id) {
  await delay();
  requireAuth();
  const v = videoState.get(id);
  if (!v) throw notFound();
  if (v.user_id !== currentUserId) throw notFound();
  return {
    data: {
      id: v.id,
      status: v.status,
      retry_count: v.retry_count,
      duration_seconds: v.duration_seconds,
    },
  };
}

export async function getVideoPlaylist(id) {
  await delay();
  requireAuth();
  const v = videoState.get(id);
  if (!v) throw notFound();
  return { data: { url: v.hls_playlist_url } };
}

export async function deleteVideo(id) {
  await delay();
  requireAuth();
  const v = videoState.get(id);
  if (!v) throw notFound();
  if (v.user_id !== currentUserId) throw forbidden("You are not the owner of this video");
  v.status = VIDEO_STATUS.DELETED;
  videoState.set(id, v);
  return { status: 204 };
}

/* ------------------------------------------------------------------ *
 * UPLOAD
 * ------------------------------------------------------------------ */

export async function uploadIntent({ title, description } = {}) {
  await delay();
  requireAuth();
  // mock: jika ada pending, return existing; else buat baru
  let vid = pendingUploadVideoId ? videoState.get(pendingUploadVideoId) : null;
  if (!vid) {
    const id = `v-upload-${Date.now()}`;
    vid = {
      id,
      user_id: currentUserId,
      title: title || null,
      description: description || null,
      duration_seconds: null,
      status: VIDEO_STATUS.PENDING_UPLOAD,
      retry_count: 0,
      likes_count: 0,
      views_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
      thumbnail_url: null,
      hls_playlist_url: null,
      liked_by_me: false,
      is_owner: true,
      user: toUserSummary(userState.get(currentUserId)),
    };
    videoState.set(id, vid);
    pendingUploadVideoId = id;
  } else {
    if (title !== undefined) vid.title = title;
    if (description !== undefined) vid.description = description;
    videoState.set(vid.id, vid);
  }
  return {
    data: {
      video_id: vid.id,
      r2_key: `uploads/${currentUserId}/${vid.id}/source.mp4`,
      http_method: "PUT",
      upload_url: `https://r2.mock.local/${vid.id}?X-Amz-Mock=1`,
      upload_headers: { "Content-Type": "application/octet-stream" },
      min_size_bytes: 1024,
      max_size_bytes: 209715200,
      expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
    },
  };
}

export async function confirmUpload({ video_id, r2_key }) {
  await delay();
  requireAuth();
  if (!video_id || !r2_key) throw validation([{ field: "video_id", message: "required" }]);
  const v = videoState.get(video_id);
  if (!v) throw notFound();
  if (v.user_id !== currentUserId) throw forbidden();
  if (v.status !== VIDEO_STATUS.PENDING_UPLOAD) throw videoStatusConflict();
  if (!r2_key.endsWith(`${video_id}/source.mp4`)) {
    throw validation([{ field: "r2_key", message: "does not match video id" }]);
  }
  v.status = VIDEO_STATUS.PROCESSING;
  videoState.set(video_id, v);
  pendingUploadVideoId = null;
  // simulasi: langsung tandai READY dengan stream random
  setTimeout(() => {
    const cur = videoState.get(video_id);
    if (!cur) return;
    const stream = PUBLIC_HLS_STREAMS[Math.floor(Math.random() * PUBLIC_HLS_STREAMS.length)];
    cur.status = VIDEO_STATUS.READY;
    cur.hls_playlist_url = stream.url;
    cur.thumbnail_url = stream.poster;
    cur.duration_seconds = stream.duration_seconds;
    videoState.set(video_id, cur);
  }, 2500);
  return { data: { video_id, status: v.status, retry_count: v.retry_count } };
}

/* ------------------------------------------------------------------ *
 * LIKE
 * ------------------------------------------------------------------ */

export async function likeVideo(id) {
  await delay(80);
  requireAuth();
  const v = videoState.get(id);
  if (!v) throw notFound();
  if (v.status !== VIDEO_STATUS.READY && v.user_id !== currentUserId) throw notFound();
  if (v.status !== VIDEO_STATUS.READY) throw videoNotReady();
  const key = `${currentUserId}:${id}`;
  if (!likes.has(key)) {
    likes.add(key);
    v.likes_count += 1;
    videoState.set(id, v);
  }
  return { data: { video_id: id, liked: true, likes_count: v.likes_count } };
}

export async function unlikeVideo(id) {
  await delay(80);
  requireAuth();
  const v = videoState.get(id);
  if (!v) throw notFound();
  const key = `${currentUserId}:${id}`;
  if (likes.has(key)) {
    likes.delete(key);
    v.likes_count = Math.max(0, v.likes_count - 1);
    videoState.set(id, v);
  }
  return { data: { video_id: id, liked: false, likes_count: v.likes_count } };
}

/* ------------------------------------------------------------------ *
 * COMMENT
 * ------------------------------------------------------------------ */

export async function getComments(videoId, { cursor, limit } = {}) {
  await delay();
  requireAuth();
  const v = videoState.get(videoId);
  if (!v) throw notFound();
  if (v.user_id !== currentUserId && v.status !== VIDEO_STATUS.READY) throw notFound();
  const list = commentState
    .filter((c) => c.video_id === videoId)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const { slice, nextCursor } = paginate(list, cursor, limit);
  return { data: slice, pagination: { next_cursor: nextCursor } };
}

export async function createComment(videoId, content) {
  await delay();
  requireAuth();
  if (typeof content !== "string" || content.length < 1 || content.length > 1000) {
    throw validation([{ field: "content", message: "must be between 1 and 1000 characters" }]);
  }
  const v = videoState.get(videoId);
  if (!v) throw notFound();
  if (v.status !== VIDEO_STATUS.READY) throw videoNotReady();
  const id = `cm-${Date.now()}`;
  const comment = {
    id,
    video_id: videoId,
    user_id: currentUserId,
    parent_id: null,
    content,
    created_at: new Date().toISOString(),
    user: toUserSummary(userState.get(currentUserId)),
  };
  commentState = [comment, ...commentState];
  v.comments_count += 1;
  videoState.set(videoId, v);
  return { data: comment };
}

export async function replyComment(commentId, content) {
  await delay();
  requireAuth();
  if (typeof content !== "string" || content.length < 1 || content.length > 1000) {
    throw validation([{ field: "content", message: "must be between 1 and 1000 characters" }]);
  }
  const parent = commentState.find((c) => c.id === commentId);
  if (!parent) throw notFound();
  const v = videoState.get(parent.video_id);
  if (!v || v.status !== VIDEO_STATUS.READY) throw notFound();
  const id = `cm-reply-${Date.now()}`;
  const reply = {
    id,
    video_id: parent.video_id,
    user_id: currentUserId,
    parent_id: commentId,
    content,
    created_at: new Date().toISOString(),
    user: toUserSummary(userState.get(currentUserId)),
  };
  commentState = [reply, ...commentState];
  v.comments_count += 1;
  videoState.set(v.id, v);
  return { data: reply };
}

export async function deleteComment(commentId) {
  await delay();
  requireAuth();
  const c = commentState.find((x) => x.id === commentId);
  if (!c) throw notFound();
  if (c.user_id !== currentUserId) throw forbidden();
  commentState = commentState.filter((x) => x.id !== commentId && x.parent_id !== commentId);
  return { status: 204 };
}

/* ------------------------------------------------------------------ *
 * VIEW TRACKING
 * ------------------------------------------------------------------ */

export async function trackView(videoId) {
  await delay(50);
  requireAuth();
  const v = videoState.get(videoId);
  if (!v) throw notFound();
  if (v.status !== VIDEO_STATUS.READY) throw videoNotReady();
  v.views_count += 1;
  videoState.set(videoId, v);
  return { data: { video_id: videoId, views_count: v.views_count } };
}

/* ------------------------------------------------------------------ *
 * INBOX / DM — mock di luar kontrak resmi (realtime di Fase 4).
 * Menyimpan percakapan & pesan in-memory; sendMessage hanya append lokal.
 * ------------------------------------------------------------------ */

const DM_STATE = new Map();
const dmBase = Date.parse("2025-03-15T10:00:00Z");

function seedConversations(viewerId) {
  if (DM_STATE.has(viewerId)) return DM_STATE.get(viewerId);
  const convs = [
    {
      id: `dm-${viewerId}-alice`,
      user: toUserSummary(getUserById("u-alice")),
      messages: [
        { sender_id: "u-alice", content: "Eh lihat video kucingku belum?", offset: 5400 },
        { sender_id: viewerId, content: "Udah dong, lucu banget saltonya gagal terus", offset: 5100 },
        { sender_id: "u-alice", content: "Haha iya, nanti kuupload part 2", offset: 4800 },
      ],
      unread: 1,
    },
    {
      id: `dm-${viewerId}-diana`,
      user: toUserSummary(getUserById("u-diana")),
      messages: [
        { sender_id: "u-diana", content: "Besok ke skatepark jam 4 ya", offset: 7200 },
        { sender_id: viewerId, content: "Siip, aku bawa kamera", offset: 7000 },
        { sender_id: "u-diana", content: `Oke ${getUserById(viewerId)?.display_name || ""}!`, offset: 6900 },
      ],
      unread: 2,
    },
    {
      id: `dm-${viewerId}-bob`,
      user: toUserSummary(getUserById("u-bob")),
      messages: [
        { sender_id: "u-bob", content: "Bro rencana build raknya jadi kan", offset: 20000 },
        { sender_id: viewerId, content: "Jadi, sabtu aku mulai", offset: 19800 },
      ],
      unread: 0,
    },
  ].map((c) => ({
    id: c.id,
    user: c.user,
    unread_count: c.unread,
    updated_at: new Date(dmBase - Math.min(...c.messages.map((m) => m.offset)) * 1000).toISOString(),
    last_message: { ...c.messages[c.messages.length - 1], created_at: new Date(dmBase - c.messages[c.messages.length - 1].offset * 1000).toISOString(), id: `${c.id}-m${c.messages.length}` },
    messages: c.messages.map((m, i) => ({
      id: `${c.id}-m${i + 1}`,
      conversation_id: c.id,
      sender_id: m.sender_id,
      content: m.content,
      created_at: new Date(dmBase - m.offset * 1000).toISOString(),
    })),
  }));
  DM_STATE.set(viewerId, convs);
  return convs;
}

export async function getConversations() {
  await delay();
  requireAuth();
  const convs = seedConversations(currentUserId)
    .filter((c) => c.user && c.user.id !== currentUserId)
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
    .map(({ messages, ...rest }) => ({
      ...rest,
      last_message: rest.last_message,
    }));
  return { data: convs };
}

export async function getMessages(conversationId) {
  await delay();
  requireAuth();
  const convs = seedConversations(currentUserId);
  const conv = convs.find((c) => c.id === conversationId);
  if (!conv) throw notFound();
  conv.unread_count = 0;
  return { data: conv.messages, conversation: { id: conv.id, user: conv.user } };
}

export async function sendMessage(conversationId, content) {
  await delay(80);
  requireAuth();
  if (typeof content !== "string" || content.length < 1 || content.length > 1000) {
    throw validation([{ field: "content", message: "must be between 1 and 1000 characters" }]);
  }
  const convs = seedConversations(currentUserId);
  const conv = convs.find((c) => c.id === conversationId);
  if (!conv) throw notFound();
  const msg = {
    id: `${conversationId}-m${conv.messages.length + 1}-${Date.now()}`,
    conversation_id: conversationId,
    sender_id: currentUserId,
    content,
    created_at: new Date().toISOString(),
  };
  conv.messages.push(msg);
  conv.last_message = msg;
  conv.updated_at = msg.created_at;
  return { data: msg };
}

/* ------------------------------------------------------------------ *
 * NOTIFICATIONS
 * ------------------------------------------------------------------ */

export async function getNotifications({ cursor, limit } = {}) {
  await delay();
  requireAuth();
  const all = makeNotificationsFor(currentUserId).sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
  );
  const { slice, nextCursor } = paginate(all, cursor, limit);
  return { data: slice, pagination: { next_cursor: nextCursor } };
}

export async function markAllNotificationsRead() {
  await delay();
  requireAuth();
  // mock: hitung saja (state notifikasi belum mutable di fase ini)
  const list = makeNotificationsFor(currentUserId);
  const updated = list.filter((n) => !n.is_read).length;
  return { data: { updated_count: updated } };
}

/* ------------------------------------------------------------------ *
 * SEARCH (mock — di luar kontrak resmi, untuk halaman Temukan)
 * ------------------------------------------------------------------ */

export async function searchUsers(q) {
  await delay();
  requireAuth();
  const needle = (q || "").toLowerCase().trim();
  if (!needle) return { data: [] };
  const data = USERS.filter(
    (u) => u.is_active && (u.username.toLowerCase().includes(needle) || u.display_name.toLowerCase().includes(needle))
  ).map((u) => toUserSummary(u));
  return { data };
}

export async function searchVideos(q) {
  await delay();
  requireAuth();
  const needle = (q || "").toLowerCase().trim();
  if (!needle) return { data: [] };
  const list = [...videoState.values()].filter((v) => {
    if (v.status !== VIDEO_STATUS.READY) return false;
    const owner = userState.get(v.user_id);
    if (!owner || !owner.is_active) return false;
    if (owner.is_private && owner.id !== currentUserId) return false;
    const hay = `${v.title || ""} ${v.description || ""}`.toLowerCase();
    return hay.includes(needle);
  });
  return { data: list.slice(0, PAGINATION.MAX_LIMIT).map((v) => attachViewerFlags(v, currentUserId)) };
}

/* ------------------------------------------------------------------ *
 * Default export: group semua API untuk akses `api.foo()`.
 * ------------------------------------------------------------------ */

const api = {
  setCurrentUserId,
  getCurrentUserId,
  getMe,
  updateMe,
  deleteMe,
  getUserByIdOrUsername,
  getUserVideos,
  getUserLikedVideos,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getHomeFeed,
  getVideoById,
  getVideoStatus,
  getVideoPlaylist,
  deleteVideo,
  uploadIntent,
  confirmUpload,
  likeVideo,
  unlikeVideo,
  getComments,
  createComment,
  replyComment,
  deleteComment,
  trackView,
  getNotifications,
  markAllNotificationsRead,
  searchUsers,
  searchVideos,
  getConversations,
  getMessages,
  sendMessage,
};

export default api;
