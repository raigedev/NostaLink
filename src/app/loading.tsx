export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div
        className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full"
        style={{ animation: "spin 0.8s linear infinite" }}
        aria-label="Loading"
      />
    </div>
  );
}
