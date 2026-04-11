"use client";

import { useState, useEffect, useRef } from "react";
import type { Message } from "@/app/actions/chat";
import { sendMessage } from "@/app/actions/chat";
import { createClient } from "@/lib/supabase/client";
import MessageBubble from "./MessageBubble";

interface Props {
  conversationId: string;
  initialMessages: Message[];
}

export default function ChatWindow({ conversationId, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setTyping(false);
    const t = text.trim();
    setText("");
    await sendMessage(conversationId, t);
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 font-semibold">💬 Chat</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} isOwn={m.sender_id === myId} />
        ))}
        {typing && <p className="text-xs text-gray-400 text-center animate-pulse">Someone is typing…</p>}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="p-3 border-t border-gray-200 flex gap-2">
        <input
          value={text}
          onChange={(e) => { setText(e.target.value); setTyping(e.target.value.length > 0); }}
          placeholder="Type a message…"
          className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm disabled:opacity-50 hover:bg-indigo-700 transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}
