"use client";

import { useState, useEffect } from "react";
import { submitScore } from "@/app/actions/games";

type PetType = "cat" | "dog" | "bunny";

interface Pet {
  id: number;
  name: string;
  type: PetType;
  happiness: number;
  hunger: number;
}

const PET_EMOJIS: Record<PetType, string> = { cat: "🐱", dog: "🐶", bunny: "🐰" };
const PET_NAMES = ["Fluffy", "Bubbles", "Sparkle", "Cookie", "Mochi"];

interface Props { gameId: string; }

export default function BuddyPets({ gameId }: Props) {
  const [pets, setPets] = useState<Pet[]>([
    { id: 1, name: "Fluffy", type: "cat", happiness: 70, hunger: 60 },
    { id: 2, name: "Bubbles", type: "dog", happiness: 80, hunger: 40 },
  ]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPets((prev) =>
        prev.map((p) => ({
          ...p,
          happiness: Math.max(0, p.happiness - 2),
          hunger: Math.max(0, p.hunger - 3),
        }))
      );
    }, 3000);
    return () => clearInterval(id);
  }, []);

  function feed(petId: number) {
    setPets((prev) =>
      prev.map((p) =>
        p.id === petId ? { ...p, hunger: Math.min(100, p.hunger + 30) } : p
      )
    );
  }

  function play(petId: number) {
    setPets((prev) =>
      prev.map((p) =>
        p.id === petId ? { ...p, happiness: Math.min(100, p.happiness + 25) } : p
      )
    );
    const total = pets.reduce((s, p) => s + p.happiness, 0);
    const newScore = Math.floor(total / pets.length);
    setScore(newScore);
    submitScore(gameId, newScore);
  }

  function adopt(type: PetType) {
    const name = PET_NAMES[Math.floor(Math.random() * PET_NAMES.length)];
    setPets((prev) => [...prev, { id: Date.now(), name, type, happiness: 80, hunger: 80 }]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">🐾 My Pets</h3>
        <span className="font-mono text-sm">Happiness Score: {score}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {pets.map((pet) => (
          <div key={pet.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{PET_EMOJIS[pet.type]}</span>
              <div>
                <p className="font-bold">{pet.name}</p>
                <p className="text-xs text-gray-500 capitalize">{pet.type}</p>
              </div>
            </div>
            <div className="space-y-2 mb-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>😊 Happiness</span>
                  <span>{pet.happiness}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-pink-500 rounded-full transition-all" style={{ width: `${pet.happiness}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>🍖 Fullness</span>
                  <span>{pet.hunger}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-orange-500 rounded-full transition-all" style={{ width: `${pet.hunger}%` }} />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => feed(pet.id)} className="flex-1 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition">
                🍗 Feed
              </button>
              <button onClick={() => play(pet.id)} className="flex-1 py-1.5 bg-pink-500 text-white rounded-lg text-xs font-medium hover:bg-pink-600 transition">
                🎾 Play
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="font-semibold mb-3 text-sm">Adopt a new pet:</p>
        <div className="flex gap-2">
          {(["cat", "dog", "bunny"] as PetType[]).map((t) => (
            <button
              key={t}
              onClick={() => adopt(t)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition"
            >
              {PET_EMOJIS[t]} {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
