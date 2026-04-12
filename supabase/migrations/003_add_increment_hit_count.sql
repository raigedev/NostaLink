CREATE OR REPLACE FUNCTION increment_hit_count(profile_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles SET hit_count = hit_count + 1 WHERE id = profile_id;
END;
$$;
