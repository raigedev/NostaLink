"use client";

import { markAsRead } from "@/app/actions/notifications";
import type { Notification } from "@/app/actions/notifications";
import { formatRelativeTime } from "@/lib/utils";
import { useTransition } from "react";

interface Props { notifications: Notification[] }

const TYPE_ICONS: Record<string, string> = {
  friend_request: "👥",
  friend_accept: "✅",
  like: "❤️",
  comment: "💬",
  message: "✉️",
  mention: "📣",
  default: "🔔",
};

export default function NotificationList({ notifications }: Props) {
  const [, startTransition] = useTransition();

  if (notifications.length === 0) {
    return <div className="p-6 text-center text-gray-400 text-sm">No notifications yet</div>;
  }

  return (
    <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
      {notifications.map((n) => (
        <div
          key={n.id}
          onClick={() => !n.read && startTransition(() => { markAsRead(n.id); })}
          className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50 transition ${!n.read ? "bg-indigo-50" : ""}`}
        >
          <span className="text-lg flex-shrink-0">{TYPE_ICONS[n.type] ?? TYPE_ICONS.default}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate capitalize">{n.type.replace("_", " ")}</p>
            <p className="text-xs text-gray-400">{formatRelativeTime(n.created_at)}</p>
          </div>
          {!n.read && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1 flex-shrink-0" />}
        </div>
      ))}
    </div>
  );
}
