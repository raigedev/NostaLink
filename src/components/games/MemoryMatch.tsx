"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { submitScore } from "@/app/actions/games";

const EMOJIS = ["🐱", "🐶", "🦊", "🐸", "🐯", "🦁", "🐻", "🦄"];

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

interface Props { gameId: string; }

function makeCards(): Card[] {
  return [...EMOJIS, ...EMOJIS]
    .sort(() => Math.random() - 0.5)
    .map((emoji, id) => ({ id, emoji, flipped: false, matched: false }));
}

export default function MemoryMatch({ gameId }: Props) {
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [won, setWon] = useState(false);
  const [started, setStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const movesRef = useRef(0);
  const timeRef = useRef(0);

  const start = useCallback(() => {
    setCards(makeCards());
    setSelected([]);
    setMoves(0);
    setTime(0);
    setWon(false);
    setStarted(true);
    movesRef.current = 0;
    timeRef.current = 0;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      timeRef.current++;
      setTime(timeRef.current);
    }, 1000);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function flip(id: number) {
    if (!started || won) return;
    if (selected.length === 2) return;
    const card = cards[id];
    if (!card || card.flipped || card.matched) return;

    const newCards = cards.map((c) => c.id === id ? { ...c, flipped: true } : c);
    const newSelected = [...selected, id];
    setCards(newCards);
    setSelected(newSelected);

    if (newSelected.length === 2) {
      movesRef.current++;
      setMoves(movesRef.current);
      const [a, b] = newSelected.map((i) => newCards[i]);
      if (a.emoji === b.emoji) {
        const matched = newCards.map((c) =>
          c.id === a.id || c.id === b.id ? { ...c, matched: true } : c
        );
        setCards(matched);
        setSelected([]);
        if (matched.every((c) => c.matched)) {
          setWon(true);
          if (timerRef.current) clearInterval(timerRef.current);
          const score = Math.max(0, 1000 - movesRef.current * 10 - timeRef.current);
          submitScore(gameId, score);
        }
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => newSelected.includes(c.id) ? { ...c, flipped: false } : c)
          );
          setSelected([]);
        }, 800);
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-6">
        <span className="font-mono font-bold">Moves: {moves}</span>
        <span className="font-mono font-bold">Time: {time}s</span>
        <button onClick={start} className="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700 transition">
          {started ? "Restart" : "Start"}
        </button>
      </div>
      {won && (
        <div className="p-4 bg-green-100 text-green-800 rounded-xl text-center">
          <p className="text-xl font-bold">🎉 You won!</p>
          <p className="text-sm mt-1">Completed in {moves} moves and {time} seconds!</p>
        </div>
      )}
      {!started ? (
        <div className="text-center py-8">
          <p className="text-4xl mb-4">🃏</p>
          <p className="text-gray-600 mb-4">Match all the emoji pairs!</p>
          <button onClick={start} className="px-6 py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition">Start Game</button>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => flip(card.id)}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl text-2xl font-bold transition-all duration-200 ${
                card.flipped || card.matched
                  ? "bg-white border-2 border-pink-300 shadow"
                  : "bg-pink-500 hover:bg-pink-400 shadow"
              } ${card.matched ? "opacity-50" : ""}`}
            >
              {card.flipped || card.matched ? card.emoji : "?"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
