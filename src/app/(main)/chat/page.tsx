import { getConversations } from "@/app/actions/chat";
import Link from "next/link";

export default async function ChatPage() {
  const conversations = await getConversations();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">💬 Messages</h1>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {conversations.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-4">💬</p>
            <p>No conversations yet.</p>
            <p className="text-sm mt-2">Go to a profile to start chatting!</p>
          </div>
        )}
        {conversations.map((conv) => (
          <Link
            key={conv.id}
            href={`/chat/${conv.id}`}
            className="flex items-center gap-3 p-4 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition"
          >
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">💬</div>
            <div>
              <p className="font-medium text-sm">Conversation</p>
              <p className="text-xs text-gray-400">{new Date(conv.created_at).toLocaleDateString()}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
