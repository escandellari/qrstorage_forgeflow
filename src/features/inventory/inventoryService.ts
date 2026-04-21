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
    .eq('workspace_id', workspaceId)
    .is('retired_at', null);

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapBoxRow);
}

export async function createBox(
  workspaceId: string,
  name: string | null,
): Promise<BoxSummary> {
  // Generate box_id based on current count
  const { data: existingBoxes } = await getSupabaseBrowserClient()
    .from('boxes')
    .select('box_id')
    .eq('workspace_id', workspaceId);
  
  const nextNumber = (existingBoxes?.length ?? 0) + 1;
  const boxId = `BOX-${String(nextNumber).padStart(4, '0')}`;

  const { data, error } = await getSupabaseBrowserClient()
    .from('boxes')
    .insert({
      workspace_id: workspaceId,
      box_id: boxId,
      name: name,
    })
    .select('id, workspace_id, box_id, name')
    .single();

  if (error) {
    throw error;
  }

  return mapBoxRow(data as unknown as BoxRow);
}
