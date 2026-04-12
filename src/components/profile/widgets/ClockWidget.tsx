"use client";

import { useState, useEffect } from "react";

interface Props {
  style?: "digital" | "analog";
  timezone?: string;
}

export default function ClockWidget({ style = "digital", timezone = "UTC" }: Props) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const localeOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: timezone,
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone,
  };

  let timeStr: string;
  try {
    timeStr = time.toLocaleTimeString(undefined, localeOptions);
  } catch {
    timeStr = time.toLocaleTimeString();
  }

  let dateStr: string;
  try {
    dateStr = time.toLocaleDateString(undefined, dateOptions);
  } catch {
    dateStr = time.toLocaleDateString();
  }

  return (
    <div className="p-4 rounded-xl border text-center" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
      <p className="text-xs opacity-60 mb-1">🕐 Current Time{timezone !== "UTC" ? ` (${timezone})` : ""}</p>
      {style === "digital" ? (
        <p className="font-mono text-2xl font-bold tracking-widest">{timeStr}</p>
      ) : (
        <AnalogClock time={time} timezone={timezone} />
      )}
      <p className="text-xs opacity-60 mt-1">{dateStr}</p>
    </div>
  );
}

function AnalogClock({ time, timezone }: { time: Date; timezone: string }) {
  let h = time.getHours();
  let m = time.getMinutes();
  let s = time.getSeconds();

  try {
    const parts = Intl.DateTimeFormat("en", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
      timeZone: timezone,
    }).formatToParts(time);
    h = parseInt(parts.find((p) => p.type === "hour")?.value ?? String(h), 10);
    m = parseInt(parts.find((p) => p.type === "minute")?.value ?? String(m), 10);
    s = parseInt(parts.find((p) => p.type === "second")?.value ?? String(s), 10);
  } catch {
    // use local time
  }

  const secondDeg = s * 6;
  const minuteDeg = m * 6 + s * 0.1;
  const hourDeg = (h % 12) * 30 + m * 0.5;

  return (
    <div className="relative w-20 h-20 mx-auto my-2">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const x1 = 50 + 40 * Math.cos(angle);
          const y1 = 50 + 40 * Math.sin(angle);
          const x2 = 50 + 44 * Math.cos(angle);
          const y2 = 50 + 44 * Math.sin(angle);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="2" opacity="0.4" />;
        })}
        {/* Hour hand */}
        <line
          x1="50" y1="50"
          x2={50 + 28 * Math.cos((hourDeg - 90) * (Math.PI / 180))}
          y2={50 + 28 * Math.sin((hourDeg - 90) * (Math.PI / 180))}
          stroke="currentColor" strokeWidth="3" strokeLinecap="round"
        />
        {/* Minute hand */}
        <line
          x1="50" y1="50"
          x2={50 + 36 * Math.cos((minuteDeg - 90) * (Math.PI / 180))}
          y2={50 + 36 * Math.sin((minuteDeg - 90) * (Math.PI / 180))}
          stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        />
        {/* Second hand */}
        <line
          x1="50" y1="50"
          x2={50 + 40 * Math.cos((secondDeg - 90) * (Math.PI / 180))}
          y2={50 + 40 * Math.sin((secondDeg - 90) * (Math.PI / 180))}
          stroke="red" strokeWidth="1" strokeLinecap="round"
        />
        <circle cx="50" cy="50" r="3" fill="currentColor" />
      </svg>
    </div>
  );
}
