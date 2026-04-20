import { getSupabaseBrowserClient } from '@/src/features/auth/supabaseBrowserClient';

export type BoxRouteState = 'active' | 'deleted' | 'access-denied';

type BoxRouteRow = {
  id: string;
};

const BOX_ROUTE_SELECT = 'id';

async function findBoxByRetirementState(
  workspaceId: string,
  boxId: string,
  retirementState: 'active' | 'deleted',
) {
  const baseQuery = getSupabaseBrowserClient()
    .from('boxes')
    .select(BOX_ROUTE_SELECT)
    .eq('workspace_id', workspaceId)
    .eq('box_id', boxId);

  const { data, error } =
    retirementState === 'active'
      ? await baseQuery.is('retired_at', null)
      : await baseQuery.not('retired_at', 'is', null);

  if (error) {
    throw error;
  }

  return (data?.[0] as BoxRouteRow | undefined) ?? null;
}

export async function getBoxRouteState(
  workspaceId: string,
  boxId: string,
): Promise<BoxRouteState> {
  if (await findBoxByRetirementState(workspaceId, boxId, 'active')) {
    return 'active';
  }

  if (await findBoxByRetirementState(workspaceId, boxId, 'deleted')) {
    return 'deleted';
  }

  return 'access-denied';
}

export async function retireBox(workspaceId: string, boxId: string): Promise<void> {
  const { error } = await getSupabaseBrowserClient()
    .from('boxes')
    .update({ retired_at: new Date().toISOString() })
    .eq('workspace_id', workspaceId)
    .eq('box_id', boxId)
    .is('retired_at', null);

  if (error) {
    throw error;
  }
}
