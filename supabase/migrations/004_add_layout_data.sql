-- Add layout_data column to profiles for freeform canvas layout editor
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS layout_data JSONB DEFAULT NULL;
