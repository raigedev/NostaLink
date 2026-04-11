import Link from "next/link";

interface ProfileData {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Friend {
  id: string;
  requester_id: string;
  addressee_id: string;
  requester?: ProfileData | ProfileData[] | null;
  addressee?: ProfileData | ProfileData[] | null;
}

function getProfile(p: ProfileData | ProfileData[] | null | undefined): ProfileData | null {
  if (!p) return null;
  if (Array.isArray(p)) return p[0] ?? null;
  return p;
}

interface Props { friends: Friend[] }

export default function FriendsList({ friends }: Props) {
  if (friends.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p className="text-3xl mb-3">👥</p>
        <p>No friends yet. Start connecting!</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {friends.map((f) => {
        const profile = getProfile(f.requester) ?? getProfile(f.addressee);
        if (!profile) return null;
        return (
          <Link
            key={f.id}
            href={`/profile/${profile.username}`}
            className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center gap-2 hover:shadow-md transition"
          >
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-2xl overflow-hidden">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : "👤"}
            </div>
            <p className="font-medium text-sm text-center">{profile.display_name || profile.username}</p>
            <p className="text-xs text-gray-400">@{profile.username}</p>
          </Link>
        );
      })}
    </div>
  );
}
