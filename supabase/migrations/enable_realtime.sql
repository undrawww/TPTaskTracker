-- Enable Realtime for the video_completions table
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard -> SQL Editor)

begin;
  -- remove the supabase_realtime publication
  drop publication if exists supabase_realtime;

  -- re-create the supabase_realtime publication with no tables
  create publication supabase_realtime;
commit;

-- add tables to the publication
alter publication supabase_realtime add table video_completions;
alter publication supabase_realtime add table training_videos;
alter publication supabase_realtime add table daily_tasks;
alter publication supabase_realtime add table weekly_tasks;
