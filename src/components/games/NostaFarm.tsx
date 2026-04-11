"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { submitScore } from "@/app/actions/games";

const GRID = 10;
const CELL = 48;

type PlantType = "wheat" | "corn" | "carrot";
type PlantState = { type: PlantType; planted: number; harvestAt: number };

const PLANTS: Record<PlantType, { emoji: string; growTime: number; coins: number; emoji_ready: string }> = {
  wheat: { emoji: "🌱", growTime: 10000, coins: 5, emoji_ready: "🌾" },
  corn: { emoji: "🌽", growTime: 20000, coins: 15, emoji_ready: "🌽" },
  carrot: { emoji: "🥕", growTime: 15000, coins: 10, emoji_ready: "🥕" },
};

interface Props { gameId: string; }

export default function NostaFarm({ gameId }: Props) {
  const [grid, setGrid] = useState<(PlantState | null)[][]>(
    Array.from({ length: GRID }, () => Array(GRID).fill(null))
  );
  const [coins, setCoins] = useState(50);
  const [selected, setSelected] = useState<PlantType>("wheat");
  const [tick, setTick] = useState(0);
  const coinsRef = useRef(50);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const handleCell = useCallback((r: number, c: number) => {
    const cell = grid[r][c];
    const now = Date.now();
    if (cell) {
      if (now >= cell.harvestAt) {
        const earned = PLANTS[cell.type].coins;
        coinsRef.current += earned;
        setCoins(coinsRef.current);
        setGrid((prev) => {
          const next = prev.map((row) => [...row]);
          next[r][c] = null;
          return next;
        });
        submitScore(gameId, coinsRef.current);
      }
      return;
    }
    if (coinsRef.current < 3) return;
    coinsRef.current -= 3;
    setCoins(coinsRef.current);
    const plant: PlantState = {
      type: selected,
      planted: now,
      harvestAt: now + PLANTS[selected].growTime,
    };
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = plant;
      return next;
    });
  }, [grid, gameId, selected]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4 flex-wrap justify-center">
        <span className="font-bold">💰 {coins} coins</span>
        {(Object.keys(PLANTS) as PlantType[]).map((p) => (
          <button
            key={p}
            onClick={() => setSelected(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              selected === p ? "bg-green-600 text-white" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {PLANTS[p].emoji_ready} {p} (+{PLANTS[p].coins}🪙, -3🪙)
          </button>
        ))}
      </div>
      <div
        className="grid border-2 border-green-600 rounded-lg overflow-hidden"
        style={{ gridTemplateColumns: `repeat(${GRID}, ${CELL}px)` }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const now = Date.now();
            const ready = cell && now >= cell.harvestAt;
            const progress = cell
              ? Math.min(100, ((now - cell.planted) / (cell.harvestAt - cell.planted)) * 100)
              : 0;
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCell(r, c)}
                className="flex flex-col items-center justify-center border border-green-200 hover:bg-green-50 transition"
                style={{ width: CELL, height: CELL, backgroundColor: ready ? "#fefce8" : "#f0fdf4" }}
              >
                {cell ? (
                  <>
                    <span className="text-lg">{ready ? PLANTS[cell.type].emoji_ready : PLANTS[cell.type].emoji}</span>
                    {!ready && (
                      <div className="w-8 h-1 bg-gray-200 rounded-full mt-0.5">
                        <div
                          className="h-1 bg-green-500 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-gray-300 text-xs">🟫</span>
                )}
              </button>
            );
          })
        )}
      </div>
      <p className="text-xs text-gray-500">Click empty soil to plant • Click grown crops to harvest</p>
      {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
      <span className="hidden">{tick}</span>
    </div>
  );
}
