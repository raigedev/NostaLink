"use client";

const MOCK_WEATHER = { temp: 72, condition: "Partly Cloudy", icon: "⛅", city: "Nostalgiaville" };

export default function WeatherWidget() {
  return (
    <div className="p-4 rounded-xl border text-center" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
      <p className="text-xs opacity-60 mb-1">🌤 Weather</p>
      <p className="text-5xl mb-2">{MOCK_WEATHER.icon}</p>
      <p className="font-bold text-xl">{MOCK_WEATHER.temp}°F</p>
      <p className="text-sm opacity-70">{MOCK_WEATHER.condition}</p>
      <p className="text-xs opacity-50 mt-1">{MOCK_WEATHER.city}</p>
    </div>
  );
}
