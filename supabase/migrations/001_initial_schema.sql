-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── Profiles ─────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  mood TEXT,
  headline TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  location TEXT,
  website TEXT,
  relationship_status TEXT,
  theme_id TEXT DEFAULT 'minimalist',
  font_id TEXT DEFAULT 'inter',
  custom_css TEXT,
  custom_html TEXT,
  bg_url TEXT,
  bg_mode TEXT DEFAULT 'tiled',
  bg_color TEXT,
  profile_song_url TEXT,
  hit_count INTEGER DEFAULT 0,
  widgets JSONB DEFAULT '[]'::jsonb,
  top_friends UUID[] DEFAULT '{}',
  search_tsv TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(username, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(display_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(bio, '')), 'C')
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Posts ─────────────────────────────────────────────────────────────────────
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[],
  privacy TEXT NOT NULL DEFAULT 'public' CHECK (privacy IN ('public', 'friends', 'private')),
  group_id UUID,
  search_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Reactions ─────────────────────────────────────────────────────────────────
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like','love','haha','wow','sad','angry')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, type)
);

-- ── Comments ─────────────────────────────────────────────────────────────────
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Friendships ───────────────────────────────────────────────────────────────
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- ── Conversations & Messages ───────────────────────────────────────────────────
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_members (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Games ─────────────────────────────────────────────────────────────────────
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  thumbnail_url TEXT
);

CREATE TABLE game_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE game_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Surveys ───────────────────────────────────────────────────────────────────
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(survey_id, user_id)
);

-- ── Notifications ─────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Albums & Photos ────────────────────────────────────────────────────────────
CREATE TABLE albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Groups ────────────────────────────────────────────────────────────────────
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  avatar_url TEXT,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE posts ADD CONSTRAINT posts_group_id_fkey
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;

-- ── Guestbook & Shoutbox ─────────────────────────────────────────────────────
CREATE TABLE guestbook_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shoutbox_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Pet Adoptions ─────────────────────────────────────────────────────────────
CREATE TABLE pet_adoptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pet_type TEXT NOT NULL,
  name TEXT NOT NULL,
  happiness INTEGER DEFAULT 100,
  hunger INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_search_tsv ON profiles USING GIN(search_tsv);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_search_tsv ON posts USING GIN(search_tsv);
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_game_scores_game ON game_scores(game_id, score DESC);

-- ── RLS Policies ─────────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE shoutbox_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_adoptions ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_owner_write" ON profiles FOR ALL USING (auth.uid() = id);

-- Posts
CREATE POLICY "posts_public_read" ON posts FOR SELECT USING (
  privacy = 'public' OR author_id = auth.uid()
);
CREATE POLICY "posts_authenticated_insert" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_owner_update" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "posts_owner_delete" ON posts FOR DELETE USING (auth.uid() = author_id);

-- Reactions
CREATE POLICY "reactions_public_read" ON reactions FOR SELECT USING (true);
CREATE POLICY "reactions_auth_write" ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions_owner_delete" ON reactions FOR DELETE USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "comments_public_read" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_auth_insert" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "comments_owner_delete" ON comments FOR DELETE USING (auth.uid() = author_id);

-- Friendships
CREATE POLICY "friendships_participant_read" ON friendships FOR SELECT USING (
  auth.uid() = requester_id OR auth.uid() = addressee_id
);
CREATE POLICY "friendships_requester_insert" ON friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "friendships_participant_update" ON friendships FOR UPDATE USING (
  auth.uid() = requester_id OR auth.uid() = addressee_id
);
CREATE POLICY "friendships_participant_delete" ON friendships FOR DELETE USING (
  auth.uid() = requester_id OR auth.uid() = addressee_id
);

-- Conversations
CREATE POLICY "conversations_member_read" ON conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = id AND user_id = auth.uid())
);
CREATE POLICY "conversations_auth_insert" ON conversations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Conversation members
CREATE POLICY "conv_members_read" ON conversation_members FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM conversation_members cm WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid()
  )
);
CREATE POLICY "conv_members_insert" ON conversation_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Messages
CREATE POLICY "messages_participant_read" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "messages_participant_insert" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);

