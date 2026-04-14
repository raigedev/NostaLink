"use client";

import { useState } from "react";
import { sanitizeHTML, MAX_HTML_LENGTH } from "@/lib/sanitize";

interface Props {
  defaultValue: string;
  onSave: (html: string) => void;
  onChange?: (html: string) => void;
}

export default function HTMLEditor({ defaultValue, onSave, onChange }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [showPreview, setShowPreview] = useState(false);
  const [preview, setPreview] = useState("");

  const charCount = value.length;
  const overLimit = charCount > MAX_HTML_LENGTH;

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    onChange?.(e.target.value);
  }

  function handlePreview() {
    setPreview(sanitizeHTML(value));
    setShowPreview(true);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Custom HTML block shown on your profile. Only safe tags are allowed.
        Scripts, forms, and dangerous attributes are stripped.
      </p>
      <textarea
        value={value}
        onChange={handleChange}
        rows={14}
        className="w-full font-mono text-xs border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-gray-950 text-green-400"
        placeholder='<div class="my-widget">Hello!</div>'
        spellCheck={false}
        maxLength={MAX_HTML_LENGTH}
      />
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`text-xs ${overLimit ? "text-red-600 font-semibold" : "text-gray-400"}`}>
          {charCount.toLocaleString()} / {MAX_HTML_LENGTH.toLocaleString()} characters
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePreview}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => !overLimit && onSave(sanitizeHTML(value))}
            disabled={overLimit}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            Save HTML
          </button>
        </div>
      </div>
      {showPreview && (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-medium text-gray-600">Sanitized Preview</span>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div
            className="p-4 prose prose-sm max-w-none overflow-auto"
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        </div>
      )}
    </div>
  );
}
