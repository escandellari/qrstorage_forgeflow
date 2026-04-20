create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  token text not null unique,
  invited_email text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint workspace_invites_invited_email_not_blank check (char_length(btrim(invited_email)) > 0)
);

create index if not exists workspace_invites_workspace_id_idx
  on public.workspace_invites (workspace_id);

create index if not exists workspace_invites_invited_email_idx
  on public.workspace_invites (invited_email);

alter table public.workspace_invites enable row level security;

create or replace function public.create_workspace_invite(
  workspace_id_input uuid,
  invited_email_input text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalised_email text := lower(btrim(invited_email_input));
  created_token text := gen_random_uuid()::text;
  created_invited_email text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if normalised_email = '' then
    raise exception 'Invited email is required';
  end if;

  if not exists (
    select 1
    from public.workspace_memberships
    where workspace_id = workspace_id_input
      and user_id = auth.uid()
  ) then
    raise exception 'Workspace access denied';
  end if;

  insert into public.workspace_invites (
    workspace_id,
    token,
    invited_email,
    expires_at
  )
  values (
    workspace_id_input,
    created_token,
    normalised_email,
    now() + interval '7 days'
  )
  returning invited_email into created_invited_email;

  return jsonb_build_object(
    'token', created_token,
    'invitedEmail', created_invited_email
  );
end;
$$;

create or replace function public.accept_workspace_invite(token_input text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_user_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  invite_row public.workspace_invites%rowtype;
begin
  if current_user_id is null or current_user_email = '' then
    return jsonb_build_object('status', 'signed-out');
  end if;

  select *
  into invite_row
  from public.workspace_invites
  where token = token_input
  limit 1;

  if not found then
    return jsonb_build_object('status', 'error');
  end if;

  if invite_row.expires_at <= now() then
    return jsonb_build_object(
      'status', 'expired',
      'invitedEmail', lower(btrim(invite_row.invited_email))
    );
  end if;

  if invite_row.accepted_at is not null then
    return jsonb_build_object('status', 'already-accepted');
  end if;

  if current_user_email <> lower(btrim(invite_row.invited_email)) then
    return jsonb_build_object(
      'status', 'email-mismatch',
      'invitedEmail', lower(btrim(invite_row.invited_email)),
      'signedInEmail', current_user_email
    );
  end if;

  begin
    insert into public.workspace_memberships (
      workspace_id,
      user_id,
      role
    )
    values (
      invite_row.workspace_id,
      current_user_id,
      'member'
    );
  exception
    when unique_violation then
      return jsonb_build_object('status', 'already-member');
  end;

  update public.workspace_invites
  set accepted_at = now()
  where token = token_input;

  return jsonb_build_object('status', 'accepted');
end;
$$;

revoke all on function public.create_workspace_invite(uuid, text) from public;
revoke all on function public.accept_workspace_invite(text) from public;

grant execute on function public.create_workspace_invite(uuid, text) to authenticated;
grant execute on function public.accept_workspace_invite(text) to authenticated;
