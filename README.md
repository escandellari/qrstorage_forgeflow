# qrstorage_forgeflow

Mobile-friendly web app for managing physical storage boxes with QR labels. Users create boxes, print labels, scan QR codes to access box contents, and search inventory across boxes.

App created entirely using [forgeflow](https://github.com/CallumVass/forgeflow).

```text
idea -> /init -> optional bootstrap issue -> /implement -> /continue -> /implement-all
```

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier available)
- Vercel account (free tier available, for deployment)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these values from your Supabase project settings > API.

## Running the App

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production

```bash
npm run build
npm start
```

## Testing

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# E2E tests only
npm run test:e2e

# Type check + tests
npm run check
```

## Deployment

### Supabase Setup (Free Tier)

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Navigate to project settings > API
4. Copy `Project URL` and `anon public` key
5. Go to SQL Editor and run the migrations below
6. Configure authentication:
   - Settings > Authentication > Providers
   - Enable Email provider with magic link

### Database Migrations

Follow the instructions in [supabase setup](SUPABASE_SETUP.md)
Run these SQL statements in the Supabase SQL Editor to set up the database schema:

```sql
-- Core schema: workspaces, memberships, boxes, and box_items
-- This completely disables RLS for development

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

-- DISABLE RLS completely (for development)
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

create policy "Allow all inserts" on public.workspaces for insert with check (true);
create policy "Allow all selects" on public.workspaces for select using (true);
create policy "Allow all updates" on public.workspaces for update using (true);

drop policy if exists "Anyone can create memberships" on public.workspace_memberships;
drop policy if exists "Members can view their workspace memberships" on public.workspace_memberships;

create policy "Allow all inserts" on public.workspace_memberships for insert with check (true);
create policy "Allow all selects" on public.workspace_memberships for select using (true);
create policy "Allow all updates" on public.workspace_memberships for update using (true);
create policy "Allow all deletes" on public.workspace_memberships for delete using (true);
```



### Vercel Deployment (Free Tier)

1. Create account at [vercel.com](https://vercel.com)
2. Install Vercel CLI (optional):

```bash
npm i -g vercel
```

#### Deploy via CLI:

```bash
vercel
```

#### Deploy via Dashboard:

1. Import Git repository
2. Configure project:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

Your app will be live at `your-project.vercel.app`

## Tech Stack

- Next.js 15 (App Router)
- React 19
- Supabase (auth & database)
- TypeScript
- Vitest (unit tests)
- Playwright (E2E tests)
