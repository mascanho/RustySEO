-- RustySEO community chat: run this once in the Supabase SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  client_id text not null,
  -- Verified Supabase auth identity of the sender (see the "Direct
  -- messages" section below). Nullable so the public room still works for
  -- anyone whose client hasn't established an auth session yet.
  auth_id uuid references auth.users(id),
  sender_name text not null check (char_length(sender_name) between 1 and 40),
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists messages_created_at_idx on public.messages (created_at);

alter table public.messages enable row level security;

-- Anyone with the app's public anon key can read the chat history.
drop policy if exists "Public read access" on public.messages;
create policy "Public read access" on public.messages
  for select
  using (true);

-- Anyone with the app's public anon key can post a message. auth_id, when
-- present, must match the caller's real session — prevents spoofing
-- someone else's identity in the public room.
drop policy if exists "Public insert access" on public.messages;
create policy "Public insert access" on public.messages
  for insert
  with check (
    char_length(sender_name) between 1 and 40
    and char_length(content) between 1 and 500
    and (auth_id is null or auth_id = auth.uid())
  );

-- Turn on realtime broadcasting for this table so every open app
-- instance receives new messages instantly over the websocket channel.
-- (Safe to re-run: skips silently if already added.)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- Anti-spam: reject inserts from a client_id that posts too fast or too
-- often. Enforced in the database (not just the app UI) so it can't be
-- bypassed by talking to the Supabase API directly with the public key.
create or replace function public.enforce_chat_rate_limit()
returns trigger as $$
declare
  recent_count integer;
  last_sent timestamptz;
begin
  select count(*), max(created_at)
    into recent_count, last_sent
    from public.messages
    where client_id = new.client_id
      and created_at > now() - interval '60 seconds';

  if last_sent is not null and now() - last_sent < interval '1.5 seconds' then
    raise exception 'RATE_LIMIT: sending too fast, slow down';
  end if;

  if recent_count >= 15 then
    raise exception 'RATE_LIMIT: too many messages, wait a bit';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists chat_rate_limit_trigger on public.messages;
create trigger chat_rate_limit_trigger
  before insert on public.messages
  for each row execute function public.enforce_chat_rate_limit();

-- ---------------------------------------------------------------------
-- Direct messages (private 1-to-1 chats)
--
-- REQUIRES: Anonymous Sign-ins turned on first —
-- Supabase Dashboard -> Authentication -> Sign In / Providers -> Anonymous
-- -> Enable. Without this, inserts below will fail because auth.uid()
-- will always be null.
-- ---------------------------------------------------------------------

create table if not exists public.direct_messages (
  id bigint generated always as identity primary key,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null check (char_length(sender_name) between 1 and 40),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists direct_messages_a_idx
  on public.direct_messages (sender_id, recipient_id, created_at);
create index if not exists direct_messages_b_idx
  on public.direct_messages (recipient_id, sender_id, created_at);

alter table public.direct_messages enable row level security;

-- Only the two participants can ever read a DM row, verified against the
-- caller's real Supabase auth session — not a self-reported client id, so
-- this can't be spoofed by someone who extracts the app's public key.
drop policy if exists "Participants can read their DMs" on public.direct_messages;
create policy "Participants can read their DMs" on public.direct_messages
  for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "Users can send DMs as themselves" on public.direct_messages;
create policy "Users can send DMs as themselves" on public.direct_messages
  for insert
  with check (auth.uid() = sender_id);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'direct_messages'
  ) then
    alter publication supabase_realtime add table public.direct_messages;
  end if;
end $$;

create or replace function public.enforce_dm_rate_limit()
returns trigger as $$
declare
  recent_count integer;
  last_sent timestamptz;
begin
  select count(*), max(created_at)
    into recent_count, last_sent
    from public.direct_messages
    where sender_id = new.sender_id
      and created_at > now() - interval '60 seconds';

  if last_sent is not null and now() - last_sent < interval '1.5 seconds' then
    raise exception 'RATE_LIMIT: sending too fast, slow down';
  end if;

  if recent_count >= 15 then
    raise exception 'RATE_LIMIT: too many messages, wait a bit';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists dm_rate_limit_trigger on public.direct_messages;
create trigger dm_rate_limit_trigger
  before insert on public.direct_messages
  for each row execute function public.enforce_dm_rate_limit();
