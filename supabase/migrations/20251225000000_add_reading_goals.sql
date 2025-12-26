-- Create reading_goals table for tracking annual reading goals
CREATE TABLE reading_goals (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('books', 'pages')),
  target_count INTEGER NOT NULL CHECK (target_count > 0),
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, goal_type, year)
);

-- Create index for faster queries by user
CREATE INDEX idx_reading_goals_user_id ON reading_goals(user_id);
CREATE INDEX idx_reading_goals_year ON reading_goals(year);

-- Enable Row Level Security
ALTER TABLE reading_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own reading goals" ON reading_goals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own reading goals" ON reading_goals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reading goals" ON reading_goals
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own reading goals" ON reading_goals
  FOR DELETE USING (user_id = auth.uid());
