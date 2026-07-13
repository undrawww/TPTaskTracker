-- Training Videos Feature: Database Setup
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- 1. Create training_videos table
CREATE TABLE IF NOT EXISTS training_videos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  url text NOT NULL,
  thumbnail_url text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- 2. Create video_completions table
CREATE TABLE IF NOT EXISTS video_completions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id uuid REFERENCES training_videos(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(video_id, user_id)
);

-- 3. Enable RLS
ALTER TABLE training_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_completions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for training_videos
CREATE POLICY "Anyone can read videos" ON training_videos
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert videos" ON training_videos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update videos" ON training_videos
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete videos" ON training_videos
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. RLS Policies for video_completions
CREATE POLICY "Anyone can read completions" ON video_completions
  FOR SELECT USING (true);

CREATE POLICY "Users can mark their own completions" ON video_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own completions" ON video_completions
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Seed initial videos
INSERT INTO training_videos (title, url, thumbnail_url) VALUES
  ('BREAK THE CYCLE', 'https://www.youtube.com/watch?v=gV2Bi7lr6Ek', 'https://img.youtube.com/vi/gV2Bi7lr6Ek/hqdefault.jpg'),
  ('Partner for Life: Piolo & Chiqui', 'https://www.youtube.com/watch?v=RPADgZaV6p8', 'https://img.youtube.com/vi/RPADgZaV6p8/hqdefault.jpg'),
  ('Partner for Life: Alpha & Buena', 'https://www.youtube.com/watch?v=74kouSNWp70', 'https://img.youtube.com/vi/74kouSNWp70/hqdefault.jpg'),
  ('KWENTONG KAAKBAY: Carlos Medina', 'https://www.youtube.com/watch?v=zzJASyXYKNw', 'https://img.youtube.com/vi/zzJASyXYKNw/hqdefault.jpg'),
  ('Business Owner Client Story: Matt Mallorca', 'https://www.youtube.com/watch?v=L6MHx2JM2vU', 'https://img.youtube.com/vi/L6MHx2JM2vU/hqdefault.jpg'),
  ('Alaga', 'https://www.youtube.com/watch?v=AVjTyX30rBM', 'https://img.youtube.com/vi/AVjTyX30rBM/hqdefault.jpg'),
  ('KWENTONG KAAKBAY: Gina & Sammy', 'https://www.youtube.com/watch?v=bVu-O2zpwPU', 'https://img.youtube.com/vi/bVu-O2zpwPU/hqdefault.jpg'),
  ('Business Owner Client Story: Melita Ramos', 'https://www.youtube.com/watch?v=jyyWfq2_UkM', 'https://img.youtube.com/vi/jyyWfq2_UkM/hqdefault.jpg'),
  ('Professionals Client Story: Donna Dayrit Jimenez', 'https://www.youtube.com/watch?v=EJP_XJloT2I', 'https://img.youtube.com/vi/EJP_XJloT2I/hqdefault.jpg'),
  ('Business Owner Client Story: Jeng Flores', 'https://www.youtube.com/watch?v=CK07d0z4ZRY', 'https://img.youtube.com/vi/CK07d0z4ZRY/hqdefault.jpg');
