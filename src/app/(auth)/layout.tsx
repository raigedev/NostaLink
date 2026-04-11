export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-600">NostaLink</h1>
          <p className="text-gray-500 mt-2">Your digital home, reimagined</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">{children}</div>
      </div>
    </div>
  );
}
