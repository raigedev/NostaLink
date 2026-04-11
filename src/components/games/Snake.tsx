"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { submitScore } from "@/app/actions/games";

const CELL = 20;
const W = 20;
const H = 20;

type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Point = { x: number; y: number };

interface Props { gameId: string; }

export default function Snake({ gameId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  const snake = useRef<Point[]>([{ x: 10, y: 10 }]);
  const dir = useRef<Dir>("RIGHT");
  const nextDir = useRef<Dir>("RIGHT");
  const food = useRef<Point>({ x: 5, y: 5 });
  const scoreRef = useRef(0);
  const speed = useRef(150);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const randomFood = useCallback(() => {
    food.current = {
      x: Math.floor(Math.random() * W),
      y: Math.floor(Math.random() * H),
    };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, W * CELL, H * CELL);
    ctx.fillStyle = "#4ade80";
    snake.current.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? "#22c55e" : "#4ade80";
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
    });
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(food.current.x * CELL + CELL / 2, food.current.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const step = useCallback(() => {
    dir.current = nextDir.current;
    const head = { ...snake.current[0] };
    if (dir.current === "UP") head.y--;
    if (dir.current === "DOWN") head.y++;
    if (dir.current === "LEFT") head.x--;
    if (dir.current === "RIGHT") head.x++;

    if (head.x < 0 || head.x >= W || head.y < 0 || head.y >= H ||
      snake.current.some((s) => s.x === head.x && s.y === head.y)) {
      setGameOver(true);
      submitScore(gameId, scoreRef.current);
      return;
    }

    snake.current.unshift(head);
    if (head.x === food.current.x && head.y === food.current.y) {
      scoreRef.current += 10;
      setScore(scoreRef.current);
      randomFood();
      if (scoreRef.current % 50 === 0) speed.current = Math.max(60, speed.current - 10);
    } else {
      snake.current.pop();
    }
    draw();
    timerRef.current = setTimeout(step, speed.current);
  }, [draw, gameId, randomFood]);

  const start = useCallback(() => {
    snake.current = [{ x: 10, y: 10 }];
    dir.current = "RIGHT";
    nextDir.current = "RIGHT";
    scoreRef.current = 0;
    speed.current = 150;
    setScore(0);
    setGameOver(false);
    setStarted(true);
    randomFood();
    draw();
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(step, speed.current);
  }, [draw, randomFood, step]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: "UP", ArrowDown: "DOWN", ArrowLeft: "LEFT", ArrowRight: "RIGHT",
        w: "UP", s: "DOWN", a: "LEFT", d: "RIGHT",
      };
      const d = map[e.key];
      if (!d) return;
      const opposites: Record<Dir, Dir> = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };
      if (opposites[d] !== dir.current) nextDir.current = d;
      e.preventDefault();
    };
    window.addEventListener("keydown", handleKey);
    return () => { window.removeEventListener("keydown", handleKey); if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <span className="font-mono text-lg font-bold">Score: {score}</span>
        <button onClick={start} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition">
          {started ? "Restart" : "Start"}
        </button>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={W * CELL} height={H * CELL} className="border-4 border-green-500 rounded-lg" />
        {gameOver && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg">
            <p className="text-white text-2xl font-bold mb-2">Game Over!</p>
            <p className="text-green-400 text-lg mb-4">Score: {score}</p>
            <button onClick={start} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              Play Again
            </button>
          </div>
        )}
        {!started && !gameOver && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg">
            <p className="text-white text-xl font-bold mb-4">🐍 Snake</p>
            <p className="text-gray-300 text-sm mb-4">Use arrow keys or WASD</p>
            <button onClick={start} className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition">
              Start Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
