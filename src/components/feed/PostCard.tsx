"use client";

import Link from "next/link";
import type { Post } from "@/app/actions/posts";
import { formatRelativeTime } from "@/lib/utils";
import ReactionBar from "./ReactionBar";
import CommentSection from "./CommentSection";
import { useState } from "react";

interface Props {
  post: Post;
}

export default function PostCard({ post }: Props) {
  const [showComments, setShowComments] = useState(false);
  const author = post.author;

  return (
    <article className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Link href={`/profile/${author?.username ?? ""}`}>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-lg">
              👤
            </div>
          </Link>
          <div>
            <Link
              href={`/profile/${author?.username ?? ""}`}
              className="font-semibold text-gray-900 hover:text-indigo-600 text-sm"
            >
              {author?.display_name || author?.username || "Unknown"}
            </Link>
            <p className="text-xs text-gray-400">{formatRelativeTime(post.created_at)}</p>
          </div>
          <span className="ml-auto text-xs text-gray-400 capitalize">
            {post.privacy === "public" ? "🌍" : post.privacy === "friends" ? "👥" : "🔒"}
          </span>
        </div>
        <p className="text-gray-800 text-sm whitespace-pre-wrap break-words">{post.content}</p>
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {post.media_urls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt="Post media"
                className="w-full rounded-lg object-cover max-h-64"
              />
            ))}
          </div>
        )}
      </div>
      <div className="border-t border-gray-100 px-4 py-2">
        <ReactionBar postId={post.id} />
      </div>
      <div className="border-t border-gray-100 px-4 py-2 flex gap-4">
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-xs text-gray-500 hover:text-indigo-600 transition"
        >
          💬 Comments
        </button>
        <button className="text-xs text-gray-500 hover:text-indigo-600 transition">
          🔗 Share
        </button>
      </div>
      {showComments && (
        <div className="border-t border-gray-100 p-4">
          <CommentSection postId={post.id} />
        </div>
      )}
    </article>
  );
}
