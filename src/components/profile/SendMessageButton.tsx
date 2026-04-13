"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { findOrCreateConversation } from "@/app/actions/chat";

interface Props {
  profileId: string;
}

export default function SendMessageButton({ profileId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div>
      <button
        className="fp-btn secondary"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setError(null);
          try {
            const result = await findOrCreateConversation(profileId);
            if (result.conversationId) {
              router.push(`/chat/${result.conversationId}`);
            } else {
              setError("Could not open chat. Please try again.");
            }
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? "Opening…" : "✉️ Send Message"}
      </button>
      {error && (
        <p style={{ fontSize: "11px", color: "#c00", marginTop: "4px" }}>{error}</p>
      )}
    </div>
  );
}
