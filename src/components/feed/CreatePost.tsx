"use client";

import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { createPost } from "@/app/actions/posts";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
    >
      {pending ? "Posting…" : "Post"}
    </button>
  );
}

export default function CreatePost() {
  const [error, formAction] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      const result = await createPost(formData);
      return result?.error ?? null;
    },
    null
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <form action={formAction}>
        <textarea
          name="content"
          placeholder="What's on your mind? ✨"
          rows={3}
          className="w-full resize-none text-sm border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
        {error && (
          <p className="text-red-500 text-xs mt-1">{error}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <select
            name="privacy"
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="public">🌍 Public</option>
            <option value="friends">👥 Friends</option>
            <option value="private">🔒 Private</option>
          </select>
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
