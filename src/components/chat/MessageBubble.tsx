import type { Message } from "@/app/actions/chat";
import { formatRelativeTime } from "@/lib/utils";

interface Props {
  message: Message;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: Props) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
        isOwn
          ? "bg-indigo-600 text-white rounded-br-sm"
          : "bg-gray-100 text-gray-800 rounded-bl-sm"
      }`}>
        <p className="break-words">{message.content}</p>
        <p className={`text-xs mt-1 ${isOwn ? "text-indigo-200" : "text-gray-400"}`}>
          {formatRelativeTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}
