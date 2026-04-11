"use client";

import Link from "next/link";
import type { Conversation } from "@/app/actions/chat";

interface Props {
  conversations: Conversation[];
  activeId?: string;
}

export default function ChatSidebar({ conversations, activeId }: Props) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-3 font-semibold border-b border-gray-200">Messages</div>
      {conversations.map((conv) => (
        <Link
          key={conv.id}
          href={`/chat/${conv.id}`}
          className={`flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-50 transition ${
            activeId === conv.id ? "bg-indigo-50" : ""
          }`}
        >
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm">💬</div>
          <p className="text-sm font-medium">Conversation</p>
        </Link>
      ))}
    </div>
  );
}
