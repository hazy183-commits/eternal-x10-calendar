-- Applied to production: clan_announcement_edit_owner_only.
-- Recruitment keeps owner/admin/leader access; announcement editing is owner-only.
alter policy announcements_staff_write on public.clan_announcements
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved' and p.role = 'owner'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved' and p.role = 'owner'));
