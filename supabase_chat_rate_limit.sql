-- Incremental update: adds anti-spam rate limiting to an already-created
-- `messages` table. Run this in the Supabase SQL Editor.
-- (Already included in supabase_chat_schema.sql for fresh installs.)

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
