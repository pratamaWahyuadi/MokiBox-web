// Mock data video. Field mengikuti VideoObject di api_contracts.md.
// Video milik user tertentu (berdasarkan user_id). Status default READY.
// hls_playlist_url dan thumbnail_url ambil dari PUBLIC_HLS_STREAMS + poster.

import { PUBLIC_HLS_STREAMS } from "./streams.js";
import { toUserSummary } from "./users.js";

/**
 * @typedef {Object} VideoObject
 * @property {string} id
 * @property {string} user_id
 * @property {string|null} title
 * @property {string|null} description
 * @property {number|null} duration_seconds
 * @property {"PENDING_UPLOAD"|"PROCESSING"|"READY"|"FAILED"|"DELETED"} status
 * @property {number} retry_count
 * @property {number} likes_count
 * @property {number} views_count
 * @property {number} comments_count
 * @property {string} created_at
 * @property {string|null} thumbnail_url
 * @property {string|null} hls_playlist_url
 * @property {boolean} liked_by_me
 * @property {boolean} is_owner
 * @property {UserSummary} user
 */

const now = Date.parse("2025-03-15T10:00:00Z");
const minutesAgo = (m) => new Date(now - m * 60_000).toISOString();
const hoursAgo = (h) => new Date(now - h * 3_600_000).toISOString();
const daysAgo = (d) => new Date(now - d * 86_400_000).toISOString();

const seed = (i) => PUBLIC_HLS_STREAMS[i % PUBLIC_HLS_STREAMS.length];

