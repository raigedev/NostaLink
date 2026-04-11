"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { passwordSchema } from "@/lib/validators/auth";
import { loginSchema, registerSchema } from "@/lib/validations";

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    // Return generic error to prevent user enumeration
    return { error: "Invalid email or password" };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  // Always return a generic message regardless of whether email or password was wrong
  if (error) return { error: "Invalid email or password" };
  redirect("/");
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("username") as string;
  const display_name = formData.get("display_name") as string;

  const parsed = registerSchema.safeParse({ email, password, username, display_name });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid registration data" };
  }

  // Enforce password policy
  const pwResult = passwordSchema.safeParse(password);
  if (!pwResult.success) {
    return { error: pwResult.error.issues[0]?.message ?? "Password does not meet requirements" };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, display_name } },
  });

  // Always return a generic message to prevent email enumeration
  if (error) {
    return {
      success: true,
      message: "If this email is not already registered, you'll receive a verification link.",
    };
  }

  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      username,
      display_name,
    });
  }

  return {
    success: true,
    message: "If this email is not already registered, you'll receive a verification link.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  // Always attempt — never reveal whether email exists
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/callback?next=/reset-password`,
  });

  // Always return the same generic message
  return {
    success: true,
    message: "If an account exists with this email, you'll receive a reset link.",
  };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();

  let userId: string;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error("Unauthorized");
    userId = data.user.id;
  } catch {
    return { error: "Unauthorized", code: "UNAUTHORIZED", status: 401 };
  }

  const password = formData.get("password") as string;

  const pwResult = passwordSchema.safeParse(password);
  if (!pwResult.success) {
    return { error: pwResult.error.issues[0]?.message ?? "Password does not meet requirements" };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Failed to update password" };

  void userId; // confirms the user was authenticated before updating
  return { success: true };
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/callback`,
    },
  });
  if (error) return;
  if (data.url) redirect(data.url);
}

