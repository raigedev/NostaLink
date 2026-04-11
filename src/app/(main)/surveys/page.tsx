import { getSurveys } from "@/app/actions/surveys";
import Link from "next/link";

export default async function SurveysPage() {
  const surveys = await getSurveys();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📊 Surveys</h1>
        <Link href="/surveys/create" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
          Create Survey
        </Link>
      </div>
      <div className="space-y-4">
        {surveys.map((survey) => (
          <Link
            key={survey.id}
            href={`/surveys/${survey.id}`}
            className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition"
          >
            <h2 className="font-bold text-gray-900">{survey.title}</h2>
            {survey.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{survey.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              <span>by {survey.creator?.display_name || survey.creator?.username}</span>
              <span>{survey.questions.length} questions</span>
            </div>
          </Link>
        ))}
        {surveys.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-4">📊</p>
            <p>No surveys yet. Create one!</p>
          </div>
        )}
      </div>
    </div>
  );
}
