import { getAlbums } from "@/app/actions/albums";
import AlbumGrid from "@/components/albums/AlbumGrid";
import Link from "next/link";

export default async function AlbumsPage() {
  const albums = await getAlbums();
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📷 Albums</h1>
      </div>
      <AlbumGrid albums={albums} />
    </div>
  );
}
