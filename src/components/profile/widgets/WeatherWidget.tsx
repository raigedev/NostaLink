"use client";

interface Props {
  city?: string;
}

const WEATHER_ICONS: Record<string, string> = {
  sunny: "☀️", clear: "☀️", cloudy: "☁️", "partly cloudy": "⛅",
  rain: "🌧️", storm: "⛈️", snow: "❄️", fog: "🌫️", wind: "💨",
};

export default function WeatherWidget({ city = "Nostalgiaville" }: Props) {
  // Display-only widget with fun mock data
  const condition = "Partly Cloudy";
  const icon = WEATHER_ICONS["partly cloudy"];

  return (
    <div className="p-4 rounded-xl border text-center" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
      <p className="text-xs opacity-60 mb-1">🌤 Weather</p>
      <p className="text-5xl mb-2">{icon}</p>
      <p className="text-sm font-medium opacity-70">{condition}</p>
      <p className="text-xs opacity-50 mt-1">{city || "Set city in widget settings"}</p>
    </div>
  );
}
