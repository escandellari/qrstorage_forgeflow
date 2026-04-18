create or replace function public.search_inventory(
  query_input text,
  workspace_id_input uuid
)
returns table (
  box_row_id uuid,
  box_id text,
  box_name text,
  location text,
  rank real,
  rank_source text,
  match_context text
)
language sql
stable
as $$
  with normalised_query as (
    select nullif(trim(query_input), '') as value
  ),
  parsed_query as (
    select plainto_tsquery('simple', value) as ts_query
    from normalised_query
    where value is not null
  ),
  box_matches as (
    select
      b.id as box_row_id,
      b.box_id,
      b.name as box_name,
      b.location,
      ts_rank(
        setweight(to_tsvector('simple', coalesce(b.box_id, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(b.name, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(b.location, '')), 'B') ||
        setweight(to_tsvector('simple', coalesce(b.notes, '')), 'B'),
        q.ts_query
      ) as rank,
      'box'::text as rank_source,
      case
        when to_tsvector('simple', coalesce(b.box_id, '')) @@ q.ts_query then 'box ID: ' || b.box_id
        when to_tsvector('simple', coalesce(b.name, '')) @@ q.ts_query then 'box name: ' || coalesce(b.name, 'Unnamed box')
        when to_tsvector('simple', coalesce(b.location, '')) @@ q.ts_query then 'location: ' || coalesce(b.location, 'Not set')
        else 'box notes: ' || coalesce(b.notes, 'Not set')
      end as match_context
    from parsed_query q
    join public.boxes b on b.workspace_id = workspace_id_input
    where (
      setweight(to_tsvector('simple', coalesce(b.box_id, '')), 'A') ||
      setweight(to_tsvector('simple', coalesce(b.name, '')), 'A') ||
      setweight(to_tsvector('simple', coalesce(b.location, '')), 'B') ||
      setweight(to_tsvector('simple', coalesce(b.notes, '')), 'B')
    ) @@ q.ts_query
  ),
  item_matches as (
    select
      b.id as box_row_id,
      b.box_id,
      b.name as box_name,
      b.location,
      ts_rank(
        setweight(to_tsvector('simple', coalesce(i.name, '')), 'B') ||
        setweight(to_tsvector('simple', coalesce(i.category, '')), 'C') ||
        setweight(to_tsvector('simple', coalesce(i.notes, '')), 'C') ||
        setweight(to_tsvector('simple', coalesce(i.quantity::text, '')), 'D'),
        q.ts_query
      ) as rank,
      'item'::text as rank_source,
      case
        when to_tsvector('simple', coalesce(i.name, '')) @@ q.ts_query then 'item name: ' || i.name
        when to_tsvector('simple', coalesce(i.category, '')) @@ q.ts_query then 'item category: ' || coalesce(i.category, 'Not set')
        when to_tsvector('simple', coalesce(i.notes, '')) @@ q.ts_query then 'item notes: ' || coalesce(i.notes, 'Not set')
        else 'item quantity: ' || coalesce(i.quantity::text, 'Not set')
      end as match_context
    from parsed_query q
    join public.boxes b on b.workspace_id = workspace_id_input
    join public.items i on i.box_id = b.id
    where (
      setweight(to_tsvector('simple', coalesce(i.name, '')), 'B') ||
      setweight(to_tsvector('simple', coalesce(i.category, '')), 'C') ||
      setweight(to_tsvector('simple', coalesce(i.notes, '')), 'C') ||
      setweight(to_tsvector('simple', coalesce(i.quantity::text, '')), 'D')
    ) @@ q.ts_query
  )
  select *
  from (
    select * from box_matches
    union all
    select * from item_matches
  ) ranked_matches
  order by
    case when rank_source = 'box' then 0 else 1 end,
    rank desc,
    box_id asc;
$$;
