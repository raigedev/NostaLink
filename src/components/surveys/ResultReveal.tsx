"use client";

import type { Survey } from "@/app/actions/surveys";
import Link from "next/link";

interface Props {
  survey: Survey;
  answers: Record<string, unknown>;
}

export default function ResultReveal({ survey, answers }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center animate-fade-in">
      <p className="text-6xl mb-4">🎉</p>
      <h2 className="text-2xl font-bold mb-2">Survey Complete!</h2>
      <p className="text-gray-500 mb-6">Thanks for completing &ldquo;{survey.title}&rdquo;</p>
      <div className="text-left space-y-3 mb-8 max-h-64 overflow-y-auto">
        {survey.questions.map((q) => (
          <div key={q.id} className="bg-gray-50 rounded-xl p-3">
            <p className="text-sm font-medium text-gray-700">{q.text}</p>
            <p className="text-sm text-indigo-600 mt-1">
              {answers[q.id] !== undefined ? String(answers[q.id]) : "(skipped)"}
            </p>
          </div>
        ))}
      </div>
      <Link
        href="/surveys"
        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition inline-block"
      >
        Back to Surveys
      </Link>
    </div>
  );
}
