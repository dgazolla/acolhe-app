-- Run this in Supabase → SQL Editor

create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Nova conversa',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  is_crisis boolean not null default false,
  created_at timestamptz default now() not null
);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "own conversations" on public.conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own messages" on public.messages
  for all
  using (conversation_id in (select id from public.conversations where user_id = auth.uid()))
  with check (conversation_id in (select id from public.conversations where user_id = auth.uid()));

create index on public.messages(conversation_id);
create index on public.conversations(user_id);
