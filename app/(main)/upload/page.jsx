"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Loader2, X } from "lucide-react";
import api from "@/lib/api";
import { profileHref } from "@/lib/paths.js";
import { useAuthStore } from "@/stores/useAuthStore";
import Button from "@/components/common/Button.jsx";
import { ApiError } from "@/lib/apiError.js";

const MAX_BYTES = 200 * 1024 * 1024;
const MIN_BYTES = 1024;

/**
 * Halaman Upload — 3 step wizard:
 * 1) pilih file (dropzone + preview), 2) form title/description,
 * 3) upload simulated + poll status sampai READY, lalu redirect ke detail.
 */
export default function UploadPage() {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.currentUserId);

  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [durationSec, setDurationSec] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [titleError, setTitleError] = useState(null);

  const [phase, setPhase] = useState("uploading");
  const [fatal, setFatal] = useState(null);
  const videoIdRef = useRef(null);

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  useEffect(() => {
    if (step !== 3) return undefined;
    let alive = true;
    let pollId = null;
    (async () => {
      try {
        setFatal(null);
        setPhase("uploading");
        const intent = await api.uploadIntent({ title: title.trim(), description: description.trim() || null });
        if (!alive) return;
        videoIdRef.current = intent?.data?.video_id;
        if (!videoIdRef.current) throw new Error("Tidak dapat video_id");
        await new Promise((r) => setTimeout(r, 400));
        if (!alive) return;
        setPhase("processing");
        await api.confirmUpload({ video_id: videoIdRef.current, r2_key: intent.data.r2_key });

        pollId = setInterval(async () => {
          try {
            const res = await api.getVideoStatus(videoIdRef.current);
            if (!alive) return;
            const status = res?.data?.status;
            if (status === "READY") {
              clearInterval(pollId);
              redirectToVideo(videoIdRef.current);
            } else if (status === "FAILED") {
              clearInterval(pollId);
              setFatal("Video gagal diproses.");
            }
          } catch (err) {
            /* retry poll */
          }
        }, 1000);
      } catch (err) {
        if (!alive) return;
        setFatal(
          err instanceof ApiError ? `[${err.code}] ${err.message}` : "Gagal mengupload video."
        );
      }
    })();
    return () => {
      alive = false;
      if (pollId) clearInterval(pollId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const redirectToVideo = async (videoId) => {
    try {
      const me = await api.getMe();
      router.replace(`${profileHref(me?.data?.username || "")}/video/${videoId}`);
    } catch (err) {
      router.replace("/home");
    }
  };

  const pickFile = (f) => {
    setFileError(null);
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      setFileError("File harus video.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setFileError("Ukuran maksimal 200MB.");
      return;
    }
    if (f.size < MIN_BYTES) {
      setFileError("File terlalu kecil.");
      return;
    }
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(f);
    const url = URL.createObjectURL(f);
    setFileUrl(url);
    setDurationSec(null);
  };

  const goToForm = () => {
    if (!file) {
      setFileError("Pilih file video terlebih dahulu.");
      return;
    }
    setStep(2);
  };

  const submitForm = (e) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      setTitleError("Title wajib diisi.");
      return;
    }
    if (t.length > 100) {
      setTitleError("Maksimal 100 karakter.");
      return;
    }
    setTitleError(null);
    setStep(3);
  };

  const resetAll = useCallback(() => {
    setStep(1);
    setFile(null);
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFileUrl(null);
    setDurationSec(null);
    setTitle("");
    setDescription("");
    setFatal(null);
    videoIdRef.current = null;
  }, [fileUrl]);

  return (
    <div className="h-full overflow-y-auto bg-moki-bg text-moki-text">
      <div className="max-w-xl mx-auto px-4 py-6 pb-24">
        <header className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-moki-surface"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold">Upload video</h1>
        </header>

        {step === 1 ? (
          <section>
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                pickFile(e.dataTransfer?.files?.[0]);
              }}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition min-h-[280px] ${
                dragOver ? "border-moki-accent bg-moki-surface" : "border-moki-line bg-moki-surface/40"
              }`}
            >
              <Upload className="w-10 h-10 text-moki-accent mb-3" />
              <p className="text-sm font-semibold">Tarik & letakkan video di sini</p>
              <p className="text-xs text-moki-mute mt-1">atau klik untuk memilih file</p>
              {file ? (
                <p className="text-xs text-moki-mute mt-3">
                  {file.name} · {formatBytes(file.size)}
                </p>
              ) : null}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            {fileError ? <p className="mt-2 text-xs text-moki-accent">{fileError}</p> : null}

            {file && fileUrl ? (
              <div className="mt-4">
                <div className="relative rounded-xl overflow-hidden bg-black">
                  <video
                    src={fileUrl}
                    controls
                    className="w-full max-h-[280px] object-contain"
                    onLoadedMetadata={(e) => setDurationSec(Math.round(e.currentTarget.duration || 0))}
                  />
                  <button
                    type="button"
                    onClick={() => pickFile(null) || (setFile(null), setFileUrl(null))}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                    aria-label="Hapus file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-moki-mute mt-2">
                  {file.name} · {formatBytes(file.size)}
                  {typeof durationSec === "number" ? ` · ${formatDur(durationSec)}` : ""}
                </p>
              </div>
            ) : null}

            <div className="mt-6 flex justify-end">
              <Button onClick={goToForm} disabled={!file}>
                Lanjut
              </Button>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <form onSubmit={submitForm}>
            <label className="block text-xs text-moki-mute mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
              className="w-full bg-moki-surface border border-moki-line rounded-lg px-3 py-2 text-sm text-moki-text focus:outline-none focus:border-moki-accent"
            />
            {titleError ? <p className="mt-1 text-xs text-moki-accent">{titleError}</p> : null}

            <label className="block text-xs text-moki-mute mt-4 mb-1">Deskripsi (opsional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={4}
              className="w-full bg-moki-surface border border-moki-line rounded-lg px-3 py-2 text-sm text-moki-text focus:outline-none focus:border-moki-accent resize-none"
            />

            <p className="mt-4 text-xs text-moki-mute">
              Privacy mengikuti setting akun. Atur di edit profil.
            </p>

            <div className="mt-6 flex justify-between">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                Kembali
              </Button>
              <Button type="submit">Upload</Button>
            </div>
          </form>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            {fatal ? (
              <>
                <p className="text-sm font-semibold text-moki-accent mb-3">{fatal}</p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={resetAll}>
                    Ulangi
                  </Button>
                  <Button type="button" onClick={() => setStep(2)}>
                    Edit form
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Loader2 className="w-8 h-8 animate-spin text-moki-accent" />
                <p className="mt-4 text-sm font-semibold">
                  {phase === "uploading" ? "Mengupload…" : "Memproses…"}
                </p>
                <p className="text-xs text-moki-mute mt-1">Simulasi transcode mock (beberapa detik)</p>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDur(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
