// Daftar URL HLS publik yang dipakai untuk mock data video.
// Dipakai supaya komponen VideoPlayer (Fase 2) bisa menguji hls.js dengan stream nyata
// sebelum integrasi R2/private playlist.

export const PUBLIC_HLS_STREAMS = [
  {
    id: "mux-big-buck-bunny",
    label: "Big Buck Bunny — Mux",
    url: "https://stream.mux.com/v69RSHhFelSm4701snP22dYz2jICy4E4FUyk02rW4gxRM.m3u8",
    poster: "https://peach.blender.org/wp-content/uploads/title_anouncement.jpg",
    duration_seconds: 596,
  },
  {
    id: "mux-tears-of-steel",
    label: "Tears of Steel — Mux",
    url: "https://stream.mux.com/VZtzUzGRv02OhRnZCxcNg49OilvolTqdnFLEqBsTwaxU.m3u8",
    poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Tears_of_Steel_frame.png/640px-Tears_of_Steel_frame.png",
    duration_seconds: 734,
  },
  {
    id: "mux-acme",
    label: "ACME — Mux",
    url: "https://stream.mux.com/A3VXy02VoUinw01pwyomEO3bHnG4P32xzV7u1j1FSzjNg.m3u8",
    poster: "https://image.mux.com/A3VXy02VoUinw01pwyomEO3bHnG4P32xzV7u1j1FSzjNg/thumbnail.jpg?width=640",
    duration_seconds: 41,
  },
  {
    id: "apple-bipbop",
    label: "Apple BipBop",
    url: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8",
    poster: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/bipbop_16x9_thumb.jpg",
    duration_seconds: 600,
  },
  {
    id: "test-pattern",
    label: "Test Pattern — Mux",
    url: "https://stream.mux.com/Sc89iWAyNkhJ3P1rQ02nrEdCFTnfT01CZ2KmaEcxXfB008.m3u8",
    poster: "https://image.mux.com/Sc89iWAyNkhJ3P1rQ02nrEdCFTnfT01CZ2KmaEcxXfB008/thumbnail.jpg?width=640",
    duration_seconds: 12,
  },
  {
    id: "apple-advanced-stream",
    label: "Apple Advanced Stream",
    url: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8",
    poster: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/bipbop_16x9_thumb.jpg",
    duration_seconds: 600,
  },
];

export function getStreamById(id) {
  return PUBLIC_HLS_STREAMS.find((s) => s.id === id) || PUBLIC_HLS_STREAMS[0];
}
