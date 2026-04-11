import { notFound } from "next/navigation";
import { getGroup } from "@/app/actions/groups";
import GroupFeed from "@/components/groups/GroupFeed";

interface Props { params: Promise<{ id: string }> }

export default async function GroupPage({ params }: Props) {
  const { id } = await params;
  const group = await getGroup(id);
  if (!group) notFound();
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{group.name}</h1>
      {group.description && <p className="text-gray-500 mb-6">{group.description}</p>}
      <GroupFeed groupId={group.id} />
    </div>
  );
}
