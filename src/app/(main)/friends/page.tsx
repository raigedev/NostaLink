import { getFriends, getPendingRequests } from "@/app/actions/friends";
import FriendsList from "@/components/friends/FriendsList";
import FriendRequest from "@/components/friends/FriendRequest";

export default async function FriendsPage() {
  const [friends, pending] = await Promise.all([getFriends(), getPendingRequests()]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">👥 Friends</h1>
      {pending.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3 text-gray-700">Pending Requests ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map((req) => (
              <FriendRequest key={req.id} request={req} />
            ))}
          </div>
        </div>
      )}
      <div>
        <h2 className="font-semibold mb-3 text-gray-700">My Friends ({friends.length})</h2>
        <FriendsList friends={friends} />
      </div>
    </div>
  );
}
