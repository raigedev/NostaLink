"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  activeMatch?: (pathname: string) => boolean;
}

const navItems: NavItem[] = [
  { href: "/feed", label: "Home", icon: "🏠" },
  {
    href: "/profile",
    label: "Profile",
    icon: "👤",
    activeMatch: (p) =>
      p === "/profile" ||
      (p.startsWith("/profile/") && !p.endsWith("/edit")),
  },
  {
    href: "/profile/edit",
    label: "Edit Profile",
    icon: "✏️",
    activeMatch: (p) => p.startsWith("/profile/") && p.endsWith("/edit"),
  },
  { href: "/friends", label: "Friends", icon: "👥" },
  { href: "/games", label: "Games", icon: "🎮" },
  { href: "/surveys", label: "Surveys", icon: "📊" },
  { href: "/chat", label: "Chat", icon: "💬" },
  { href: "/groups", label: "Groups", icon: "🏘️" },
  { href: "/albums", label: "Albums", icon: "📷" },
  { href: "/notifications", label: "Notifications", icon: "🔔" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive = item.activeMatch
          ? item.activeMatch(pathname)
          : pathname === item.href ||
            (item.href !== "/feed" && pathname.startsWith(item.href + "/"));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
