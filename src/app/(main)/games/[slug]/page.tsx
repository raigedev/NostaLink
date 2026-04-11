import { notFound } from "next/navigation";
import { getGames } from "@/app/actions/games";
import Snake from "@/components/games/Snake";
import Tetris from "@/components/games/Tetris";
import MemoryMatch from "@/components/games/MemoryMatch";
import NostaFarm from "@/components/games/NostaFarm";
import NostaTown from "@/components/games/NostaTown";
import BuddyPets from "@/components/games/BuddyPets";
import TriviaArena from "@/components/games/TriviaArena";

interface Props {
  params: Promise<{ slug: string }>;
}

const GAME_COMPONENTS: Record<string, React.ComponentType<{ gameId: string }>> = {
  snake: Snake,
  tetris: Tetris,
  "memory-match": MemoryMatch,
  "nosta-farm": NostaFarm,
  "nosta-town": NostaTown,
  "buddy-pets": BuddyPets,
  "trivia-arena": TriviaArena,
};

export default async function GamePage({ params }: Props) {
  const { slug } = await params;
  const games = await getGames();
  const game = games.find((g) => g.slug === slug);

  if (!game) notFound();

  const GameComponent = GAME_COMPONENTS[slug];
  if (!GameComponent) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-4xl mb-4">🚧</p>
        <h1 className="text-2xl font-bold">{game.name}</h1>
        <p className="text-gray-500 mt-2">Coming soon!</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{game.name}</h1>
      <GameComponent gameId={game.id} />
    </div>
  );
}
