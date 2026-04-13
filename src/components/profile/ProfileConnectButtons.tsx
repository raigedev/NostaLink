"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { sendFriendRequest } from "@/app/actions/friends";
import { createConversation } from "@/app/actions/chat";

type FriendshipStatus = "none" | "pending_sent" | "pending_received" | "accepted";

interface Props {
  profileId: string;
  profileUsername: string;
  initialFriendshipStatus: FriendshipStatus;
}

export default function ProfileConnectButtons({
  profileId,
  profileUsername,
  initialFriendshipStatus,
}: Props) {
  const router = useRouter();
  const [friendPending, startFriendTransition] = useTransition();
  const [msgPending, startMsgTransition] = useTransition();
  const [friendStatus, setFriendStatus] = useState<FriendshipStatus>(initialFriendshipStatus);
  const [friendError, setFriendError] = useState<string | null>(null);
  const [msgError, setMsgError] = useState<string | null>(null);

  function handleAddFriend() {
    setFriendError(null);
    startFriendTransition(async () => {
      const result = await sendFriendRequest(profileId);
      if (result?.error) {
        setFriendError(result.error);
      } else {
        setFriendStatus("pending_sent");
      }
    });
  }

  function handleMessage() {
    setMsgError(null);
    startMsgTransition(async () => {
      const result = await createConversation(profileId);
      if ("error" in result && result.error) {
        setMsgError(result.error);
      } else if ("conversationId" in result) {
        router.push(`/chat/${result.conversationId}`);
      }
    });
  }

  return (
    <div>
      {/* Add Friend */}
      {friendStatus === "none" && (
        <button
          onClick={handleAddFriend}
          disabled={friendPending}
          className="fp-btn"
        >
          {friendPending ? "Sending…" : "➕ Add Friend"}
        </button>
      )}
      {friendStatus === "pending_sent" && (
        <span className="fp-btn muted" style={{ cursor: "default" }}>
          ✓ Request Sent
        </span>
      )}
      {friendStatus === "pending_received" && (
        <a href="/friends" className="fp-btn">
          ✋ Respond to Request
        </a>
      )}
      {friendStatus === "accepted" && (
        <span className="fp-btn muted" style={{ cursor: "default" }}>
          ✓ Friends with @{profileUsername}
        </span>
      )}
      {friendError && (
        <p style={{ fontSize: "11px", color: "#c00", margin: "2px 0 4px" }}>{friendError}</p>
      )}

      {/* Send Message */}
      <button
        onClick={handleMessage}
        disabled={msgPending}
        className="fp-btn secondary"
        style={{ marginTop: "4px" }}
      >
        {msgPending ? "Opening…" : `✉️ Message ${profileUsername}`}
      </button>
      {msgError && (
        <p style={{ fontSize: "11px", color: "#c00", margin: "2px 0 0" }}>{msgError}</p>
      )}
    </div>
  );
}
