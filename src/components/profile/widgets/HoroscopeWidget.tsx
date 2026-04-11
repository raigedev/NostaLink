"use client";

import { useState } from "react";

const signs = [
  { name: "Aries", dates: "Mar 21 – Apr 19", symbol: "♈", message: "Your energy is unstoppable today. Take charge!" },
  { name: "Taurus", dates: "Apr 20 – May 20", symbol: "♉", message: "Patience and persistence will bring rewards." },
  { name: "Gemini", dates: "May 21 – Jun 20", symbol: "♊", message: "Communication flows easily. Share your ideas!" },
  { name: "Cancer", dates: "Jun 21 – Jul 22", symbol: "♋", message: "Trust your intuition. Home is where the heart is." },
  { name: "Leo", dates: "Jul 23 – Aug 22", symbol: "♌", message: "Shine bright! The spotlight is yours today." },
  { name: "Virgo", dates: "Aug 23 – Sep 22", symbol: "♍", message: "Details matter. Your attention to them pays off." },
  { name: "Libra", dates: "Sep 23 – Oct 22", symbol: "♎", message: "Balance and harmony guide your choices today." },
  { name: "Scorpio", dates: "Oct 23 – Nov 21", symbol: "♏", message: "Deep feelings surface. Transformation is near." },
  { name: "Sagittarius", dates: "Nov 22 – Dec 21", symbol: "♐", message: "Adventure calls! Follow your sense of wonder." },
  { name: "Capricorn", dates: "Dec 22 – Jan 19", symbol: "♑", message: "Steady progress. Your hard work is recognized." },
  { name: "Aquarius", dates: "Jan 20 – Feb 18", symbol: "♒", message: "Innovation sparks. Think outside the box today." },
  { name: "Pisces", dates: "Feb 19 – Mar 20", symbol: "♓", message: "Dreams feel vivid. Creative inspiration abounds." },
];

export default function HoroscopeWidget() {
  const [selected, setSelected] = useState(0);
  const sign = signs[selected];

  return (
    <div className="p-4 rounded-xl border" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
      <p className="text-xs opacity-60 mb-2 text-center">✨ Daily Horoscope</p>
      <select
        value={selected}
        onChange={(e) => setSelected(Number(e.target.value))}
        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg mb-3 bg-transparent"
      >
        {signs.map((s, i) => (
          <option key={s.name} value={i}>{s.symbol} {s.name}</option>
        ))}
      </select>
      <div className="text-center">
        <p className="text-3xl mb-1">{sign.symbol}</p>
        <p className="font-bold text-sm">{sign.name}</p>
        <p className="text-xs opacity-60 mb-2">{sign.dates}</p>
        <p className="text-sm italic">&ldquo;{sign.message}&rdquo;</p>
      </div>
    </div>
  );
}
