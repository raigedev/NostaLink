import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 text-center">
      <div className="text-8xl">🔍</div>
      <h1 className="text-6xl font-bold text-indigo-600">404</h1>
      <h2 className="text-2xl font-semibold">Page Not Found</h2>
      <p className="text-gray-500 max-w-md">
        This page doesn&apos;t exist or has been moved. Let&apos;s get you back home.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
      >
        Go Home
      </Link>
    </div>
  );
}
