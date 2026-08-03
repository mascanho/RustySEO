-- Incremental update: lowers the max chat message length from 1000 to a
-- more reasonable 500 characters. Run this in the Supabase SQL Editor.
-- (Already included in supabase_chat_schema.sql for fresh installs.)

alter table public.messages
  drop constraint if exists messages_content_check;

alter table public.messages
  add constraint messages_content_check
  check (char_length(content) between 1 and 500);

drop policy if exists "Public insert access" on public.messages;

create policy "Public insert access" on public.messages
  for insert
  with check (
    char_length(sender_name) between 1 and 40
    and char_length(content) between 1 and 500
  );
