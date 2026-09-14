/**
 * Helper URL untuk route profile & video.
 * Username selalu tanpa "@" di data; path pakai prefix "@".
 */

/** @param {string} username */
export function profileHref(username) {
  const clean = String(username || "").replace(/^@+/, "");
  return `/@${clean}`;
}

/** @param {string} username @param {string} videoId */
export function videoHref(username, videoId) {
  return `${profileHref(username)}/video/${videoId}`;
}

/** Strip prefix "@" dari route param handle. @param {string} handle */
export function parseHandle(handle) {
  return String(handle || "").replace(/^@+/, "");
}
