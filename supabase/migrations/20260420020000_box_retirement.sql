alter table if exists public.boxes
  add column if not exists retired_at timestamptz;

create index if not exists boxes_workspace_box_retired_at_idx
  on public.boxes (workspace_id, box_id, retired_at);