/** @type {VideoObject[]} */
export const VIDEOS = [
  // alice (3 video)
  {
    id: "v-a-1",
    user_id: "u-alice",
    title: "Sunset di Bali 🌅",
    description: "Pulang kantor langsung ke Pantai Kuta. Worth it.",
    duration_seconds: 596,
    status: "READY",
    retry_count: 0,
    likes_count: 1280,
    views_count: 21450,
    comments_count: 142,
    created_at: hoursAgo(2),
    thumbnail_url: seed(0).poster,
    hls_playlist_url: seed(0).url,
    liked_by_me: false,
    is_owner: false,
    user: toUserSummary({ id: "u-alice", username: "alice", display_name: "Alice Wonder", avatar_url: "https://i.pravatar.cc/240?img=47", is_private: false }),
  },
  {
    id: "v-a-2",
    user_id: "u-alice",
    title: "Kucing belajar salto",
    description: "Belum berhasil juga, tapi effort-nya 11/10 🐈",
    duration_seconds: 734,
    status: "READY",
    retry_count: 0,
    likes_count: 3402,
    views_count: 56120,
    comments_count: 412,
    created_at: hoursAgo(8),
    thumbnail_url: seed(1).poster,
    hls_playlist_url: seed(1).url,
    liked_by_me: false,
    is_owner: false,
    user: toUserSummary({ id: "u-alice", username: "alice", display_name: "Alice Wonder", avatar_url: "https://i.pravatar.cc/240?img=47", is_private: false }),
  },
  {
    id: "v-a-3",
    user_id: "u-alice",
    title: "Resep matcha latte 5 menit",
    description: null,
    duration_seconds: 41,
    status: "READY",
    retry_count: 0,
    likes_count: 89,
    views_count: 1240,
    comments_count: 11,
    created_at: daysAgo(1),
    thumbnail_url: seed(2).poster,
    hls_playlist_url: seed(2).url,
    liked_by_me: false,
    is_owner: false,
    user: toUserSummary({ id: "u-alice", username: "alice", display_name: "Alice Wonder", avatar_url: "https://i.pravatar.cc/240?img=47", is_private: false }),
  },

  // bob (2 video)
  {
    id: "v-b-1",
    user_id: "u-bob",
    title: "Bikin meja dari pallet",
    description: "Total biaya: 120rb. Penasaran?",
    duration_seconds: 600,
    status: "READY",
    retry_count: 0,
    likes_count: 540,
    views_count: 8120,
    comments_count: 64,
    created_at: hoursAgo(5),
    thumbnail_url: seed(3).poster,
    hls_playlist_url: seed(3).url,
    liked_by_me: false,
    is_owner: false,
    user: toUserSummary({ id: "u-bob", username: "bob", display_name: "Bob the Builder", avatar_url: "https://i.pravatar.cc/240?img=12", is_private: false }),
  },
  {
    id: "v-b-2",
    user_id: "u-bob",
    title: "Workshop tour",
    description: "Garasi disulap jadi studio kecil.",
    duration_seconds: 12,
    status: "READY",
    retry_count: 0,
    likes_count: 75,
    views_count: 940,
    comments_count: 8,
    created_at: daysAgo(2),
    thumbnail_url: seed(4).poster,
    hls_playlist_url: seed(4).url,
    liked_by_me: false,
    is_owner: false,
    user: toUserSummary({ id: "u-bob", username: "bob", display_name: "Bob the Builder", avatar_url: "https://i.pravatar.cc/240?img=12", is_private: false }),
  },

  // charlie (1 video, akun private)
  {
    id: "v-c-1",
    user_id: "u-charlie",
    title: "Friends only snippet",
    description: "Cuma untuk yang follow.",
    duration_seconds: 600,
    status: "READY",
    retry_count: 0,
    likes_count: 12,
    views_count: 110,
    comments_count: 3,
    created_at: daysAgo(1),
    thumbnail_url: seed(5).poster,
    hls_playlist_url: seed(5).url,
    liked_by_me: false,
    is_owner: false,
    user: toUserSummary({ id: "u-charlie", username: "charlie", display_name: "Charlie ✨", avatar_url: "https://i.pravatar.cc/240?img=33", is_private: true }),
  },

  // diana (3 video)
  {
    id: "v-d-1",
    user_id: "u-diana",
    title: "Skate session sore",
    description: "Loyang baru, sore cerah. Combo bestie 🔥",
    duration_seconds: 596,
    status: "READY",
    retry_count: 0,
    likes_count: 9870,
    views_count: 142300,
    comments_count: 1820,
    created_at: minutesAgo(45),
    thumbnail_url: seed(0).poster,
    hls_playlist_url: seed(0).url,
    liked_by_me: false,
    is_owner: false,
    user: toUserSummary({ id: "u-diana", username: "diana", display_name: "Diana Skate", avatar_url: "https://i.pravatar.cc/240?img=5", is_private: false }),
  },
  {
    id: "v-d-2",
    user_id: "u-diana",
    title: "Coffee + city lights",
    description: "Cafe baru di Sudirman, kopinya juara.",
    duration_seconds: 41,
    status: "READY",
    retry_count: 0,
    likes_count: 2100,
    views_count: 28100,
    comments_count: 312,
    created_at: hoursAgo(20),
    thumbnail_url: seed(2).poster,
    hls_playlist_url: seed(2).url,
    liked_by_me: false,
    is_owner: false,
    user: toUserSummary({ id: "u-diana", username: "diana", display_name: "Diana Skate", avatar_url: "https://i.pravatar.cc/240?img=5", is_private: false }),
  },
  {
    id: "v-d-3",
    user_id: "u-diana",
    title: "Travel vlog: Yogya 2 hari",
    description: null,
    duration_seconds: 734,
    status: "READY",
    retry_count: 0,
    likes_count: 5400,
    views_count: 72400,
    comments_count: 870,
    created_at: daysAgo(3),
    thumbnail_url: seed(1).poster,
    hls_playlist_url: seed(1).url,
    liked_by_me: false,
    is_owner: false,
    user: toUserSummary({ id: "u-diana", username: "diana", display_name: "Diana Skate", avatar_url: "https://i.pravatar.cc/240?img=5", is_private: false }),
  },

  // eleven (1 video, akun baru)
  {
    id: "v-e-1",
    user_id: "u-eleven",
    title: "Halo MokiBox!",
    description: "Akun baru, testing testing.",
    duration_seconds: 12,
    status: "READY",
    retry_count: 0,
    likes_count: 0,
    views_count: 0,
    comments_count: 0,
    created_at: minutesAgo(10),
    thumbnail_url: seed(4).poster,
    hls_playlist_url: seed(4).url,
    liked_by_me: false,
    is_owner: false,
    user: toUserSummary({ id: "u-eleven", username: "eleven", display_name: "Eleven 👾", avatar_url: "https://i.pravatar.cc/240?img=68", is_private: false }),
  },
];

/** @returns {VideoObject|null} */
export function getVideoById(id) {
  return VIDEOS.find((v) => v.id === id) || null;
}
