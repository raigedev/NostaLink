import Link from "next/link";
import type { Group } from "@/app/actions/groups";

interface Props { group: Group }

export default function GroupCard({ group }: Props) {
  return (
    <Link
      href={`/groups/${group.id}`}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition"
    >
      <div className="h-24 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-4xl">
        {group.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
        ) : "🏘️"}
      </div>
      <div className="p-3">
        <p className="font-bold text-sm">{group.name}</p>
        {group.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{group.description}</p>}
      </div>
    </Link>
  );
}
