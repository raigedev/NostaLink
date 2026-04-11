"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function TopBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 h-14 flex items-center px-4 gap-4">
      <Link href="/" className="text-xl font-bold text-indigo-600 shrink-0">
        NostaLink
      </Link>
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people, posts, groups…"
          className="w-full px-4 py-1.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </form>
      <div className="flex items-center gap-3 ml-auto">
        <NotificationBell />
        <Link
          href="/profile"
          className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm hover:bg-indigo-200 transition"
        >
          👤
        </Link>
      </div>
    </header>
  );
}
