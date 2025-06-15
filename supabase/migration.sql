-- Create tables for ReadingRoadmap app

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  hashed_password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Swimlanes table
CREATE TABLE swimlanes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

-- Lanes table
CREATE TABLE lanes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL,
  type TEXT NOT NULL, -- "backlog", "in-progress", "completed"
  swimlane_id INTEGER REFERENCES swimlanes(id) ON DELETE CASCADE
);

-- Books table
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  pages INTEGER NOT NULL,
  cover_url TEXT NOT NULL,
  status TEXT NOT NULL, -- "to-read", "reading", "completed"
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lane_id INTEGER REFERENCES lanes(id) ON DELETE SET NULL,
  reading_progress INTEGER DEFAULT 0,
  goodreads_id TEXT,
  estimated_minutes INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_swimlanes_user_id ON swimlanes(user_id);
CREATE INDEX idx_lanes_swimlane_id ON lanes(swimlane_id);
CREATE INDEX idx_lanes_type ON lanes(type);
CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_books_lane_id ON books(lane_id);
CREATE INDEX idx_books_status ON books(status);

-- Insert default lanes
INSERT INTO lanes (name, description, "order", type, swimlane_id) VALUES
  ('Backlog', 'Books to read eventually', 0, 'backlog', NULL),
  ('Currently Reading', 'Books in progress', 1, 'in-progress', NULL),
  ('Read', 'Finished books', 999, 'completed', NULL);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE swimlanes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lanes ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Swimlanes policies
CREATE POLICY "Users can view own swimlanes" ON swimlanes
  FOR SELECT USING (user_id IS NULL OR user_id::text = auth.uid()::text);

CREATE POLICY "Users can insert own swimlanes" ON swimlanes
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own swimlanes" ON swimlanes
  FOR UPDATE USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete own swimlanes" ON swimlanes
  FOR DELETE USING (user_id::text = auth.uid()::text);

-- Lanes policies (allow access to default lanes and user's swimlane lanes)
CREATE POLICY "Users can view lanes" ON lanes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert lanes" ON lanes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update lanes" ON lanes
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete lanes" ON lanes
  FOR DELETE USING (true);

-- Books policies
CREATE POLICY "Users can view own books" ON books
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can insert own books" ON books
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own books" ON books
  FOR UPDATE USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete own books" ON books
  FOR DELETE USING (user_id::text = auth.uid()::text); 