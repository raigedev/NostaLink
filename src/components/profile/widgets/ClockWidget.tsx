"use client";

import { useState, useEffect } from "react";

export default function ClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 rounded-xl border text-center" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
      <p className="text-xs opacity-60 mb-1">🕐 Current Time</p>
      <p className="font-mono text-2xl font-bold tracking-widest">
        {time.toLocaleTimeString()}
      </p>
      <p className="text-xs opacity-60 mt-1">{time.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
    </div>
  );
}
