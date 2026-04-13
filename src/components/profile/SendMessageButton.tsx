"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { findOrCreateConversation } from "@/app/actions/chat";

interface Props {
  profileId: string;
}

export default function SendMessageButton({ profileId }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <button
      className="fp-btn secondary"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const result = await findOrCreateConversation(profileId);
        if (result.conversationId) {
          router.push(`/chat/${result.conversationId}`);
        } else {
          setLoading(false);
        }
      }}
    >
      {loading ? "Opening…" : "✉️ Send Message"}
    </button>
  );
}
