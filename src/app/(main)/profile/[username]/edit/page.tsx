import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/app/actions/profile";
import ProfileEditor from "@/components/profile/ProfileEditor";

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
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      <ProfileEditor profile={profile} />
    </div>
  );
}
