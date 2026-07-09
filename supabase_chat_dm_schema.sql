-- Enables private, 1-to-1 direct messages in the RustySEO chat.
-- Run this in the Supabase SQL Editor.
-- (Already included in supabase_chat_schema.sql for fresh installs.)
--
-- REQUIRES: Anonymous Sign-ins turned on first —
-- Supabase Dashboard -> Authentication -> Sign In / Providers -> Anonymous
-- -> Enable. Without this, direct_messages inserts will fail because
-- auth.uid() will always be null.

-- Link public chat messages to a verified auth identity so a sender can be
-- DM'd from the public room. Nullable/optional: older rows (and anyone who
-- hasn't reloaded the app yet) simply can't be DM'd until they post again.
alter table public.messages add column if not exists auth_id uuid references auth.users(id);

drop policy if exists "Public insert access" on public.messages;
create policy "Public insert access" on public.messages
  for insert
  with check (
    char_length(sender_name) between 1 and 40
    and char_length(content) between 1 and 500
    and (auth_id is null or auth_id = auth.uid())
  );

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

-- Same anti-spam pattern as the public chat, scoped per sender.
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
