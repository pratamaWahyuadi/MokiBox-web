"use client";

import { useEffect, useState } from "react";
import { Home, Compass, Plus, MessageCircle, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import api from "@/lib/api";
import { profileHref } from "@/lib/paths.js";
import ThemeToggle from "@/components/common/ThemeToggle.jsx";

/**
 * Bottom navigation untuk mobile (<md).
 * Item tanpa halaman tampilkan toast "coming soon".
 */
const ITEMS = [
  { key: "home", label: "Beranda", icon: Home, href: "/home", enabled: true },
  { key: "discover", label: "Temukan", icon: Compass, href: "/discover", enabled: true },
  { key: "upload", label: "", icon: Plus, href: "/upload", enabled: true, primary: true },
  { key: "chat", label: "Chat", icon: MessageCircle, href: "/chat", enabled: true },
  { key: "profile", label: "Profil", icon: User, href: "/profile", enabled: true },
];

export default function BottomNav({ onDisabledClick }) {
  const pathname = usePathname() || "";
  const currentUserId = useAuthStore((s) => s.currentUserId);
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

  return (
    <>
      <ThemeToggle className="fixed top-3 right-3 z-50 md:hidden" />
      <nav
      aria-label="Bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-moki-bg/95 backdrop-blur border-t border-moki-line md:hidden"
    >
      <ul className="flex items-stretch justify-around h-14">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const isProfile = item.key === "profile";
          const enabled = isProfile ? Boolean(profilePath) : item.enabled;
          const href = isProfile ? profilePath || "/home" : item.href;
          const active = enabled && (isProfile ? pathname.startsWith("/@") : pathname.startsWith(href));
          const handle = (e) => {
            if (!enabled) {
              e.preventDefault();
              if (typeof onDisabledClick === "function") onDisabledClick(item.label || "Segera hadir");
              return;
            }
          };
          if (item.primary) {
            return (
              <li key={item.key} className="flex-1 flex items-center justify-center">
                <a
                  href={href}
                  onClick={handle}
                  aria-label={item.label || "Upload"}
                  className="w-10 h-10 rounded-full bg-moki-accent text-white flex items-center justify-center hover:brightness-110"
                >
                  <Icon className="w-5 h-5" />
                </a>
              </li>
            );
          }
          return (
            <li key={item.key} className="flex-1">
              <a
                href={href}
                onClick={handle}
                aria-current={active ? "page" : undefined}
                className={`h-full flex flex-col items-center justify-center gap-0.5 text-[11px] ${
                  active ? "text-moki-text" : "text-moki-mute hover:text-moki-text"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-moki-accent" : ""}`} />
                <span>{item.label}</span>
              </a>
            </li>
          );
        })}
        </ul>
      </nav>
    </>
  );
}