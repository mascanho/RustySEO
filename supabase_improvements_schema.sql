-- RustySEO suggestion box: run this once in the Supabase SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)
--
-- public.improvements already exists with this shape:
--   id          (primary key)
--   timestamp   (auto-populated, e.g. default now())
--   username    text
--   text        text
--
-- RLS is enabled but has no insert policy yet, so every insert from the
-- app's anon key is being rejected with:
--   42501: new row violates row-level security policy for table "improvements"
-- This adds the missing policy, scoped to the same length limits the app
-- enforces client-side.

drop policy if exists "Public insert access" on public.improvements;
create policy "Public insert access" on public.improvements
  for insert
  with check (
    char_length(username) between 1 and 40
    and char_length(text) between 1 and 1000
  );

-- Note: unlike the chat tables, there's no identifying column (client_id /
-- auth uid) on this table, so a database-level rate-limit trigger like the
-- chat ones isn't possible without adding one. Skipped for now — add a
-- client_id or user_id column first if abuse becomes a problem.
