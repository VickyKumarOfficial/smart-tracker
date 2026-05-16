create extension if not exists pgcrypto;

create table if not exists ai_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New chat',
  preview text not null default '',
  messages jsonb not null default '[]'::jsonb,
  model text not null default 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
  status text not null default 'completed' check (status in ('active', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

alter table ai_chats enable row level security;

do $$
begin
  create policy "ai_chats_select_own"
    on ai_chats
    for select
    using (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "ai_chats_insert_own"
    on ai_chats
    for insert
    with check (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "ai_chats_update_own"
    on ai_chats
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

create index if not exists ai_chats_user_last_message_at_idx
  on ai_chats (user_id, last_message_at desc);
