"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getNotifications } from "@/app/actions/notifications";
import NotificationList from "./NotificationList";
import type { Notification } from "@/app/actions/notifications";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getNotifications(10).then(setNotifications);
    const supabase = createClient();
    let userId: string;
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      userId = data.user.id;
      const channel = supabase
        .channel(`notifications:${userId}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        }, (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        })
        .subscribe();
      return () => supabase.removeChannel(channel);
    });
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-3 font-semibold border-b border-gray-100 text-sm">Notifications</div>
          <NotificationList notifications={notifications} />
        </div>
      )}
    </div>
  );
}
