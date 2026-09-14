// Mock data user. Field mengikuti UserProfile + UserSummary di api_contracts.md.

/**
 * @typedef {Object} UserProfile
 * @property {string} id
 * @property {string} username
 * @property {string} display_name
 * @property {string|null} bio
 * @property {string|null} avatar_url
 * @property {boolean} is_private
 * @property {boolean} is_active
 * @property {string} created_at
 * @property {boolean} [is_following]   // untuk GET /api/users/:id
 * @property {number} [follower_count]
 * @property {number} [following_count]
 */

/** @type {UserProfile[]} */
export const USERS = [
  {
    id: "u-alice",
    username: "alice",
    display_name: "Alice Wonder",
    bio: "Cat lover, sunset chaser, mom of 3 kittens 🐈",
    avatar_url: "https://i.pravatar.cc/240?img=47",
    is_private: false,
    is_active: true,
    created_at: "2024-08-12T10:00:00Z",
    follower_count: 1240,
    following_count: 87,
  },
  {
    id: "u-bob",
    username: "bob",
    display_name: "Bob the Builder",
    bio: "Build things, break things, repeat.",
    avatar_url: "https://i.pravatar.cc/240?img=12",
    is_private: false,
    is_active: true,
    created_at: "2024-09-01T08:30:00Z",
    follower_count: 420,
    following_count: 312,
  },
  {
    id: "u-charlie",
    username: "charlie",
    display_name: "Charlie ✨",
    bio: "Private account. Friends only.",
    avatar_url: "https://i.pravatar.cc/240?img=33",
    is_private: true,
    is_active: true,
    created_at: "2024-10-15T12:00:00Z",
    follower_count: 56,
    following_count: 21,
  },
  {
    id: "u-diana",
    username: "diana",
    display_name: "Diana Skate",
    bio: "Skate | Travel | Coffee",
    avatar_url: "https://i.pravatar.cc/240?img=5",
    is_private: false,
    is_active: true,
    created_at: "2025-01-04T19:45:00Z",
    follower_count: 8900,
    following_count: 240,
  },
  {
    id: "u-eleven",
    username: "eleven",
    display_name: "Eleven 👾",
    bio: "Demo account for QA",
    avatar_url: "https://i.pravatar.cc/240?img=68",
    is_private: false,
    is_active: true,
    created_at: "2025-02-20T09:00:00Z",
    follower_count: 0,
    following_count: 0,
  },
];

/** @returns {UserProfile|null} */
export function getUserById(id) {
  return USERS.find((u) => u.id === id) || null;
}

/** @returns {UserProfile|null} */
export function getUserByUsername(username) {
  return USERS.find((u) => u.username === username) || null;
}

/** @returns {UserSummary} */
export function toUserSummary(user) {
  return {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    is_private: user.is_private,
  };
}
