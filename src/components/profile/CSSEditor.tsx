"use client";

import { useState } from "react";
import { MAX_CSS_LENGTH } from "@/lib/sanitizers/css-sanitizer";

interface Props {
  defaultValue: string;
  userId: string;
  onSave: (css: string) => void;
}

export default function CSSEditor({ defaultValue, userId, onSave }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [showPreview, setShowPreview] = useState(false);

  const charCount = value.length;
  const overLimit = charCount > MAX_CSS_LENGTH;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          CSS is scoped under <code className="bg-gray-100 px-1 rounded">.profile-custom-{userId.slice(0, 8)}…</code> — dangerous properties are blocked.
        </p>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="text-xs text-indigo-600 hover:underline"
        >
          {showPreview ? "Hide preview" : "Show preview"}
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={14}
        className="w-full font-mono text-xs border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-gray-950 text-green-400"
        placeholder=".profile-header { color: hotpink; }"
        spellCheck={false}
        maxLength={MAX_CSS_LENGTH}
      />
      <div className="flex items-center justify-between">
        <span className={`text-xs ${overLimit ? "text-red-600 font-semibold" : "text-gray-400"}`}>
          {charCount.toLocaleString()} / {MAX_CSS_LENGTH.toLocaleString()} characters
        </span>
        <button
          type="button"
          onClick={() => !overLimit && onSave(value)}
          disabled={overLimit}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          Save CSS
        </button>
      </div>
      {showPreview && value && (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600">
            Live Preview
          </div>
          <div className={`p-4 profile-custom-${userId}`}>
            <style dangerouslySetInnerHTML={{ __html: value }} />
            <p className="text-sm">Preview: your CSS styles will appear here when the profile is saved.</p>
            <h2>Sample Heading</h2>
            <p>Sample paragraph text for preview.</p>
          </div>
        </div>
      )}
    </div>
  );
}
