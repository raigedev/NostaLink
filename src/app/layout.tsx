import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NostaLink – Your Digital Home",
  description:
    "NostaLink is a nostalgic social network combining the best of Friendster and early Facebook. Express yourself with custom themes, play games, and reconnect with old friends.",
  keywords: ["social network", "nostalgia", "friends", "profile", "games"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
