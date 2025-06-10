-- Seed data for development
-- Note: This assumes you have a test user with ID '00000000-0000-0000-0000-000000000000'
-- In real development, you would insert actual user IDs from auth.users

-- Insert sample goals
insert into goals (id, user_id, title, description, target_date) values
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Write a Novel',
    'Complete my first science fiction novel with at least 80,000 words',
    '2024-12-31'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'Learn Spanish',
    'Achieve conversational fluency in Spanish',
    '2024-06-30'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'Get Fit',
    'Lose 20 pounds and run a 5K without stopping',
    '2024-08-15'
  );

-- Insert sample tasks
insert into tasks (goal_id, user_id, title, description, due_date, is_recurring, cadence) values
  -- Novel writing tasks
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Write 500 words',
    'Daily writing goal to maintain momentum',
    current_date,
    true,
    'daily'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Outline Chapter 3',
    'Plan the plot points and character development for chapter 3',
    current_date + interval '1 day',
    false,
    null
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Research space travel',
    'Gather realistic details about interstellar travel for the story',
    current_date + interval '3 days',
    false,
    null
  ),
  
  -- Spanish learning tasks
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'Duolingo practice',
    'Complete daily Spanish lesson on Duolingo',
    current_date,
    true,
    'daily'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'Watch Spanish movie',
    'Watch a Spanish film with subtitles to improve listening skills',
    current_date + interval '2 days',
    false,
    null
  ),
  
  -- Fitness tasks
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'Morning run',
    'Go for a 30-minute run in the park',
    current_date,
    true,
    'daily'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'Meal prep',
    'Prepare healthy meals for the week',
    current_date + interval '1 day',
    true,
    'weekly'
  );

-- Initialize streak for the test user
insert into streaks (user_id, current_streak, best_streak, last_activity) values
  (
    '00000000-0000-0000-0000-000000000000',
    3,
    7,
    current_date - interval '1 day'
  ); 