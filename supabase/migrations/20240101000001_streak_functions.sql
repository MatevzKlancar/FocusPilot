-- Function to update streak when a task is completed
create or replace function update_streak()
returns trigger as $$
declare
  user_streak record;
  today_date date := current_date;
  yesterday_date date := current_date - interval '1 day';
begin
  -- Only proceed if task was just completed (completed_at was null and now has a value)
  if (old.completed_at is null and new.completed_at is not null) then
    -- Get or create streak record
    select * into user_streak from streaks where user_id = new.user_id;
    
    if user_streak is null then
      -- Create new streak record
      insert into streaks (user_id, current_streak, best_streak, last_activity)
      values (new.user_id, 1, 1, today_date);
    else
      -- Update existing streak
      if user_streak.last_activity = yesterday_date then
        -- Continuing streak
        update streaks 
        set 
          current_streak = current_streak + 1,
          best_streak = greatest(best_streak, current_streak + 1),
          last_activity = today_date,
          updated_at = now()
        where user_id = new.user_id;
      elsif user_streak.last_activity = today_date then
        -- Already completed a task today, no change to streak count
        -- Just update the timestamp
        update streaks 
        set updated_at = now()
        where user_id = new.user_id;
      else
        -- Streak was broken, start over
        update streaks 
        set 
          current_streak = 1,
          best_streak = greatest(best_streak, 1),
          last_activity = today_date,
          updated_at = now()
        where user_id = new.user_id;
      end if;
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Function to get current streak for a user
create or replace function get_user_streak(user_uuid uuid)
returns table(current_streak int, best_streak int, last_activity date) as $$
begin
  return query
  select s.current_streak, s.best_streak, s.last_activity
  from streaks s
  where s.user_id = user_uuid;
end;
$$ language plpgsql security definer;

-- Function to initialize streak for new users
create or replace function initialize_user_streak()
returns trigger as $$
begin
  insert into streaks (user_id, current_streak, best_streak, last_activity)
  values (new.id, 0, 0, null)
  on conflict (user_id) do nothing;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to update streak when task is completed
create trigger update_streak_on_task_completion
  after update on tasks
  for each row
  execute function update_streak();

-- Trigger to initialize streak for new users
create trigger initialize_streak_on_user_creation
  after insert on auth.users
  for each row
  execute function initialize_user_streak();

-- Function to get tasks for today (used by AI agent)
create or replace function get_today_tasks(user_uuid uuid)
returns table(
  id uuid,
  title text,
  description text,
  due_date date,
  is_recurring boolean,
  cadence text,
  completed_at timestamptz,
  goal_title text
) as $$
begin
  return query
  select 
    t.id,
    t.title,
    t.description,
    t.due_date,
    t.is_recurring,
    t.cadence,
    t.completed_at,
    g.title as goal_title
  from tasks t
  join goals g on t.goal_id = g.id
  where t.user_id = user_uuid
    and t.due_date = current_date
  order by t.created_at;
end;
$$ language plpgsql security definer; 