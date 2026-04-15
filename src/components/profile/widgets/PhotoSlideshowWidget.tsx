"use client";

import { useState, useEffect } from "react";

const SAMPLE_PHOTOS = [
  "https://picsum.photos/seed/a/400/300",
  "https://picsum.photos/seed/b/400/300",
  "https://picsum.photos/seed/c/400/300",
];

interface Props {
  photos?: string[];
}

export default function PhotoSlideshowWidget({ photos }: Props) {
  const displayPhotos = photos && photos.length > 0 ? photos : SAMPLE_PHOTOS;
  const [index, setIndex] = useState(0);
  const safeIndex = displayPhotos.length > 0 ? index % displayPhotos.length : 0;

  useEffect(() => {
    if (displayPhotos.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % displayPhotos.length), 3000);
    return () => clearInterval(id);
  }, [displayPhotos]);

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border-color)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={displayPhotos[safeIndex]}
        alt={`Slide ${safeIndex + 1}`}
        className="w-full h-40 object-cover transition-opacity"
      />
      <div className="flex justify-center gap-1.5 p-2" style={{ backgroundColor: "var(--card-bg)" }}>
        {displayPhotos.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-2 h-2 rounded-full transition ${i === safeIndex ? "bg-indigo-600" : "bg-gray-300"}`}
          />
        ))}
      </div>
    </div>
  );
}
