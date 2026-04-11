import { getFeedPosts } from "@/app/actions/posts";
import CreatePost from "@/components/feed/CreatePost";
import PostCard from "@/components/feed/PostCard";

export default async function HomePage() {
  const posts = await getFeedPosts(20, 0);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <CreatePost />
      {posts.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-4">👋</p>
          <p className="text-lg font-medium">Welcome to NostaLink!</p>
          <p className="text-sm mt-2">Be the first to post something.</p>
        </div>
      )}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
