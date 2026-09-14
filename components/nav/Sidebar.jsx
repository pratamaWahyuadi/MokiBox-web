"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Home, Compass, Plus, MessageCircle, User, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import api from "@/lib/api";
import { profileHref } from "@/lib/paths.js";
import Logo from "@/components/common/Logo.jsx";
import Avatar from "@/components/common/Avatar.jsx";
import ThemeToggle from "@/components/common/ThemeToggle.jsx";

/**
 * Sidebar desktop (>=md). Lebar ~240px, item vertikal.
 * Avatar user + tombol logout di bawah.
 */
const ITEMS = [
  { key: "home", label: "Beranda", icon: Home, href: "/home", enabled: true },
  { key: "discover", label: "Temukan", icon: Compass, href: "/discover", enabled: true },
  { key: "upload", label: "Upload", icon: Plus, href: "/upload", enabled: true },
  { key: "chat", label: "Chat", icon: MessageCircle, href: "/chat", enabled: true },
  { key: "profile", label: "Profil", icon: User, href: "/profile", enabled: true },
];

export default function Sidebar({ onDisabledClick }) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const currentUserId = useAuthStore((s) => s.currentUserId);
  const logout = useAuthStore((s) => s.logout);
  const [profilePath, setProfilePath] = useState(null);

  useEffect(() => {
    if (!currentUserId) return;
    let alive = true;
    api
      .getMe()
      .then((res) => {
        if (alive && res?.data?.username) setProfilePath(profileHref(res.data.username));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [currentUserId]);

  const handleLogout = () => {
    logout();
    api.setCurrentUserId(null);
    router.replace("/login");
  };

  return (
    <aside
      aria-label="Sidebar navigation"
      className="hidden md:flex md:flex-col w-60 h-full border-r border-moki-line bg-moki-bg p-3"
    >
      <div className="px-2 pt-2 pb-4 flex items-center justify-between gap-2">
        <Logo size={36} showWordmark />
        <ThemeToggle />
      </div>

      <nav className="flex-1">
        <ul className="flex flex-col gap-1">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const isProfile = item.key === "profile";
            const enabled = isProfile ? Boolean(profilePath) : item.enabled;
            const href = isProfile ? profilePath || "/home" : item.href;
            const active = enabled && (isProfile ? pathname.startsWith("/@") : pathname.startsWith(href));
            const handle = (e) => {
              if (!enabled) {
                e.preventDefault();
                if (typeof onDisabledClick === "function") onDisabledClick(item.label);
              }
            };
            return (
              <li key={item.key}>
                <a
                  href={href}
                  onClick={handle}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                    active
                      ? "bg-moki-surface text-moki-text font-semibold"
                      : "text-moki-text/90 hover:bg-moki-surface"
                  } ${!enabled ? "opacity-60" : ""}`}
                >
                  <Icon className={`w-5 h-5 ${active ? "text-moki-accent" : "text-moki-text"}`} />
                  <span>{item.label}</span>
                  {!enabled ? (
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-moki-mute">
                      soon
                    </span>
                  ) : null}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto border-t border-moki-line pt-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-moki-surface">
          <Avatar size={36} alt={currentUserId || "User"} />
          <div className="min-w-0 flex-1">
            <div className="text-xs text-moki-mute">Signed in sebagai</div>
            <div className="text-sm font-semibold truncate">{currentUserId}</div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-8 h-8 rounded-full flex items-center justify-center text-moki-mute hover:text-moki-text hover:bg-moki-bg"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}