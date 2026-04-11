import { notFound } from "next/navigation";
import { getAlbum } from "@/app/actions/albums";
import PhotoLightbox from "@/components/albums/PhotoLightbox";

interface Props { params: Promise<{ id: string }> }

export default async function AlbumPage({ params }: Props) {
  const { id } = await params;
  const result = await getAlbum(id);
  if (!result) notFound();
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{result.album.name}</h1>
      {result.album.description && <p className="text-gray-500 mb-6">{result.album.description}</p>}
      <PhotoLightbox photos={result.photos} />
    </div>
  );
}
