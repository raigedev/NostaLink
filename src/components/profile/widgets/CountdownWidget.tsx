"use client";

import { useState, useEffect } from "react";

interface Props {
  targetDate?: string;
  label?: string;
}

export default function CountdownWidget({ targetDate = "2026-01-01", label = "New Year" }: Props) {
  const [diff, setDiff] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    function update() {
      const target = new Date(targetDate).getTime();
      const now = Date.now();
      const total = Math.max(0, target - now);
      setDiff({
        d: Math.floor(total / 86400000),
        h: Math.floor((total % 86400000) / 3600000),
        m: Math.floor((total % 3600000) / 60000),
        s: Math.floor((total % 60000) / 1000),
      });
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return (
    <div className="p-4 rounded-xl border text-center" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
      <p className="text-xs opacity-60 mb-2">⏳ Countdown to {label}</p>
      <div className="flex justify-center gap-2 font-mono text-lg font-bold">
        {[["d", diff.d], ["h", diff.h], ["m", diff.m], ["s", diff.s]].map(([unit, val]) => (
          <div key={String(unit)} className="flex flex-col items-center">
            <span className="text-2xl">{String(val).padStart(2, "0")}</span>
            <span className="text-xs opacity-50 uppercase">{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
