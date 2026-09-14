// Mock data notifikasi. Field mengikuti NotificationObject di api_contracts.md.
// type ∈ { "like", "comment", "follow" }

const base = Date.parse("2025-03-15T10:00:00Z");
const ago = (sec) => new Date(base - sec * 1000).toISOString();

/**
 * @typedef {Object} NotificationObject
 * @property {string} id
 * @property {string} user_id
 * @property {string} actor_id
 * @property {"like"|"comment"|"follow"} type
 * @property {Record<string, any>} payload
 * @property {boolean} is_read
 * @property {string} created_at
 */

/**
 * @param {string} viewerId  - user_id yang sedang login (penerima notifikasi)
 * @returns {NotificationObject[]}
 */
export function makeNotificationsFor(viewerId) {
  // Buat notifikasi yang ditujukan ke viewer, dari actor lain
  return [
    {
      id: `n-${viewerId}-1`,
      user_id: viewerId,
      actor_id: "u-diana",
      type: "like",
      payload: { video_id: "v-a-1", username: "diana" },
      is_read: false,
      created_at: ago(120),
    },
    {
      id: `n-${viewerId}-2`,
      user_id: viewerId,
      actor_id: "u-bob",
      type: "comment",
      payload: { video_id: "v-b-1", username: "bob", comment_preview: "120rb?? Mahal?" },
      is_read: false,
      created_at: ago(900),
    },
    {
      id: `n-${viewerId}-3`,
      user_id: viewerId,
      actor_id: "u-charlie",
      type: "follow",
      payload: { username: "charlie" },
      is_read: true,
      created_at: ago(7200),
    },
    {
      id: `n-${viewerId}-4`,
      user_id: viewerId,
      actor_id: "u-diana",
      type: "like",
      payload: { video_id: "v-a-2", username: "diana" },
      is_read: false,
      created_at: ago(1800),
    },
    {
      id: `n-${viewerId}-5`,
      user_id: viewerId,
      actor_id: "u-eleven",
      type: "follow",
      payload: { username: "eleven" },
      is_read: true,
      created_at: ago(86400),
    },
  ];
}
