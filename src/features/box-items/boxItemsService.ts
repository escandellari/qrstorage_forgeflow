import { getSupabaseBrowserClient } from '@/src/features/auth/supabaseBrowserClient';

export type BoxItem = {
  id: string;
  boxId: string;
  name: string;
  category: string | null;
  notes: string | null;
  quantity: number | null;
};

export type BoxItemDraft = {
  name: string;
  category: string;
  notes: string;
  quantity: string;
};

type ItemRow = {
  id: string;
  box_id: string;
  name: string;
  category: string | null;
  notes: string | null;
  quantity: number | null;
};

const ITEM_SELECT = 'id, box_id, name, category, notes, quantity';

function mapItemRow(row: ItemRow): BoxItem {
  return {
    id: row.id,
    boxId: row.box_id,
    name: row.name,
    category: row.category,
    notes: row.notes,
    quantity: row.quantity,
  };
}

function normaliseText(value: string): string | null {
  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
}

function normaliseQuantity(value: string): number | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  return Number.parseInt(trimmedValue, 10);
}

function mapDraftToItemRow(boxId: string, draft: BoxItemDraft) {
  return {
    box_id: boxId,
    name: draft.name.trim(),
    category: normaliseText(draft.category),
    notes: normaliseText(draft.notes),
    quantity: normaliseQuantity(draft.quantity),
  };
}

export function createBoxItemDraft(item?: BoxItem): BoxItemDraft {
  return {
    name: item?.name ?? '',
    category: item?.category ?? '',
    notes: item?.notes ?? '',
    quantity: item?.quantity?.toString() ?? '',
  };
}

export async function listBoxItems(boxId: string): Promise<BoxItem[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('items')
    .select(ITEM_SELECT)
    .eq('box_id', boxId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapItemRow(row as ItemRow));
}

export async function createBoxItem(boxId: string, draft: BoxItemDraft): Promise<BoxItem> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('items')
    .insert(mapDraftToItemRow(boxId, draft))
    .select(ITEM_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return mapItemRow(data as ItemRow);
}

export async function updateBoxItem(itemId: string, boxId: string, draft: BoxItemDraft): Promise<BoxItem> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('items')
    .update(mapDraftToItemRow(boxId, draft))
    .eq('id', itemId)
    .select(ITEM_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return mapItemRow(data as ItemRow);
}

export async function removeBoxItem(itemId: string): Promise<void> {
  const { error } = await getSupabaseBrowserClient().from('items').delete().eq('id', itemId);

  if (error) {
    throw error;
  }
}
