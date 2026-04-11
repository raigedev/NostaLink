import SearchResults from "@/components/search/SearchResults";

interface Props { searchParams: Promise<{ q?: string }> }

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Search{q ? `: "${q}"` : ""}
      </h1>
      {q ? <SearchResults query={q} /> : (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-4">🔍</p>
          <p>Enter a search term in the top bar.</p>
        </div>
      )}
    </div>
  );
}
