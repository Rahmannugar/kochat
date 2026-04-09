alter table realtime.messages enable row level security;

create policy "room members can receive private room events"
on realtime.messages
for select
to authenticated
using (
  split_part(realtime.topic(), ':', 1) = 'room'
  and exists (
    select 1
    from public.room_members
    where public.room_members.room_id::text = split_part(realtime.topic(), ':', 2)
      and public.room_members.user_id = auth.jwt() ->> 'app_user_id'
      and public.room_members.archived_at is null
  )
);

create policy "room members can publish private room events"
on realtime.messages
for insert
to authenticated
with check (
  split_part(realtime.topic(), ':', 1) = 'room'
  and exists (
    select 1
    from public.room_members
    where public.room_members.room_id::text = split_part(realtime.topic(), ':', 2)
      and public.room_members.user_id = auth.jwt() ->> 'app_user_id'
      and public.room_members.archived_at is null
  )
);
