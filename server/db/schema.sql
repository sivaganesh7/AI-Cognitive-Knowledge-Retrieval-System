-- ============================================================
-- AI Cognitive Knowledge Retrieval System Database Schema
-- PostgreSQL 15+
-- Run this in your Supabase/Neon SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firebase_uid  TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  display_name  TEXT,
  photo_url     TEXT,
  username      TEXT UNIQUE,
  bio           TEXT,
  is_public     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTES TABLE (core entity)
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL CHECK (char_length(title) <= 300),
  content       TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'note'
                  CHECK (type IN ('note', 'link', 'insight', 'quote', 'todo')),
  source_url    TEXT,
  summary       TEXT,
  tags          TEXT[] DEFAULT '{}',
  is_public     BOOLEAN DEFAULT FALSE,
  is_pinned     BOOLEAN DEFAULT FALSE,
  is_favorite   BOOLEAN DEFAULT FALSE,
  todo_done     BOOLEAN DEFAULT FALSE,
  reading_time  INTEGER DEFAULT 1,
  word_count    INTEGER DEFAULT 0,
  ai_processed  BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TAGS TABLE (lookup for filtering)
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT DEFAULT '#6366f1',
  note_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- ============================================================
-- CONVERSATIONS TABLE (chat history)
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  messages   JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTE VIEWS (analytics)
-- ============================================================
CREATE TABLE IF NOT EXISTS note_views (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id    UUID REFERENCES notes(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id),
  viewed_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_notes_user_id   ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_type      ON notes(type);
CREATE INDEX IF NOT EXISTS idx_notes_tags      ON notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_notes_created   ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_is_public ON notes(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON notes(is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_notes_search    ON notes USING GIN(to_tsvector('english', title || ' ' || content));
CREATE INDEX IF NOT EXISTS idx_tags_user_id    ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_convos_user_id  ON conversations(user_id);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

