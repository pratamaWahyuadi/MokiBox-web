"use client";

import { create } from "zustand";

/**
 * Global state untuk VideoPlayer.
 * - isMuted: semua instance player pakai state ini supaya toggle mute berlaku di semua video.
 * - activeVideoId: video yang sedang fullscreen-visible (untuk mute control terikat video tertentu di feed).
 */
export const usePlayerStore = create((set) => ({
  isMuted: true,
  activeVideoId: null,
  setMuted: (v) => set({ isMuted: Boolean(v) }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  setActiveVideoId: (id) => set({ activeVideoId: id }),
}));