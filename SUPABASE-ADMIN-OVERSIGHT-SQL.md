# Admin media oversight SQL

This SQL is needed for media moderation decisions to appear in the shared `audit_logs` feed. The application uses the already-existing `admin_set_media_status(uuid, public.media_status)` RPC; the trigger below records status changes made through that guarded RPC. Guardian-link decisions already have an audit trigger and require no schema change.

**Apply through Supabase Dashboard → SQL Editor before enabling media moderation in production.** The SQL has not been executed from this workspace. Do not run local Docker or CLI migrations for this project.

```sql
begin;

alter table public.audit_logs
  drop constraint if exists audit_logs_entity_type_check;

alter table public.audit_logs
  add constraint audit_logs_entity_type_check
  check (entity_type in (
    'profile',
    'scout_profile',
    'guardian_player_link',
    'consent_record',
    'event',
    'profile_media'
  ));

alter table public.audit_logs
  drop constraint if exists audit_logs_action_check;

alter table public.audit_logs
  add constraint audit_logs_action_check
  check (action in (
    'profile_status_changed',
    'scout_vetting_changed',
    'guardian_link_status_changed',
    'consent_recorded',
    'event_status_changed',
    'media_status_changed'
  ));

create or replace function private.audit_profile_media_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    insert into public.audit_logs (
      entity_type,
      entity_id,
      action,
      actor_user_id,
      old_status,
      new_status,
      metadata
    ) values (
      'profile_media',
      new.id,
      'media_status_changed',
      (select auth.uid()),
      old.status::text,
      new.status::text,
      pg_catalog.jsonb_build_object(
        'owner_user_id', new.owner_user_id,
        'media_type', new.media_type::text
      )
    );
  end if;
  return new;
end;
$$;

revoke all on function private.audit_profile_media_status_change() from public, anon, authenticated;

drop trigger if exists profile_media_audit_status_change on public.profile_media;
create trigger profile_media_audit_status_change
after update of status on public.profile_media
for each row
execute function private.audit_profile_media_status_change();

commit;
```

## Verify after applying

```sql
select entity_type, action, old_status, new_status, created_at
from public.audit_logs
where entity_type = 'profile_media'
order by created_at desc
limit 10;
```

Then, using a non-production pending media record, approve or reject it from `/admin/media` and confirm exactly one new `media_status_changed` audit entry. Also verify a non-admin receives no media records and cannot call `admin_set_media_status`. The app does not use a service-role key for these reads or mutations.
