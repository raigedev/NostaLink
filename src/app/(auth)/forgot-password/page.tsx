"use client";

import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import Link from "next/link";
import { resetPassword } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
    >
      {pending ? "Sending…" : "Send Reset Link"}
    </button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      const result = await resetPassword(formData);
      return result;
    },
    null
  );

  return (
    <>
      <h2 className="text-2xl font-bold mb-2 text-center">Reset Password</h2>
      <p className="text-gray-500 text-sm text-center mb-6">
        Enter your email and we&apos;ll send you a reset link.
      </p>
      {state?.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          Check your email for a reset link.
        </div>
      )}
      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            name="email"
            type="email"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="you@example.com"
          />
        </div>
        <SubmitButton />
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/login" className="text-indigo-600 hover:underline">
          Back to login
        </Link>
      </p>
    </>
  );
}
