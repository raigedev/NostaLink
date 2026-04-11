interface MutualFriend {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Props { friends: MutualFriend[] }

export default function MutualFriends({ friends }: Props) {
  if (friends.length === 0) return null;
  return (
    <div className="flex items-center gap-1 text-xs text-gray-500">
      <span>👥</span>
      <span>{friends.length} mutual friend{friends.length !== 1 ? "s" : ""}</span>
    </div>
  );
}
