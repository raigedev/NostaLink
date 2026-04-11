"use client";

import { useState } from "react";
import type { Photo } from "@/app/actions/albums";

interface Props { photos: Photo[] }

export default function PhotoLightbox({ photos }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  if (photos.length === 0) {
    return <div className="text-center py-12 text-gray-400">No photos in this album.</div>;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            onClick={() => setSelected(i)}
            className="aspect-square overflow-hidden rounded-xl hover:opacity-90 transition"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt={photo.caption ?? `Photo ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      {selected !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="max-w-3xl w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[selected].url}
              alt={photos[selected].caption ?? "Photo"}
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
            {photos[selected].caption && (
              <p className="text-white text-center mt-3 text-sm">{photos[selected].caption}</p>
            )}
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => setSelected((s) => s !== null && s > 0 ? s - 1 : s)}
                disabled={selected === 0}
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 disabled:opacity-30"
              >
                ← Prev
              </button>
              <button
                onClick={() => setSelected((s) => s !== null && s < photos.length - 1 ? s + 1 : s)}
                disabled={selected === photos.length - 1}
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
