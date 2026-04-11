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

export default function PhotoSlideshowWidget({ photos = SAMPLE_PHOTOS }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (photos.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % photos.length), 3000);
    return () => clearInterval(id);
  }, [photos]);

  if (photos.length === 0) return null;

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border-color)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photos[index]}
        alt={`Slide ${index + 1}`}
        className="w-full h-40 object-cover transition-opacity"
      />
      <div className="flex justify-center gap-1.5 p-2" style={{ backgroundColor: "var(--card-bg)" }}>
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-2 h-2 rounded-full transition ${i === index ? "bg-indigo-600" : "bg-gray-300"}`}
          />
        ))}
      </div>
    </div>
  );
}
