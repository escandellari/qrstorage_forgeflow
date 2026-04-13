import { getSupabaseBrowserClient } from '@/src/features/auth/supabaseBrowserClient';

export type BoxDetails = {
  id: string;
  workspaceId: string;
  boxId: string;
  name: string | null;
  location: string | null;
  notes: string | null;
  labelTarget: string | null;
};

export type BoxDetailsDraft = {
  name: string;
  location: string;
  notes: string;
  labelTarget: string;
};

type BoxRow = {
  id: string;
  workspace_id: string;
  box_id: string;
  name: string | null;
  location: string | null;
  notes: string | null;
  label_target: string | null;
};

const BOX_DETAILS_SELECT = 'id, workspace_id, box_id, name, location, notes, label_target';

function mapBoxRow(row: BoxRow): BoxDetails {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    boxId: row.box_id,
    name: row.name,
    location: row.location,
    notes: row.notes,
    labelTarget: row.label_target,
  };
}

export function createBoxDetailsDraft(box: BoxDetails): BoxDetailsDraft {
  return {
    name: box.name ?? '',
    location: box.location ?? '',
    notes: box.notes ?? '',
    labelTarget: box.labelTarget ?? '',
  };
}

function normaliseDraftValue(value: string): string | null {
  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
}

function mapDraftToBoxUpdate(draft: BoxDetailsDraft) {
  return {
    name: normaliseDraftValue(draft.name),
    location: normaliseDraftValue(draft.location),
    notes: normaliseDraftValue(draft.notes),
    label_target: normaliseDraftValue(draft.labelTarget),
  };
}

export async function getBoxDetails(workspaceId: string, boxId: string): Promise<BoxDetails | null> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('boxes')
    .select(BOX_DETAILS_SELECT)
    .eq('workspace_id', workspaceId)
    .eq('box_id', boxId);

  if (error) {
    throw error;
  }

  const row = data[0] as BoxRow | undefined;

  return row ? mapBoxRow(row) : null;
}

export async function updateBoxDetails(
  workspaceId: string,
  boxId: string,
  draft: BoxDetailsDraft,
): Promise<BoxDetails> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('boxes')
    .update(mapDraftToBoxUpdate(draft))
    .eq('workspace_id', workspaceId)
    .eq('box_id', boxId)
    .select(BOX_DETAILS_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return mapBoxRow(data as BoxRow);
}
