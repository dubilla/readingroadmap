-- Create tables for ReadingRoadmap app

-- User lanes table (references Supabase auth.users)
CREATE TABLE user_lanes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL
);

-- Books table (references Supabase auth.users)
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  pages INTEGER NOT NULL,
  cover_url TEXT NOT NULL,
  status TEXT NOT NULL, -- "to-read", "reading", "completed"
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lane_id INTEGER REFERENCES user_lanes(id) ON DELETE SET NULL, -- null = default lane
  reading_progress INTEGER DEFAULT 0,
  goodreads_id TEXT,
  estimated_minutes INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_user_lanes_user_id ON user_lanes(user_id);
CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_books_lane_id ON books(lane_id);
CREATE INDEX idx_books_status ON books(status);

-- Enable Row Level Security (RLS)
ALTER TABLE user_lanes ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- User lanes policies
CREATE POLICY "Users can view own user lanes" ON user_lanes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own user lanes" ON user_lanes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own user lanes" ON user_lanes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own user lanes" ON user_lanes
  FOR DELETE USING (user_id = auth.uid());

-- Books policies
CREATE POLICY "Users can view own books" ON books
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own books" ON books
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own books" ON books
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own books" ON books
  FOR DELETE USING (user_id = auth.uid()); 