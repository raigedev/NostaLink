"use client";

import { useState } from "react";
import type { Survey } from "@/app/actions/surveys";
import { submitSurveyResponse } from "@/app/actions/surveys";
import ResultReveal from "./ResultReveal";

interface Props { survey: Survey; }

export default function SurveyTaker({ survey }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = survey.questions[step];
  const isLast = step === survey.questions.length - 1;

  function updateAnswer(value: unknown) {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  }

  async function next() {
    if (isLast) {
      const result = await submitSurveyResponse(survey.id, answers);
      if (result.error) { setError(result.error); return; }
      setSubmitted(true);
    } else {
      setStep((s) => s + 1);
    }
  }

  if (submitted) return <ResultReveal survey={survey} answers={answers} />;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8">
      <h1 className="text-2xl font-bold mb-2">{survey.title}</h1>
      {survey.description && <p className="text-gray-500 mb-6">{survey.description}</p>}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Question {step + 1} of {survey.questions.length}</span>
          <span>{Math.round(((step + 1) / survey.questions.length) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div
            className="h-2 bg-indigo-500 rounded-full transition-all"
            style={{ width: `${((step + 1) / survey.questions.length) * 100}%` }}
          />
        </div>
      </div>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
      <div className="space-y-4">
        <p className="font-semibold text-lg">{q.text}</p>
        {q.type === "text" && (
          <textarea
            value={String(answers[q.id] ?? "")}
            onChange={(e) => updateAnswer(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Your answer…"
          />
        )}
        {q.type === "yes_no" && (
          <div className="flex gap-3">
            {["Yes", "No"].map((opt) => (
              <button
                key={opt}
                onClick={() => updateAnswer(opt)}
                className={`flex-1 py-3 rounded-xl border-2 font-medium transition ${
                  answers[q.id] === opt ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
        {q.type === "rating" && (
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => updateAnswer(n)}
                className={`w-12 h-12 rounded-xl font-bold text-lg border-2 transition ${
                  answers[q.id] === n ? "border-indigo-600 bg-indigo-100 text-indigo-700" : "border-gray-200 hover:border-indigo-300"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}
        {q.type === "multiple_choice" && (
          <div className="space-y-2">
            {(q.options ?? []).map((opt) => (
              <button
                key={opt}
                onClick={() => updateAnswer(opt)}
                className={`w-full px-4 py-3 rounded-xl border-2 text-left font-medium transition ${
                  answers[q.id] === opt ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            Back
          </button>
        )}
        <button
          onClick={next}
          disabled={q.required && !answers[q.id]}
          className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {isLast ? "Submit" : "Next →"}
        </button>
      </div>
    </div>
  );
}
