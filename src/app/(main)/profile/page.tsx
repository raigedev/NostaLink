import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileRedirectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (error) console.error("Failed to fetch profile for redirect:", error.message);

  if (profile?.username) redirect(`/profile/${profile.username}`);

  redirect("/feed");
}