"use client";

interface Props {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

const ICONS = { success: "✅", error: "❌", info: "ℹ️" };
const COLORS = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

export default function ToastNotification({ message, type = "info", onClose }: Props) {
  return (
    <div className={`fixed bottom-20 md:bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm animate-fade-in ${COLORS[type]}`}>
      <span>{ICONS[type]}</span>
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={onClose} className="text-lg hover:opacity-70">✕</button>
    </div>
  );
}
