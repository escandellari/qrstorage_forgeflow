create or replace function public.list_workspace_members(workspace_id_input uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.workspace_memberships
    where workspace_id = workspace_id_input
      and user_id = current_user_id
  ) then
    raise exception 'Workspace access denied';
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'userId', membership.user_id,
          'role', membership.role,
          'isCurrentUser', membership.user_id = current_user_id
        )
        order by
          case when membership.user_id = current_user_id then 0 else 1 end,
          case membership.role when 'owner' then 0 else 1 end,
          membership.user_id
      )
      from public.workspace_memberships membership
      where membership.workspace_id = workspace_id_input
    ),
    '[]'::jsonb
  );
end;
$$;

create or replace function public.leave_workspace(workspace_id_input uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_user_role text;
  owner_count bigint;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select role
  into current_user_role
  from public.workspace_memberships
  where workspace_id = workspace_id_input
    and user_id = current_user_id
  limit 1;

  if not found then
    raise exception 'Workspace access denied';
  end if;

  if current_user_role = 'owner' then
    select count(*)
    into owner_count
    from public.workspace_memberships
    where workspace_id = workspace_id_input
      and role = 'owner';

    if owner_count <= 1 then
      raise exception 'Transfer ownership before leaving workspace';
    end if;
  end if;

  delete from public.workspace_memberships
  where workspace_id = workspace_id_input
    and user_id = current_user_id;

  return jsonb_build_object('status', 'left');
end;
$$;

create or replace function public.remove_workspace_member(
  workspace_id_input uuid,
  member_user_id_input uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.workspace_memberships
    where workspace_id = workspace_id_input
      and user_id = current_user_id
      and role = 'owner'
  ) then
    raise exception 'Workspace access denied';
  end if;

  if member_user_id_input = current_user_id then
    raise exception 'Use leave_workspace for self-removal';
  end if;

  delete from public.workspace_memberships
  where workspace_id = workspace_id_input
    and user_id = member_user_id_input;

  if not found then
    raise exception 'Workspace member not found';
  end if;

  return jsonb_build_object('status', 'removed');
end;
$$;

revoke all on function public.list_workspace_members(uuid) from public;
revoke all on function public.leave_workspace(uuid) from public;
revoke all on function public.remove_workspace_member(uuid, uuid) from public;

grant execute on function public.list_workspace_members(uuid) to authenticated;
grant execute on function public.leave_workspace(uuid) to authenticated;
grant execute on function public.remove_workspace_member(uuid, uuid) to authenticated;
