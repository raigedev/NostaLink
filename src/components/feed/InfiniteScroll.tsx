"use client";

import { useEffect, useRef, useCallback } from "react";

interface Props {
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  children: React.ReactNode;
}

export default function InfiniteScroll({ onLoadMore, hasMore, loading, children }: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(handleIntersect, { threshold: 0.1 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersect]);

  return (
    <div>
      {children}
      <div ref={sentinelRef} className="h-4" />
      {loading && (
        <div className="flex justify-center py-4">
          <div
            className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full"
            style={{ animation: "spin 0.8s linear infinite" }}
          />
        </div>
      )}
      {!hasMore && !loading && (
        <p className="text-center text-gray-400 text-sm py-4">
          You&apos;ve reached the end ✨
        </p>
      )}
    </div>
  );
}
