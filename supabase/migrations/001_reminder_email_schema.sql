create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

create table if not exists public.trade_reminders (
  id uuid primary key default gen_random_uuid(),
  client_id text not null unique,
  recipient_email text not null,
  order_no text not null,
  customer text,
  product text,
  stage text not null,
  reminder_at timestamptz not null,
  note text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trade_reminders enable row level security;

drop policy if exists "allow anon upsert reminders" on public.trade_reminders;
create policy "allow anon upsert reminders"
on public.trade_reminders
for insert
to anon
with check (recipient_email ~* '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$');

drop policy if exists "allow anon update own reminder key" on public.trade_reminders;
create policy "allow anon update own reminder key"
on public.trade_reminders
for update
to anon
using (true)
with check (recipient_email ~* '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$');

drop policy if exists "allow anon read no rows" on public.trade_reminders;
create policy "allow anon read no rows"
on public.trade_reminders
for select
to anon
using (false);

grant insert, update on public.trade_reminders to anon;

create or replace function public.set_trade_reminders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_trade_reminders_updated_at on public.trade_reminders;
create trigger set_trade_reminders_updated_at
before update on public.trade_reminders
for each row
execute function public.set_trade_reminders_updated_at();

-- After deploying the send-reminder-emails Edge Function, create the cron job in
-- the Supabase SQL editor with your real project URL and anon key stored in Vault:
--
-- select vault.create_secret('https://PROJECT_REF.supabase.co', 'project_url');
-- select vault.create_secret('YOUR_SUPABASE_ANON_KEY', 'anon_key');
--
-- select cron.schedule(
--   'send-trade-reminder-emails',
--   '* * * * *',
--   $$
--   select net.http_post(
--     url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/send-reminder-emails',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key')
--     ),
--     body := '{}'::jsonb
--   ) as request_id;
--   $$
-- );