-- Game scores
CREATE POLICY "game_scores_public_read" ON game_scores FOR SELECT USING (true);
CREATE POLICY "game_scores_auth_insert" ON game_scores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Game invites
CREATE POLICY "game_invites_participant_read" ON game_invites FOR SELECT USING (
  from_user_id = auth.uid() OR to_user_id = auth.uid()
);
CREATE POLICY "game_invites_auth_insert" ON game_invites FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Surveys
CREATE POLICY "surveys_public_read" ON surveys FOR SELECT USING (true);
CREATE POLICY "surveys_creator_insert" ON surveys FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "surveys_creator_update" ON surveys FOR UPDATE USING (auth.uid() = creator_id);

-- Survey responses
CREATE POLICY "survey_responses_creator_read" ON survey_responses FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM surveys WHERE id = survey_id AND creator_id = auth.uid())
);
CREATE POLICY "survey_responses_auth_insert" ON survey_responses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications
CREATE POLICY "notifications_owner_read" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_owner_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Albums
CREATE POLICY "albums_public_read" ON albums FOR SELECT USING (true);
CREATE POLICY "albums_owner_insert" ON albums FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "albums_owner_delete" ON albums FOR DELETE USING (auth.uid() = user_id);

-- Photos
CREATE POLICY "photos_public_read" ON photos FOR SELECT USING (true);
CREATE POLICY "photos_owner_insert" ON photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "photos_owner_delete" ON photos FOR DELETE USING (auth.uid() = user_id);

-- Groups
CREATE POLICY "groups_public_read" ON groups FOR SELECT USING (true);
CREATE POLICY "groups_auth_insert" ON groups FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "groups_admin_update" ON groups FOR UPDATE USING (auth.uid() = creator_id);

-- Group members
CREATE POLICY "group_members_public_read" ON group_members FOR SELECT USING (true);
CREATE POLICY "group_members_auth_insert" ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "group_members_self_delete" ON group_members FOR DELETE USING (auth.uid() = user_id);

-- Guestbook
CREATE POLICY "guestbook_public_read" ON guestbook_entries FOR SELECT USING (true);
CREATE POLICY "guestbook_auth_insert" ON guestbook_entries FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Shoutbox
CREATE POLICY "shoutbox_public_read" ON shoutbox_messages FOR SELECT USING (true);
CREATE POLICY "shoutbox_auth_insert" ON shoutbox_messages FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Pet adoptions
CREATE POLICY "pets_owner_read" ON pet_adoptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pets_owner_write" ON pet_adoptions FOR ALL USING (auth.uid() = user_id);

-- ── BFS Degrees of Connection ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_degrees_of_connection(user1_id UUID, user2_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  visited UUID[] := ARRAY[user1_id];
  frontier UUID[] := ARRAY[user1_id];
  next_frontier UUID[];
  degree INTEGER := 0;
BEGIN
  IF user1_id = user2_id THEN RETURN 0; END IF;

  WHILE array_length(frontier, 1) > 0 AND degree < 6 LOOP
    degree := degree + 1;
    next_frontier := '{}';

    SELECT ARRAY_AGG(DISTINCT neighbor_id)
    INTO next_frontier
    FROM (
      SELECT addressee_id AS neighbor_id
      FROM friendships
      WHERE requester_id = ANY(frontier) AND status = 'accepted' AND NOT (addressee_id = ANY(visited))
      UNION
      SELECT requester_id AS neighbor_id
      FROM friendships
      WHERE addressee_id = ANY(frontier) AND status = 'accepted' AND NOT (requester_id = ANY(visited))
    ) t;

    IF next_frontier IS NULL THEN RETURN NULL; END IF;
    IF user2_id = ANY(next_frontier) THEN RETURN degree; END IF;

    visited := visited || next_frontier;
    frontier := next_frontier;
  END LOOP;

  RETURN NULL;
END;
$$;

-- ── Auto-create profile on signup ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1) || substring(md5(NEW.id::text), 1, 4)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
