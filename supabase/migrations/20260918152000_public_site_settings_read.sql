grant select on table public.site_settings to anon, authenticated;

alter table public.site_settings enable row level security;

drop policy if exists "settings public read" on public.site_settings;
create policy "settings public read"
on public.site_settings
for select
to anon, authenticated
using (true);
