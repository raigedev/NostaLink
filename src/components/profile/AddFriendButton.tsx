"use client";

import { useState } from "react";
import Link from "next/link";
import { sendFriendRequest } from "@/app/actions/friends";

type FriendshipStatus = "none" | "pending_sent" | "pending_received" | "friends";

interface Props {
  profileId: string;
  initialStatus: FriendshipStatus;
}

export default function AddFriendButton({ profileId, initialStatus }: Props) {
  const [status, setStatus] = useState<FriendshipStatus>(initialStatus);
  const [loading, setLoading] = useState(false);

  if (status === "friends") {
    return (
      <span className="fp-btn muted" style={{ cursor: "default" }}>
        ✅ Already Friends
      </span>
    );
  }

  if (status === "pending_sent") {
    return (
      <span className="fp-btn muted" style={{ cursor: "default" }}>
        ⏳ Request Sent
      </span>
    );
  }

  if (status === "pending_received") {
    return (
      <Link href="/friends" className="fp-btn">
        👋 Respond to Request
      </Link>
    );
  }

  return (
    <button
      className="fp-btn"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const result = await sendFriendRequest(profileId);
          if (!result.error) {
            setStatus("pending_sent");
          }
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? "Sending…" : "➕ Add Friend"}
    </button>
  );
}
