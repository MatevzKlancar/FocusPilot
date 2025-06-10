-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create goals table
create table goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  target_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create tasks table
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  goal_id uuid not null references goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  is_recurring boolean default false,
  cadence text check (cadence in ('daily', 'weekly', 'monthly')),
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create streaks table
create table streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  best_streak int not null default 0,
  last_activity date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table goals enable row level security;
alter table tasks enable row level security;
alter table streaks enable row level security;

-- RLS Policies for goals
create policy "Users can view their own goals" on goals
  for select using (auth.uid() = user_id);

create policy "Users can insert their own goals" on goals
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own goals" on goals
  for update using (auth.uid() = user_id);

create policy "Users can delete their own goals" on goals
  for delete using (auth.uid() = user_id);

-- RLS Policies for tasks
create policy "Users can view their own tasks" on tasks
  for select using (auth.uid() = user_id);

create policy "Users can insert their own tasks" on tasks
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own tasks" on tasks
  for update using (auth.uid() = user_id);

create policy "Users can delete their own tasks" on tasks
  for delete using (auth.uid() = user_id);

-- RLS Policies for streaks
create policy "Users can view their own streaks" on streaks
  for select using (auth.uid() = user_id);

create policy "Users can insert their own streaks" on streaks
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own streaks" on streaks
  for update using (auth.uid() = user_id);

-- Create indexes for better performance
create index goals_user_id_idx on goals(user_id);
create index goals_created_at_idx on goals(created_at desc);

create index tasks_user_id_idx on tasks(user_id);
create index tasks_goal_id_idx on tasks(goal_id);
create index tasks_due_date_idx on tasks(due_date);
create index tasks_completed_at_idx on tasks(completed_at);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers to automatically update updated_at
create trigger update_goals_updated_at
  before update on goals
  for each row execute procedure update_updated_at_column();

create trigger update_tasks_updated_at
  before update on tasks
  for each row execute procedure update_updated_at_column();

create trigger update_streaks_updated_at
  before update on streaks
  for each row execute procedure update_updated_at_column(); 