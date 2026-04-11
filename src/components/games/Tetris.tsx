"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { submitScore } from "@/app/actions/games";

const COLS = 10;
const ROWS = 20;
const BLOCK = 25;

const SHAPES = [
  [[1,1,1,1]],
  [[1,1],[1,1]],
  [[0,1,0],[1,1,1]],
  [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]],
  [[1,1,0],[0,1,1]],
  [[0,1,1],[1,1,0]],
];
const COLORS = ["#00f0f0","#f0f000","#a000f0","#0000f0","#f0a000","#00f000","#f00000"];

type Board = (string | null)[][];
type Piece = { x: number; y: number; shape: number[][]; color: string };

interface Props { gameId: string; }

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function rotate(s: number[][]): number[][] {
  return s[0].map((_, i) => s.map((r) => r[i]).reverse());
}

function fits(board: Board, p: Piece, dx = 0, dy = 0, s?: number[][]): boolean {
  const shape = s ?? p.shape;
  return shape.every((row, r) =>
    row.every((cell, c) => {
      if (!cell) return true;
      const nx = p.x + c + dx;
      const ny = p.y + r + dy;
      return nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !board[ny]?.[nx];
    })
  );
}

export default function Tetris({ gameId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<Board>(emptyBoard());
  const pieceRef = useRef<Piece | null>(null);
  const scoreRef = useRef(0);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const newPiece = useCallback((): Piece => {
    const i = Math.floor(Math.random() * SHAPES.length);
    return { x: 3, y: 0, shape: SHAPES[i], color: COLORS[i] };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, COLS * BLOCK, ROWS * BLOCK);
    boardRef.current.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (cell) {
          ctx.fillStyle = cell;
          ctx.fillRect(c * BLOCK + 1, r * BLOCK + 1, BLOCK - 2, BLOCK - 2);
        }
      })
    );
    const p = pieceRef.current;
    if (p) {
      ctx.fillStyle = p.color;
      p.shape.forEach((row, r) =>
        row.forEach((cell, c) => {
          if (cell) ctx.fillRect((p.x + c) * BLOCK + 1, (p.y + r) * BLOCK + 1, BLOCK - 2, BLOCK - 2);
        })
      );
    }
  }, []);

  const lock = useCallback(() => {
    const p = pieceRef.current;
    if (!p) return;
    p.shape.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (cell) boardRef.current[p.y + r][p.x + c] = p.color;
      })
    );
    let cleared = 0;
    boardRef.current = boardRef.current.filter((row) => {
      if (row.every((c) => c !== null)) { cleared++; return false; }
      return true;
    });
    while (boardRef.current.length < ROWS) boardRef.current.unshift(Array(COLS).fill(null));
    if (cleared) {
      const pts = [0, 100, 300, 500, 800][cleared] ?? 800;
      scoreRef.current += pts;
      setScore(scoreRef.current);
      setLevel(Math.floor(scoreRef.current / 500) + 1);
    }
    const next = newPiece();
    if (!fits(boardRef.current, next)) {
      setGameOver(true);
      submitScore(gameId, scoreRef.current);
      return;
    }
    pieceRef.current = next;
  }, [gameId, newPiece]);

  const step = useCallback(() => {
    const p = pieceRef.current;
    if (!p) return;
    if (fits(boardRef.current, p, 0, 1)) {
      pieceRef.current = { ...p, y: p.y + 1 };
    } else {
      lock();
    }
    draw();
    const lv = Math.floor(scoreRef.current / 500) + 1;
    timerRef.current = setTimeout(step, Math.max(100, 600 - lv * 50));
  }, [draw, lock]);

  const start = useCallback(() => {
    boardRef.current = emptyBoard();
    scoreRef.current = 0;
    setScore(0);
    setLevel(1);
    setGameOver(false);
    setStarted(true);
    pieceRef.current = newPiece();
    draw();
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(step, 600);
  }, [draw, newPiece, step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const p = pieceRef.current;
      if (!p) return;
      if (e.key === "ArrowLeft" && fits(boardRef.current, p, -1, 0)) {
        pieceRef.current = { ...p, x: p.x - 1 };
      } else if (e.key === "ArrowRight" && fits(boardRef.current, p, 1, 0)) {
        pieceRef.current = { ...p, x: p.x + 1 };
      } else if (e.key === "ArrowDown") {
        if (fits(boardRef.current, p, 0, 1)) pieceRef.current = { ...p, y: p.y + 1 };
        else lock();
      } else if (e.key === "ArrowUp" || e.key === "x") {
        const r = rotate(p.shape);
        if (fits(boardRef.current, p, 0, 0, r)) pieceRef.current = { ...p, shape: r };
      } else if (e.key === " ") {
        let dy = 0;
        while (fits(boardRef.current, p, 0, dy + 1)) dy++;
        pieceRef.current = { ...p, y: p.y + dy };
        lock();
      }
      draw();
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); if (timerRef.current) clearTimeout(timerRef.current); };
  }, [draw, lock]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-6">
        <span className="font-mono font-bold">Score: {score}</span>
        <span className="font-mono font-bold">Level: {level}</span>
        <button onClick={start} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
          {started ? "Restart" : "Start"}
        </button>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={COLS * BLOCK} height={ROWS * BLOCK} className="border-4 border-indigo-500 rounded-lg" />
        {gameOver && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg">
            <p className="text-white text-2xl font-bold mb-2">Game Over!</p>
            <p className="text-indigo-400 text-lg mb-4">Score: {score}</p>
            <button onClick={start} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Play Again</button>
          </div>
        )}
        {!started && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg">
            <p className="text-white text-xl font-bold mb-2">🟦 Tetris</p>
            <p className="text-gray-300 text-xs mb-4">Arrow keys to move • X/↑ rotate • Space drop</p>
            <button onClick={start} className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition">Start Game</button>
          </div>
        )}
      </div>
    </div>
  );
}
