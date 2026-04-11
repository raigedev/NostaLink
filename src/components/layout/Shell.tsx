"use client";

import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import RightSidebar from "./RightSidebar";
import BottomNav from "./BottomNav";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <div className="flex pt-14 max-w-7xl mx-auto px-2 md:px-4 gap-4">
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="fixed top-14 w-56 h-[calc(100vh-3.5rem)] overflow-y-auto pt-4 pb-20">
            <Sidebar />
          </div>
        </aside>
        <main className="flex-1 min-w-0 py-4 pb-20 md:pb-4">{children}</main>
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="fixed top-14 w-72 h-[calc(100vh-3.5rem)] overflow-y-auto pt-4 pb-4">
            <RightSidebar />
          </div>
        </aside>
      </div>
      <BottomNav />
    </div>
  );
}
