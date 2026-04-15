"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const SAMPLE_PHOTOS = [
  "https://picsum.photos/seed/a/400/300",
  "https://picsum.photos/seed/b/400/300",
  "https://picsum.photos/seed/c/400/300",
];

const TRANSITION_DURATION = 350; // ms

// Blurred ambient backdrop visual constants (Fit mode)
const BACKDROP_BLUR = "16px";
const BACKDROP_BRIGHTNESS = 0.55;
const BACKDROP_SCALE = 1.15;

interface Props {
  photos?: string[];
  transition?: "fade" | "slide" | "none";
  interval?: "slow" | "normal" | "fast";
  displayMode?: "fill" | "fit";
}

export default function PhotoSlideshowWidget({
  photos,
  transition = "fade",
  interval = "normal",
  displayMode = "fill",
}: Props) {
  const displayPhotos = photos && photos.length > 0 ? photos : SAMPLE_PHOTOS;
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  // Stable background src — updated only after a transition completes so the
  // widget stage stays opaque (no profile-page background flash).
  const [bgSrc, setBgSrc] = useState(displayPhotos[0]);
  const indexRef = useRef(0);
  const transitioningRef = useRef(false);
  // Keep a ref to the latest displayPhotos array so goTo can read current srcs
  // without adding displayPhotos to the useCallback dependency array.
  const displayPhotosRef = useRef(displayPhotos);
  displayPhotosRef.current = displayPhotos;
  const safeIndex = displayPhotos.length > 0 ? index % displayPhotos.length : 0;

  const intervalMs = interval === "slow" ? 5000 : interval === "fast" ? 1500 : 3000;

  const goTo = useCallback((next: number) => {
    if (next === indexRef.current || transitioningRef.current) return;
    if (transition === "none") {
      indexRef.current = next;
      setIndex(next);
      setBgSrc(displayPhotosRef.current[next]);
    } else {
      transitioningRef.current = true;
      setVisible(false);
      setTimeout(() => {
        indexRef.current = next;
        setIndex(next);
        // Update bgSrc only after the transition completes so the stable base
        // layer stays on the old image throughout the fade-out, preventing any
        // flash of the profile-page background.
        setBgSrc(displayPhotosRef.current[next]);
        setVisible(true);
        transitioningRef.current = false;
      }, TRANSITION_DURATION);
    }
  }, [transition]);

  useEffect(() => {
    if (displayPhotos.length <= 1) return;
    const id = setInterval(() => {
      const next = (indexRef.current + 1) % displayPhotos.length;
      goTo(next);
    }, intervalMs);
    return () => clearInterval(id);
  }, [displayPhotos.length, intervalMs, goTo]);

  const imgStyle: React.CSSProperties =
    transition === "none"
      ? {}
      : {
          opacity: visible ? 1 : 0,
          transform:
            transition === "slide"
              ? visible
                ? "translateX(0)"
                : "translateX(-20px)"
              : undefined,
          transition: `opacity ${TRANSITION_DURATION}ms ease${
            transition === "slide" ? `, transform ${TRANSITION_DURATION}ms ease` : ""
          }`,
        };

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border-color)" }}>
      {displayMode === "fill" ? (
        /* ── Fill mode: image covers the full widget area ── */
        <div className="relative w-full h-48 overflow-hidden">
          {/* Stable base layer — always opaque, prevents background flash during transitions */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bgSrc}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Animated top layer — crossfades to the new image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayPhotos[safeIndex]}
            alt={`Slide ${safeIndex + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
            style={imgStyle}
          />
          {/* Dot indicators overlaid at the bottom of the image */}
          {displayPhotos.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
              {displayPhotos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`w-2 h-2 rounded-full transition ${i === safeIndex ? "bg-white" : "bg-white/40"}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── Fit mode: whole image visible inside a styled stage ── */
        <>
          <div className="relative w-full h-48 overflow-hidden bg-black">
            {/* Blurred ambient backdrop — stays opaque so the stage never goes transparent */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bgSrc}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: `blur(${BACKDROP_BLUR}) brightness(${BACKDROP_BRIGHTNESS})`, transform: `scale(${BACKDROP_SCALE})` }}
            />
            {/* Main image — full visibility with smooth transitions */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayPhotos[safeIndex]}
              alt={`Slide ${safeIndex + 1}`}
              className="absolute inset-0 w-full h-full object-contain"
              style={{ ...imgStyle, filter: "drop-shadow(0 2px 16px rgba(0,0,0,0.4))" }}
            />
          </div>
          {displayPhotos.length > 1 && (
            <div className="flex justify-center gap-1.5 p-2" style={{ backgroundColor: "var(--card-bg)" }}>
              {displayPhotos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`w-2 h-2 rounded-full transition ${i === safeIndex ? "bg-indigo-600" : "bg-gray-300"}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
