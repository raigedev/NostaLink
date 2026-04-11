interface Track { title: string; artist: string; duration: string; }

const SAMPLE: Track[] = [
  { title: "Digital Love", artist: "Daft Punk", duration: "4:58" },
  { title: "Around the World", artist: "Daft Punk", duration: "7:10" },
  { title: "One More Time", artist: "Daft Punk", duration: "5:20" },
];

export default function MusicPlaylistWidget() {
  return (
    <div className="p-4 rounded-xl border" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
      <h3 className="font-semibold mb-3">🎵 My Playlist</h3>
      <div className="space-y-2">
        {SAMPLE.map((t, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="text-xs opacity-50 w-4">{i + 1}</span>
            <div className="flex-1">
              <p className="font-medium text-xs">{t.title}</p>
              <p className="text-xs opacity-60">{t.artist}</p>
            </div>
            <span className="text-xs opacity-50">{t.duration}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
