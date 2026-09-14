"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import api from "@/lib/api";
import UserPicker from "@/components/auth/UserPicker.jsx";
import Logo from "@/components/common/Logo.jsx";
import { ApiError } from "@/lib/apiError.js";

export default function LoginPage() {
  const router = useRouter();
  const setCurrentUserId = useAuthStore((s) => s.setCurrentUserId);
  const [busyId, setBusyId] = useState(null);
  const [errMsg, setErrMsg] = useState(null);

  const handlePick = async (user) => {
    setErrMsg(null);
    setBusyId(user.id);
    try {
      api.setCurrentUserId(user.id);
      await api.getMe();
      setCurrentUserId(user.id);
      router.replace("/home");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? `[${err.code}] ${err.message}`
          : err?.message || "Login gagal, coba lagi.";
      setErrMsg(msg);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-screen px-5 py-10 sm:py-16 max-w-3xl mx-auto">
      <header className="mb-8 flex flex-col items-center text-center">
        <Logo size={64} showWordmark className="mb-3" />
        <h1 className="sr-only">MokiBox</h1>
        <p className="text-moki-mute mt-2 text-sm sm:text-base">
          Mock login — pilih akun untuk simulasi session. (Zitadel menyusul di Fase 4.)
        </p>
      </header>

      <section aria-label="Pilih akun mock">
        <UserPicker onPick={handlePick} busyId={busyId} />
      </section>

      {errMsg ? (
        <p
          role="alert"
          className="mt-6 text-sm text-moki-accent border border-moki-accent/40 bg-moki-accent/10 rounded-xl px-3 py-2"
        >
          {errMsg}
        </p>
      ) : null}

      <footer className="mt-10 text-center text-xs text-moki-mute">
        v0.1.0 — Phase 1 (Fondasi)
      </footer>
    </main>
  );
}
