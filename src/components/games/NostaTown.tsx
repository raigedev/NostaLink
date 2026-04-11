"use client";

import { useState, useRef, useCallback } from "react";
import { submitScore } from "@/app/actions/games";

const GRID = 8;

type BuildingType = "house" | "shop" | "park" | "factory";
type Cell = BuildingType | null;

const BUILDINGS: Record<BuildingType, { emoji: string; cost: number; revenue: number; label: string }> = {
  house: { emoji: "🏠", cost: 50, revenue: 5, label: "House" },
  shop: { emoji: "🏪", cost: 100, revenue: 15, label: "Shop" },
  park: { emoji: "🌳", cost: 30, revenue: 2, label: "Park" },
  factory: { emoji: "🏭", cost: 200, revenue: 40, label: "Factory" },
};

interface Props { gameId: string; }

export default function NostaTown({ gameId }: Props) {
  const [grid, setGrid] = useState<Cell[][]>(Array.from({ length: GRID }, () => Array(GRID).fill(null)));
  const [coins, setCoins] = useState(300);
  const [selected, setSelected] = useState<BuildingType>("house");
  const coinsRef = useRef(300);

  const place = useCallback((r: number, c: number) => {
    if (grid[r][c]) return;
    const b = BUILDINGS[selected];
    if (coinsRef.current < b.cost) return;
    coinsRef.current -= b.cost;
    setCoins(coinsRef.current);
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = selected;
      return next;
    });
  }, [grid, selected]);

  function collect() {
    let total = 0;
    grid.forEach((row) => row.forEach((cell) => { if (cell) total += BUILDINGS[cell].revenue; }));
    coinsRef.current += total;
    setCoins(coinsRef.current);
    submitScore(gameId, coinsRef.current);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4 flex-wrap justify-center">
        <span className="font-bold">💰 {coins} coins</span>
        <button
          onClick={collect}
          className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition"
        >
          Collect Revenue
        </button>
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        {(Object.keys(BUILDINGS) as BuildingType[]).map((b) => (
          <button
            key={b}
            onClick={() => setSelected(b)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              selected === b ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {BUILDINGS[b].emoji} {BUILDINGS[b].label} (${BUILDINGS[b].cost})
          </button>
        ))}
      </div>
      <div
        className="grid gap-0.5 bg-green-100 p-2 rounded-xl"
        style={{ gridTemplateColumns: `repeat(${GRID}, 52px)` }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => place(r, c)}
              className="w-12 h-12 flex items-center justify-center rounded-lg text-2xl transition hover:bg-white/50"
              style={{ backgroundColor: cell ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.05)" }}
              title={cell ? BUILDINGS[cell].label : `Place ${BUILDINGS[selected].label}`}
            >
              {cell ? BUILDINGS[cell].emoji : ""}
            </button>
          ))
        )}
      </div>
      <p className="text-xs text-gray-500">Click empty lots to build • Collect revenue to earn coins</p>
    </div>
  );
}
