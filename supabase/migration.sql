-- Create tables for ReadingRoadmap app

-- Swimlanes table (references Supabase auth.users)
CREATE TABLE swimlanes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
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

-- Books table (references Supabase auth.users)
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  pages INTEGER NOT NULL,
  cover_url TEXT NOT NULL,
  status TEXT NOT NULL, -- "to-read", "reading", "completed"
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lane_id INTEGER REFERENCES lanes(id) ON DELETE SET NULL,
  reading_progress INTEGER DEFAULT 0,
  goodreads_id TEXT,
  estimated_minutes INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
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
ALTER TABLE swimlanes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lanes ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Swimlanes policies
CREATE POLICY "Users can view own swimlanes" ON swimlanes
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can insert own swimlanes" ON swimlanes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own swimlanes" ON swimlanes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own swimlanes" ON swimlanes
  FOR DELETE USING (user_id = auth.uid());

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
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own books" ON books
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own books" ON books
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own books" ON books
  FOR DELETE USING (user_id = auth.uid()); 