interface Props {
  mood?: string | null;
}

const moodEmojis: Record<string, string> = {
  happy: "😊",
  sad: "😢",
  excited: "🤩",
  tired: "😴",
  loved: "😍",
  angry: "😡",
  bored: "😒",
  nostalgic: "🥺",
};

export default function MoodWidget({ mood }: Props) {
  if (!mood) return null;
  const lower = mood.toLowerCase();
  const emoji = Object.entries(moodEmojis).find(([k]) => lower.includes(k))?.[1] ?? "✨";
  return (
    <div className="p-4 rounded-xl border text-center" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
      <p className="text-xs opacity-60 mb-1">Current Mood</p>
      <p className="text-3xl mb-1">{emoji}</p>
      <p className="text-sm font-medium">{mood}</p>
    </div>
  );
}
