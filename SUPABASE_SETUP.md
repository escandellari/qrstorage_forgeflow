# Supabase Database Setup Guide

This guide covers how to set up the database schema for the qrstorage_forgeflow project in Supabase.

## Quick Setup (Copy & Paste)

Run all these SQL statements in the Supabase SQL Editor to set up the database:

```sql
-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Workspaces table
create table if not exists public.workspaces (
  id uuid not null default gen_random_uuid() primary key,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Workspace memberships (links users to workspaces)
create table if not exists public.workspace_memberships (
  id uuid not null default gen_random_uuid() primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  unique(workspace_id, user_id)
);

-- Boxes table (storage boxes in a workspace)
create table if not exists public.boxes (
  id uuid not null default gen_random_uuid() primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  box_id text,
  name text,
  description text,
  location text,
  notes text,
  label_target text,
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Box items (items inside boxes)
create table if not exists public.box_items (
  id uuid not null default gen_random_uuid() primary key,
  box_id uuid not null references public.boxes(id) on delete cascade,
  name text not null,
  category text,
  notes text,
  quantity integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

create index if not exists workspaces_name_idx on public.workspaces(name);
create index if not exists workspace_memberships_workspace_id_idx on public.workspace_memberships(workspace_id);
create index if not exists workspace_memberships_user_id_idx on public.workspace_memberships(user_id);
create index if not exists boxes_workspace_id_idx on public.boxes(workspace_id);
create index if not exists boxes_box_id_idx on public.boxes(box_id);
create index if not exists box_items_box_id_idx on public.box_items(box_id);

-- ============================================================================
-- DISABLE RLS (Development Only - Not Secure!)
-- ============================================================================

alter table public.workspaces disable row level security;
alter table public.workspace_memberships disable row level security;
alter table public.boxes disable row level security;
alter table public.box_items disable row level security;

-- ============================================================================
-- OPTIONAL: RPC FUNCTIONS (For Custom Business Logic)
-- ============================================================================

-- Create box function (alternative to direct insert)
create or replace function public.create_box(workspace_id_input uuid, name_input text)
returns setof public.boxes as $$
  insert into public.boxes (workspace_id, name)
  values (workspace_id_input, name_input)
  returning *;
$$ language sql security definer;

grant execute on function public.create_box(uuid, text) to authenticated;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

grant all on public.workspaces to authenticated;
grant all on public.workspace_memberships to authenticated;
grant all on public.boxes to authenticated;
grant all on public.box_items to authenticated;
```

Other migrations (optional - for full functionality):
- `supabase/migrations/20260420020000_box_retirement.sql`
- `supabase/migrations/20260420010000_workspace_member_management.sql`
- `supabase/migrations/20260420000000_workspace_invites.sql`
- `supabase/migrations/20260418000000_search_inventory_rpc.sql`
- `supabase/migrations/20260417000000_search_inventory_rpc.sql`

Run each in the SQL Editor to enable:
- Box retirement (archiving boxes)
- Workspace member management (listing/removing members)
- Workspace invites (inviting by email)
- Inventory search (full-text search across boxes and items)

## Column Reference

### workspaces table
| Column | Type | Description |
|--------|------|------------|
| id | uuid | Primary key |
| name | text | Workspace name |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### workspace_memberships table
| Column | Type | Description |
|--------|------|------------|
| id | uuid | Primary key |
| workspace_id | uuid | Foreign key to workspaces |
| user_id | uuid | Supabase auth.users.id |
| role | text | 'member' or 'owner' |
| created_at | timestamptz | Creation timestamp |

### boxes table
| Column | Type | Description |
|--------|------|------------|
| id | uuid | Primary key |
| workspace_id | uuid | Foreign key to workspaces |
| box_id | text | Human-readable ID (e.g., 'BOX-0001') |
| name | text | Box name |
| description | text | Box description |
| location | text | Physical location |
| notes | text | Notes about contents |
| label_target | text | Label print settings |
| retired_at | timestamptz | Null if active, timestamp if retired |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### box_items table
| Column | Type | Description |
|--------|------|------------|
| id | uuid | Primary key |
| box_id | uuid | Foreign key to boxes |
| name | text | Item name |
| category | text | Item category |
| notes | text | Notes about the item |
| quantity | integer | Number of items |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

## Environment Setup

Create a `.env.local` file with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these from: Supabase Dashboard → Settings → API

## Authentication Setup

1. Go to **Authentication → Providers → Email**
2. Enable **Email provider**
3. Enable **Magic link** (if using passwordless login)

## Next Steps

After database is set up:
1. Run `npm run dev` to start the app
2. Sign in with email
3. Create a workspace
4. Start creating boxes!

## Security Note

⚠️ **Important**: The SQL above disables Row Level Security (RLS) for development convenience. For production:
- Enable RLS on all tables
- Create policies that check user ownership
- Never expose the anon key publicly
- Use a custom auth system or Supabase Auth