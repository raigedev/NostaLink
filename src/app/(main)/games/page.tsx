import { getGames } from "@/app/actions/games";
import Link from "next/link";

export default async function GamesPage() {
  const games = await getGames();

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🎮 Games Lobby</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game) => (
          <Link
            key={game.id}
            href={`/games/${game.slug}`}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition group"
          >
            <div className="h-32 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-5xl">
              🎮
            </div>
            <div className="p-4">
              <h2 className="font-bold text-gray-900 group-hover:text-indigo-600 transition">{game.name}</h2>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{game.description}</p>
            </div>
          </Link>
        ))}
        {games.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-500">
            <p className="text-4xl mb-4">🎮</p>
            <p>No games available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
