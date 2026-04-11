import { getGroups } from "@/app/actions/groups";
import GroupCard from "@/components/groups/GroupCard";
import Link from "next/link";

export default async function GroupsPage() {
  const groups = await getGroups();
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🏘️ Groups</h1>
        <Link href="/groups/create" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
          Create Group
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
}
