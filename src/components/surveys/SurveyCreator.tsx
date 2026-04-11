"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSurvey, type SurveyQuestion } from "@/app/actions/surveys";

export default function SurveyCreator() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<SurveyQuestion[]>([
    { id: "1", text: "", type: "text", required: false },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      { id: String(Date.now()), text: "", type: "text", required: false },
    ]);
  }

  function removeQuestion(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function updateQuestion(id: string, updates: Partial<SurveyQuestion>) {
    setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, ...updates } : q));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await createSurvey({ title, description, questions });
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    router.push("/surveys");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Survey Title *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Questions</h3>
          <button type="button" onClick={addQuestion} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition">
            + Add Question
          </button>
        </div>
        {questions.map((q, i) => (
          <div key={q.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Question {i + 1}</span>
              <button type="button" onClick={() => removeQuestion(q.id)} className="text-red-400 hover:text-red-600 text-sm">Remove</button>
            </div>
            <input
              value={q.text}
              onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
              placeholder="Your question here…"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <div className="flex items-center gap-3">
              <select
                value={q.type}
                onChange={(e) => updateQuestion(q.id, { type: e.target.value as SurveyQuestion["type"] })}
                className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="text">Text</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="rating">Rating (1–5)</option>
                <option value="yes_no">Yes / No</option>
              </select>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={q.required}
                  onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                />
                Required
              </label>
            </div>
            {q.type === "multiple_choice" && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Options (one per line)</p>
                <textarea
                  rows={3}
                  placeholder="Option A&#10;Option B&#10;Option C"
                  defaultValue={(q.options ?? []).join("\n")}
                  onChange={(e) => updateQuestion(q.id, { options: e.target.value.split("\n").filter(Boolean) })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
      >
        {saving ? "Creating…" : "Create Survey"}
      </button>
    </form>
  );
}
