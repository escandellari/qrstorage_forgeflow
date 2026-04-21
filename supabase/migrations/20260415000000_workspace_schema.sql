-- Core workspace schema: workspaces, memberships, and boxes
-- Run this in Supabase SQL Editor first

-- Create tables
create table if not exists public.workspaces (
  id uuid not null default gen_random_uuid() primary key,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_memberships (
  id uuid not null default gen_random_uuid() primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  unique(workspace_id, user_id)
);

create table if not exists public.boxes (
  id uuid not null default gen_random_uuid() primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  box_id text,
  name text,
  description text,
  location text,
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.box_items (
  id uuid not null default gen_random_uuid() primary key,
  box_id uuid not null references public.boxes(id) on delete cascade,
  name text not null,
  description text,
  quantity integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create indexes
create index if not exists workspaces_name_idx on public.workspaces(name);
create index if not exists workspace_memberships_workspace_id_idx on public.workspace_memberships(workspace_id);
create index if not exists workspace_memberships_user_id_idx on public.workspace_memberships(user_id);
create index if not exists boxes_workspace_id_idx on public.boxes(workspace_id);
create index if not exists boxes_box_id_idx on public.boxes(box_id);
create index if not exists box_items_box_id_idx on public.box_items(box_id);

-- DISABLE RLS completely
alter table public.workspaces disable row level security;
alter table public.workspace_memberships disable row level security;
alter table public.boxes disable row level security;
alter table public.box_items disable row level security;

-- Create the create_box RPC function
create or replace function public.create_box(workspace_id_input uuid, name_input text)
returns setof public.boxes as $$
  insert into public.boxes (workspace_id, name)
  values (workspace_id_input, name_input)
  returning *;
$$ language sql security definer;

grant execute on function public.create_box(uuid, text) to authenticated;

-- Grant all permissions
grant all on public.workspaces to authenticated;
grant all on public.workspace_memberships to authenticated;
grant all on public.boxes to authenticated;
grant all on public.box_items to authenticated;

  -- Allow authenticated users to create workspaces
create policy "Users can create workspaces" on public.workspaces
  for insert with check (auth.uid() is not null);
