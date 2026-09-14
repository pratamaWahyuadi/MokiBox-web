// Mock data comment. Field mengikuti CommentObject di api_contracts.md.
// parent_id null = top-level, !== null = reply.

import { toUserSummary } from "./users.js";

/**
 * @typedef {Object} CommentObject
 * @property {string} id
 * @property {string} video_id
 * @property {string} user_id
 * @property {string|null} parent_id
 * @property {string} content
 * @property {string} created_at
 * @property {UserSummary} user
 */

const base = Date.parse("2025-03-15T10:00:00Z");
const ago = (sec) => new Date(base - sec * 1000).toISOString();

/** @type {CommentObject[]} */
export const COMMENTS = [
  // comments on v-d-1
  {
    id: "cm-1",
    video_id: "v-d-1",
    user_id: "u-alice",
    parent_id: null,
    content: "Skatenya mulus banget kak!",
    created_at: ago(60),
    user: toUserSummary({ id: "u-alice", username: "alice", display_name: "Alice Wonder", avatar_url: "https://i.pravatar.cc/240?img=47", is_private: false }),
  },
  {
    id: "cm-2",
    video_id: "v-d-1",
    user_id: "u-bob",
    parent_id: null,
    content: "Loyang apa itu?",
    created_at: ago(40),
    user: toUserSummary({ id: "u-bob", username: "bob", display_name: "Bob the Builder", avatar_url: "https://i.pravatar.cc/240?img=12", is_private: false }),
  },
  {
    id: "cm-3",
    video_id: "v-d-1",
    user_id: "u-diana",
    parent_id: "cm-2",
    content: "Loyang 8.25, brand Element.",
    created_at: ago(35),
    user: toUserSummary({ id: "u-diana", username: "diana", display_name: "Diana Skate", avatar_url: "https://i.pravatar.cc/240?img=5", is_private: false }),
  },
  {
    id: "cm-4",
    video_id: "v-d-1",
    user_id: "u-eleven",
    parent_id: "cm-2",
    content: "Pengen beli juga 😭",
    created_at: ago(30),
    user: toUserSummary({ id: "u-eleven", username: "eleven", display_name: "Eleven 👾", avatar_url: "https://i.pravatar.cc/240?img=68", is_private: false }),
  },
  {
    id: "cm-5",
    video_id: "v-d-1",
    user_id: "u-alice",
    parent_id: null,
    content: "Musiknya asik, request judulnya dong!",
    created_at: ago(20),
    user: toUserSummary({ id: "u-alice", username: "alice", display_name: "Alice Wonder", avatar_url: "https://i.pravatar.cc/240?img=47", is_private: false }),
  },

  // comments on v-a-1
  {
    id: "cm-6",
    video_id: "v-a-1",
    user_id: "u-diana",
    parent_id: null,
    content: "Bali emang gak pernah gagal 🌅",
    created_at: ago(300),
    user: toUserSummary({ id: "u-diana", username: "diana", display_name: "Diana Skate", avatar_url: "https://i.pravatar.cc/240?img=5", is_private: false }),
  },
  {
    id: "cm-7",
    video_id: "v-a-1",
    user_id: "u-bob",
    parent_id: null,
    content: "Camera gear?",
    created_at: ago(250),
    user: toUserSummary({ id: "u-bob", username: "bob", display_name: "Bob the Builder", avatar_url: "https://i.pravatar.cc/240?img=12", is_private: false }),
  },
  {
    id: "cm-8",
    video_id: "v-a-1",
    user_id: "u-alice",
    parent_id: "cm-7",
    content: "Sony A7C + kit lens aja.",
    created_at: ago(240),
    user: toUserSummary({ id: "u-alice", username: "alice", display_name: "Alice Wonder", avatar_url: "https://i.pravatar.cc/240?img=47", is_private: false }),
  },

  // comments on v-b-1
  {
    id: "cm-9",
    video_id: "v-b-1",
    user_id: "u-alice",
    parent_id: null,
    content: "120rb?? Mahal?",
    created_at: ago(900),
    user: toUserSummary({ id: "u-alice", username: "alice", display_name: "Alice Wonder", avatar_url: "https://i.pravatar.cc/240?img=47", is_private: false }),
  },
  {
    id: "cm-10",
    video_id: "v-b-1",
    user_id: "u-bob",
    parent_id: "cm-9",
    content: "Udah termasuk baut, cat, dan sealant.",
    created_at: ago(880),
    user: toUserSummary({ id: "u-bob", username: "bob", display_name: "Bob the Builder", avatar_url: "https://i.pravatar.cc/240?img=12", is_private: false }),
  },
];
