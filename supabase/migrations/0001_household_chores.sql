-- Minimal database for the household chores PWA.
-- There is one shared state row and four fixed people.

create table if not exists public.people (
  id smallint primary key check (id between 1 and 4),
  name text not null
);

create table if not exists public.household_state (
  id smallint primary key default 1 check (id = 1),
  cleaning_round integer not null default 1 check (cleaning_round >= 1),
  cleaning_assignments smallint[] not null default array[1,2,3,4]::smallint[],
  cleaning_completed boolean[] not null default array[false,false,false,false],
  dishwasher_position smallint not null default 1 check (dishwasher_position between 1 and 4),
  version integer not null default 1 check (version >= 1),
  constraint household_state_assignments_len check (coalesce(array_length(cleaning_assignments, 1), 0) = 4),
  constraint household_state_completed_len check (coalesce(array_length(cleaning_completed, 1), 0) = 4)
);

insert into public.people (id, name)
values
  (1, 'Person 1'),
  (2, 'Person 2'),
  (3, 'Person 3'),
  (4, 'Person 4')
on conflict (id) do update set name = excluded.name;

insert into public.household_state (id)
values (1)
on conflict (id) do nothing;

alter table public.people enable row level security;
alter table public.household_state enable row level security;

drop policy if exists "public can read people" on public.people;
create policy "public can read people"
  on public.people
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public can read household state" on public.household_state;
create policy "public can read household state"
  on public.household_state
  for select
  to anon, authenticated
  using (true);

revoke insert, update, delete on public.people from anon, authenticated;
revoke insert, update, delete on public.household_state from anon, authenticated;
grant select on public.people to anon, authenticated;
grant select on public.household_state to anon, authenticated;

create or replace function public.complete_cleaning(
  p_person_id smallint,
  p_expected_round integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_state public.household_state;
  new_completed boolean[];
  all_complete boolean;
begin
  if p_person_id < 1 or p_person_id > 4 then
    raise exception 'Invalid person id';
  end if;

  select *
  into current_state
  from public.household_state
  where id = 1
  for update;

  if current_state.cleaning_round <> p_expected_round
     or current_state.cleaning_completed[p_person_id] then
    return to_jsonb(current_state);
  end if;

  new_completed := current_state.cleaning_completed;
  new_completed[p_person_id] := true;
  all_complete := array_position(new_completed, false) is null;

  if all_complete then
    update public.household_state
    set cleaning_round = current_state.cleaning_round + 1,
        cleaning_assignments = array[
          current_state.cleaning_assignments[4],
          current_state.cleaning_assignments[1],
          current_state.cleaning_assignments[2],
          current_state.cleaning_assignments[3]
        ]::smallint[],
        cleaning_completed = array[false,false,false,false],
        version = current_state.version + 1
    where id = 1
    returning * into current_state;
  else
    update public.household_state
    set cleaning_completed = new_completed,
        version = current_state.version + 1
    where id = 1
    returning * into current_state;
  end if;

  return to_jsonb(current_state);
end;
$$;

create or replace function public.complete_dishwasher(
  p_expected_position smallint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_state public.household_state;
  next_position smallint;
begin
  if p_expected_position < 1 or p_expected_position > 4 then
    raise exception 'Invalid dishwasher position';
  end if;

  select *
  into current_state
  from public.household_state
  where id = 1
  for update;

  if current_state.dishwasher_position <> p_expected_position then
    return to_jsonb(current_state);
  end if;

  next_position := case
    when current_state.dishwasher_position = 4 then 1
    else current_state.dishwasher_position + 1
  end;

  update public.household_state
  set dishwasher_position = next_position,
      version = current_state.version + 1
  where id = 1
  returning * into current_state;

  return to_jsonb(current_state);
end;
$$;

revoke execute on function public.complete_cleaning(smallint, integer) from public;
revoke execute on function public.complete_dishwasher(smallint) from public;
grant execute on function public.complete_cleaning(smallint, integer) to anon, authenticated;
grant execute on function public.complete_dishwasher(smallint) to anon, authenticated;

-- Enable Realtime for the singleton state row.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'household_state'
  ) then
    alter publication supabase_realtime add table public.household_state;
  end if;
end $$;
