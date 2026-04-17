-- Migration: search_inventory RPC
-- Full-text search across boxes and items for a workspace.
-- Returns box-centred results with rank_source ('box' | 'item') and match_context.

CREATE OR REPLACE FUNCTION search_inventory(
  query_input text,
  workspace_id_input uuid
)
RETURNS TABLE (
  box_row_id uuid,
  box_id     text,
  box_name   text,
  location   text,
  rank       real,
  rank_source text,
  match_context text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  -- Box-level matches: box_id, name, location, notes
  SELECT
    b.id                                  AS box_row_id,
    b.box_id,
    b.name                                AS box_name,
    b.location,
    ts_rank(
      to_tsvector('english',
        coalesce(b.box_id, '') || ' ' ||
        coalesce(b.name, '') || ' ' ||
        coalesce(b.location, '') || ' ' ||
        coalesce(b.notes, '')
      ),
      plainto_tsquery('english', query_input)
    )                                     AS rank,
    'box'::text                           AS rank_source,
    CASE
      WHEN b.box_id    ILIKE '%' || query_input || '%' THEN 'box ID: '       || b.box_id
      WHEN b.name      ILIKE '%' || query_input || '%' THEN 'box name: '     || b.name
      WHEN b.location  ILIKE '%' || query_input || '%' THEN 'location: '     || b.location
      WHEN b.notes     ILIKE '%' || query_input || '%' THEN 'box notes: '    || b.notes
      ELSE 'box: ' || coalesce(b.name, b.box_id)
    END                                   AS match_context
  FROM boxes b
  WHERE
    b.workspace_id = workspace_id_input
    AND to_tsvector('english',
          coalesce(b.box_id, '') || ' ' ||
          coalesce(b.name, '') || ' ' ||
          coalesce(b.location, '') || ' ' ||
          coalesce(b.notes, '')
        ) @@ plainto_tsquery('english', query_input)

  UNION ALL

  -- Item-level matches: name, category, notes, quantity (as text)
  SELECT
    b.id                                  AS box_row_id,
    b.box_id,
    b.name                                AS box_name,
    b.location,
    ts_rank(
      to_tsvector('english',
        coalesce(i.name, '') || ' ' ||
        coalesce(i.category, '') || ' ' ||
        coalesce(i.notes, '') || ' ' ||
        coalesce(i.quantity::text, '')
      ),
      plainto_tsquery('english', query_input)
    )                                     AS rank,
    'item'::text                          AS rank_source,
    CASE
      WHEN i.name     ILIKE '%' || query_input || '%' THEN 'item name: '     || i.name
      WHEN i.category ILIKE '%' || query_input || '%' THEN 'item category: ' || i.category
      WHEN i.notes    ILIKE '%' || query_input || '%' THEN 'item notes: '    || i.notes
      WHEN i.quantity::text = query_input             THEN 'quantity: '      || i.quantity::text
      ELSE 'item: ' || coalesce(i.name, 'unknown')
    END                                   AS match_context
  FROM items i
  JOIN boxes b ON b.id = i.box_id
  WHERE
    b.workspace_id = workspace_id_input
    AND to_tsvector('english',
          coalesce(i.name, '') || ' ' ||
          coalesce(i.category, '') || ' ' ||
          coalesce(i.notes, '') || ' ' ||
          coalesce(i.quantity::text, '')
        ) @@ plainto_tsquery('english', query_input)

  ORDER BY rank_source ASC, box_id ASC;
$$;
