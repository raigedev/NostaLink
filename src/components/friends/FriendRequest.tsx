"use client";

import { acceptFriendRequest, declineFriendRequest } from "@/app/actions/friends";
import { useTransition } from "react";

interface ProfileData {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Request {
  id: string;
  requester_id: string;
  requester?: ProfileData | ProfileData[] | null;
}

function getFirstProfile(requester: ProfileData | ProfileData[] | null | undefined): ProfileData | null {
  if (!requester) return null;
  if (Array.isArray(requester)) return requester[0] ?? null;
  return requester;
}

interface Props { request: Request }

export default function FriendRequest({ request }: Props) {
  const [pending, startTransition] = useTransition();
  const r = getFirstProfile(request.requester);

  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4">
      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-lg flex-shrink-0">
        {r?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-full" />
        ) : "👤"}
      </div>
      <div className="flex-1">
        <p className="font-medium text-sm">{r?.display_name || r?.username || "Unknown"}</p>
        <p className="text-xs text-gray-400">@{r?.username}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => startTransition(() => { acceptFriendRequest(request.id); })}
          disabled={pending}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          Accept
        </button>
        <button
          onClick={() => startTransition(() => { declineFriendRequest(request.id); })}
          disabled={pending}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 disabled:opacity-50 transition"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
