export default function MainLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div
        className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"
        style={{ animation: "spin 0.8s linear infinite" }}
      />
    </div>
  );
}
