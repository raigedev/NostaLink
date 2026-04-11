"use client";

import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { updatePassword } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
    >
      {pending ? "Updating…" : "Update Password"}
    </button>
  );
}

export default function ResetPasswordPage() {
  const [state, formAction] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      const result = await updatePassword(formData);
      return result;
    },
    null
  );

  return (
    <>
      <h2 className="text-2xl font-bold mb-6 text-center">New Password</h2>
      {state?.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          Password updated! You can now sign in.
        </div>
      )}
      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="••••••••"
          />
        </div>
        <SubmitButton />
      </form>
    </>
  );
}
