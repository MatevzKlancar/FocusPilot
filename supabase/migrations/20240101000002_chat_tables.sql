-- Create chat_sessions table
create table chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create chat_messages table
create table chat_messages (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;

-- RLS Policies for chat_sessions
create policy "Users can view their own chat sessions" on chat_sessions
  for select using (auth.uid() = user_id);

create policy "Users can insert their own chat sessions" on chat_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own chat sessions" on chat_sessions
  for update using (auth.uid() = user_id);

create policy "Users can delete their own chat sessions" on chat_sessions
  for delete using (auth.uid() = user_id);

-- RLS Policies for chat_messages
create policy "Users can view their own chat messages" on chat_messages
  for select using (auth.uid() = user_id);

create policy "Users can insert their own chat messages" on chat_messages
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own chat messages" on chat_messages
  for update using (auth.uid() = user_id);

create policy "Users can delete their own chat messages" on chat_messages
  for delete using (auth.uid() = user_id);

-- Create indexes for better performance
create index chat_sessions_user_id_idx on chat_sessions(user_id);
create index chat_sessions_last_message_at_idx on chat_sessions(last_message_at desc);
create index chat_sessions_created_at_idx on chat_sessions(created_at desc);

create index chat_messages_session_id_idx on chat_messages(session_id);
create index chat_messages_user_id_idx on chat_messages(user_id);
create index chat_messages_created_at_idx on chat_messages(created_at);

-- Triggers to automatically update updated_at
create trigger update_chat_sessions_updated_at
  before update on chat_sessions
  for each row execute procedure update_updated_at_column();

create trigger update_chat_messages_updated_at
  before update on chat_messages
  for each row execute procedure update_updated_at_column();

-- Function to update last_message_at in chat_sessions when a new message is added
create or replace function update_session_last_message()
returns trigger as $$
begin
  update chat_sessions 
  set last_message_at = new.created_at
  where id = new.session_id;
  return new;
end;
$$ language plpgsql;

-- Trigger to update last_message_at when a message is inserted
create trigger update_session_last_message_trigger
  after insert on chat_messages
  for each row execute procedure update_session_last_message(); 