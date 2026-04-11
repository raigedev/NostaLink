export default function RightSidebar() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3 text-sm">🟢 Online Friends</h3>
        <div className="space-y-2">
          {["xo_starlight", "retro_gamer99", "kawaii_dreamer", "sceneking2k5"].map((name) => (
            <div key={name} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-gray-700">{name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3 text-sm">🔥 Trending</h3>
        <div className="space-y-2">
          {["#Y2KRevival", "#NostalgiaCore", "#RetroGames", "#DigitalGarden", "#MySpaceVibes"].map((tag) => (
            <div key={tag} className="text-sm text-indigo-600 hover:underline cursor-pointer">
              {tag}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
