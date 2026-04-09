alter table realtime.messages enable row level security;

drop policy if exists "room members can receive private room events"
on realtime.messages;

drop policy if exists "room members can publish private room events"
on realtime.messages;

create policy "room members can receive private room events"
on realtime.messages
for select
to authenticated
using (
  split_part(realtime.topic(), ':', 1) = 'room'
  and realtime.messages.extension in ('broadcast', 'presence')
  and exists (
    select 1
    from public.room_members
    inner join public."user"
      on public."user".id = public.room_members.user_id
    where public.room_members.room_id::text = split_part(realtime.topic(), ':', 2)
      and public."user".email =
        ((current_setting('request.jwt.claims', true))::json ->> 'email')
      and public.room_members.archived_at is null
  )
);

create policy "room members can publish private room events"
on realtime.messages
for insert
to authenticated
with check (
  split_part(realtime.topic(), ':', 1) = 'room'
  and realtime.messages.extension in ('broadcast', 'presence')
  and exists (
    select 1
    from public.room_members
    inner join public."user"
      on public."user".id = public.room_members.user_id
    where public.room_members.room_id::text = split_part(realtime.topic(), ':', 2)
      and public."user".email =
        ((current_setting('request.jwt.claims', true))::json ->> 'email')
      and public.room_members.archived_at is null
  )
);
