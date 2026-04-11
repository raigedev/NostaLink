"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface Album {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Photo {
  id: string;
  album_id: string;
  user_id: string;
  url: string;
  caption: string | null;
  created_at: string;
}

export async function createAlbum(name: string, description?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("albums")
    .insert({ user_id: user.id, name, description })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/albums");
  return { album: data as Album };
}

export async function getAlbums(userId?: string): Promise<Album[]> {
  const supabase = await createClient();
  const uid = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return [];

  const { data } = await supabase
    .from("albums")
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });

  return (data as Album[]) ?? [];
}

export async function getAlbum(id: string): Promise<{ album: Album; photos: Photo[] } | null> {
  const supabase = await createClient();
  const [albumRes, photosRes] = await Promise.all([
    supabase.from("albums").select("*").eq("id", id).single(),
    supabase.from("photos").select("*").eq("album_id", id).order("created_at"),
  ]);

  if (!albumRes.data) return null;
  return { album: albumRes.data as Album, photos: (photosRes.data as Photo[]) ?? [] };
}

export async function uploadPhoto(albumId: string, url: string, caption?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("photos").insert({
    album_id: albumId,
    user_id: user.id,
    url,
    caption,
  });

  if (error) return { error: error.message };
  revalidatePath(`/albums/${albumId}`);
  return { success: true };
}

export async function deletePhoto(photoId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("photos")
    .delete()
    .eq("id", photoId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}
