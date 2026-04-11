export default function ProfileLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 rounded-b-xl" />
      <div className="max-w-4xl mx-auto px-4">
        <div className="relative -mt-16 flex items-end gap-4 mb-6">
          <div className="w-32 h-32 rounded-full bg-gray-300 flex-shrink-0" />
          <div className="pb-2 flex-1 space-y-2">
            <div className="h-6 bg-gray-300 rounded w-48" />
            <div className="h-4 bg-gray-200 rounded w-32" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-24 bg-gray-200 rounded-xl" />
          <div className="h-32 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
