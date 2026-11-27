-- Feature switches are readable alongside ordinary site settings. Only an
-- active owner may create, change or delete the feature-prefixed settings.
create policy "feature switches owner insert"
on public.site_settings as restrictive for insert to authenticated
with check (key not like 'feature:%' or (select private.is_owner()));

create policy "feature switches owner update"
on public.site_settings as restrictive for update to authenticated
using (key not like 'feature:%' or (select private.is_owner()))
with check (key not like 'feature:%' or (select private.is_owner()));

create policy "feature switches owner delete"
on public.site_settings as restrictive for delete to authenticated
using (key not like 'feature:%' or (select private.is_owner()));
