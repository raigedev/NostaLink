"use client";

import { useState, useEffect, useCallback } from "react";
import { submitScore } from "@/app/actions/games";

interface Question {
  q: string;
  options: string[];
  answer: number;
}

const QUESTIONS: Question[] = [
  { q: "What year was Friendster founded?", options: ["2001", "2002", "2003", "2004"], answer: 1 },
  { q: "What does HTML stand for?", options: ["HyperText Markup Language", "High Tech ML", "HyperText Media Language", "Hyper Transfer ML"], answer: 0 },
  { q: "Who created Facebook?", options: ["Steve Jobs", "Bill Gates", "Mark Zuckerberg", "Jack Dorsey"], answer: 2 },
  { q: "What was MySpace's most famous feature?", options: ["Stories", "Profile customization", "Reels", "Shorts"], answer: 1 },
  { q: "What programming language powers most web browsers?", options: ["Python", "Ruby", "Java", "JavaScript"], answer: 3 },
  { q: "What year did YouTube launch?", options: ["2003", "2004", "2005", "2006"], answer: 2 },
  { q: "What does CSS stand for?", options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style System", "Coded Style Sets"], answer: 1 },
  { q: "What was the first widely-used web browser?", options: ["Firefox", "Mosaic", "Internet Explorer", "Opera"], answer: 1 },
  { q: "Which emoji was the first to be added to Unicode?", options: ["😂", "❤️", "😀", "🙂"], answer: 2 },
  { q: "What does URL stand for?", options: ["Uniform Resource Locator", "Universal Remote Link", "Unified Registry Link", "User Reference Locator"], answer: 0 },
];

interface Props { gameId: string; }

export default function TriviaArena({ gameId }: Props) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);

  const next = useCallback(() => {
    setSelected(null);
    setTimeLeft(15);
    if (index + 1 >= QUESTIONS.length) {
      setFinished(true);
      submitScore(gameId, score);
    } else {
      setIndex(index + 1);
    }
  }, [index, score, gameId]);

  useEffect(() => {
    if (!started || finished || selected !== null) return;
    if (timeLeft <= 0) { next(); return; }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [started, finished, selected, timeLeft, next]);

  function answer(i: number) {
    if (selected !== null) return;
    setSelected(i);
    if (i === QUESTIONS[index].answer) {
      const pts = timeLeft * 10;
      setScore((s) => s + pts);
    }
    setTimeout(next, 1200);
  }

  function start() {
    setIndex(0);
    setScore(0);
    setSelected(null);
    setTimeLeft(15);
    setFinished(false);
    setStarted(true);
  }

  if (!started) {
    return (
      <div className="text-center py-12">
        <p className="text-5xl mb-4">🧠</p>
        <h2 className="text-2xl font-bold mb-2">Trivia Arena</h2>
        <p className="text-gray-500 mb-6">10 questions • 15 seconds each • Score = time × 10</p>
        <button onClick={start} className="px-8 py-3 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-700 transition">
          Start Quiz
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="text-center py-12">
        <p className="text-5xl mb-4">🏆</p>
        <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
        <p className="text-3xl font-bold text-purple-600 mb-4">{score} points</p>
        <button onClick={start} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition">
          Play Again
        </button>
      </div>
    );
  }

  const q = QUESTIONS[index];

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Question {index + 1}/{QUESTIONS.length}</span>
        <span className="font-bold text-purple-600">Score: {score}</span>
        <span className={`font-mono font-bold text-lg ${timeLeft <= 5 ? "text-red-500" : "text-gray-700"}`}>
          ⏱ {timeLeft}s
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full">
        <div
          className="h-2 bg-purple-500 rounded-full transition-all"
          style={{ width: `${((index) / QUESTIONS.length) * 100}%` }}
        />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="font-semibold text-lg mb-4">{q.q}</p>
        <div className="grid grid-cols-1 gap-2">
          {q.options.map((opt, i) => {
            let bg = "bg-gray-50 hover:bg-gray-100 border-gray-200";
            if (selected !== null) {
              if (i === q.answer) bg = "bg-green-100 border-green-500";
              else if (i === selected) bg = "bg-red-100 border-red-400";
            }
            return (
              <button
                key={i}
                onClick={() => answer(i)}
                disabled={selected !== null}
                className={`p-3 rounded-xl border-2 text-left text-sm font-medium transition ${bg}`}
              >
                {String.fromCharCode(65 + i)}. {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
