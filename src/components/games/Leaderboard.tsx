"use client";

import { useEffect, useState } from "react";
import { getLeaderboard, type GameScore } from "@/app/actions/games";

interface Props { gameId: string; }

export default function Leaderboard({ gameId }: Props) {
  const [scores, setScores] = useState<GameScore[]>([]);

  useEffect(() => {
    getLeaderboard(gameId).then(setScores);
  }, [gameId]);

  if (scores.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-bold mb-3">🏆 Leaderboard</h3>
      <div className="space-y-2">
        {scores.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 text-sm">
            <span className="font-bold w-6 text-center text-gray-400">{i + 1}</span>
            <span className="flex-1">{s.profile?.display_name || s.profile?.username || "Player"}</span>
            <span className="font-mono font-bold text-indigo-600">{s.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
