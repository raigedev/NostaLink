"use client";

import { useEffect, useState } from "react";
import type { Post } from "@/app/actions/posts";
import { createClient } from "@/lib/supabase/client";
import PostCard from "@/components/feed/PostCard";
import CreatePost from "@/components/feed/CreatePost";

interface Props { groupId: string }

export default function GroupFeed({ groupId }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("posts")
      .select("*, author:profiles!author_id(username, display_name, avatar_url)")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setPosts((data as Post[]) ?? []));
  }, [groupId]);

  return (
    <div className="space-y-4">
      <CreatePost />
      {posts.map((post) => <PostCard key={post.id} post={post} />)}
      {posts.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-3">📢</p>
          <p>No posts in this group yet. Start the conversation!</p>
        </div>
      )}
    </div>
  );
}
