"use client";

import { USERS } from "@/mocks/users.js";
import Avatar from "@/components/common/Avatar.jsx";
import { Lock, AtSign } from "lucide-react";

/**
 * Grid kartu user untuk mock-login. Klik -> pilih user.
 * Data statis dari mocks (tidak butuh API call).
 */
export default function UserPicker({ onPick, busyId }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {USERS.map((u) => {
        const isBusy = busyId === u.id;
        return (
          <li key={u.id}>
            <button
              type="button"
              onClick={() => onPick(u)}
              disabled={Boolean(busyId)}
              className="w-full text-left flex items-center gap-3 p-3 rounded-2xl border border-moki-line bg-moki-surface/60 hover:bg-moki-surface transition disabled:opacity-50"
            >
              <Avatar src={u.avatar_url} alt={u.display_name} size={48} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold truncate">{u.display_name}</span>
                  {u.is_private ? <Lock className="w-3.5 h-3.5 text-moki-mute" /> : null}
                </div>
                <div className="flex items-center gap-1 text-xs text-moki-mute">
                  <AtSign className="w-3 h-3" />
                  <span className="truncate">{u.username}</span>
                </div>
                {u.bio ? <p className="text-xs text-moki-mute mt-1 line-clamp-2">{u.bio}</p> : null}
              </div>
              {isBusy ? (
                <span className="text-xs text-moki-mute animate-pulse">memuat…</span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
