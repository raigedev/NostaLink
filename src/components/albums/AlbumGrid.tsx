import Link from "next/link";
import type { Album } from "@/app/actions/albums";
import { formatDate } from "@/lib/utils";

interface Props { albums: Album[] }

export default function AlbumGrid({ albums }: Props) {
  if (albums.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-4xl mb-4">📷</p>
        <p>No albums yet.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {albums.map((album) => (
        <Link
          key={album.id}
          href={`/albums/${album.id}`}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition"
        >
          <div className="h-24 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-3xl">
            📷
          </div>
          <div className="p-3">
            <p className="font-medium text-sm">{album.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(album.created_at)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
