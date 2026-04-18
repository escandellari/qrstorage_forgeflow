import { getSupabaseBrowserClient } from '@/src/features/auth/supabaseBrowserClient';

export type SearchResult = {
  boxRowId: string;
  boxId: string;
  boxName: string | null;
  location: string | null;
  rank: number;
  rankSource: 'box' | 'item';
  matchContext: string;
};

type SearchResultRow = {
  box_row_id: string;
  box_id: string;
  box_name: string | null;
  location: string | null;
  rank: number;
  rank_source: 'box' | 'item';
  match_context: string;
};

function mapSearchResultRow(row: SearchResultRow): SearchResult {
  return {
    boxRowId: row.box_row_id,
    boxId: row.box_id,
    boxName: row.box_name,
    location: row.location,
    rank: row.rank,
    rankSource: row.rank_source,
    matchContext: row.match_context,
  };
}

export async function searchInventory(query: string, workspaceId: string): Promise<SearchResult[]> {
  const { data, error } = await getSupabaseBrowserClient().rpc('search_inventory', {
    query_input: query,
    workspace_id_input: workspaceId,
  });

  if (error) {
    throw error;
  }

  return ((data ?? []) as SearchResultRow[]).map(mapSearchResultRow);
}
