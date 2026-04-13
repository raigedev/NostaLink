import { z } from "zod";

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const USERNAME_PATTERN = "[a-z0-9_]+";

export const usernameSchema = z
  .string()
  .min(USERNAME_MIN_LENGTH, "Username must be at least 3 characters")
  .max(USERNAME_MAX_LENGTH, "Username must be at most 30 characters")
  .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores");

export const registerSchema = z.object({
  username: usernameSchema,
  display_name: z.string().min(1, "Display name is required").max(50),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const profileSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  mood: z.string().max(100).optional(),
  headline: z.string().max(150).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal("")),
  relationship_status: z
    .enum(["single", "in_relationship", "married", "complicated", ""])
    .optional(),
  theme_id: z.string().optional(),
  font_id: z.string().optional(),
  custom_css: z.string().max(10000).optional(),
  custom_html: z.string().max(10000).optional(),
  bg_url: z.string().url().optional().or(z.literal("")),
  bg_mode: z.enum(["tiled", "stretched", "fixed", "parallax", ""]).optional(),
  bg_color: z.string().optional(),
  profile_song_url: z.string().url().optional().or(z.literal("")),
});

export const postSchema = z.object({
  content: z.string().min(1, "Post content is required").max(5000),
  media_urls: z.array(z.string().url()).optional(),
  privacy: z.enum(["public", "friends", "private"]).default("public"),
  group_id: z.string().uuid().optional(),
});

export const commentSchema = z.object({
  content: z.string().min(1).max(1000),
  post_id: z.string().uuid(),
  parent_id: z.string().uuid().optional(),
});

export const messageSchema = z.object({
  content: z.string().min(1).max(2000),
  conversation_id: z.string().uuid(),
});

export const surveySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  questions: z
    .array(
      z.object({
        id: z.string(),
        text: z.string().min(1),
        type: z.enum(["text", "multiple_choice", "rating", "yes_no"]),
        options: z.array(z.string()).optional(),
        required: z.boolean().default(false),
      })
    )
    .min(1)
    .max(20),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type SurveyInput = z.infer<typeof surveySchema>;
