import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/app/actions/profile";
import EditProfileLayout from "@/components/profile/EditProfileLayout";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function EditProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfile(username);
  if (!profile || profile.id !== user.id) redirect(`/profile/${username}`);

  return (
    <div className="max-w-none">
      <EditProfileLayout profile={profile} />
    </div>
  );
}
