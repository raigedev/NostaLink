"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
      <h1 className="text-4xl font-bold text-red-600">Something went wrong!</h1>
      <p className="text-gray-600 max-w-md">{error.message || "An unexpected error occurred."}</p>
      <button
        onClick={reset}
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
      >
        Try again
      </button>
    </div>
  );
}
