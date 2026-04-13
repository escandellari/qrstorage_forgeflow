import { getSupabaseBrowserClient } from '@/src/features/auth/supabaseBrowserClient';

export type BoxSummary = {
  id: string;
  workspaceId: string;
  boxId: string;
  name: string | null;
};

type BoxRow = {
  id: string;
  workspace_id: string;
  box_id: string;
  name: string | null;
};

function mapBoxRow(row: BoxRow): BoxSummary {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    boxId: row.box_id,
    name: row.name,
  };
}

export async function listBoxes(workspaceId: string): Promise<BoxSummary[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('boxes')
    .select('id, workspace_id, box_id, name')
    .eq('workspace_id', workspaceId);

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapBoxRow);
}

export async function createBox(
  workspaceId: string,
  name: string | null,
): Promise<BoxSummary> {
  const { data, error } = await getSupabaseBrowserClient().rpc('create_box', {
    workspace_id_input: workspaceId,
    name_input: name,
  });

  if (error) {
    throw error;
  }

  return mapBoxRow(data as BoxRow);
}
