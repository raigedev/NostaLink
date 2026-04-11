"use client";

interface Props {
  count: number;
}

export default function HitCounterWidget({ count }: Props) {
  const digits = String(count).padStart(6, "0").split("");
  return (
    <div className="flex flex-col items-center">
      <p className="text-xs opacity-60 mb-1">Profile Views</p>
      <div className="retro-counter">
        {digits.map((d, i) => (
          <span key={i} className="retro-digit">{d}</span>
        ))}
      </div>
    </div>
  );
}
