import { getSupabaseBrowserClient } from '@/src/features/auth/supabaseBrowserClient';

export type BoxRouteState = 'active' | 'deleted' | 'access-denied';

type BoxRouteRow = {
  id: string;
  retired_at: string | null;
};

const BOX_ROUTE_SELECT = 'id';

async function findBoxByRetirementState(
  workspaceId: string,
  boxId: string,
  state: 'active' | 'deleted',
): Promise<BoxRouteRow | null> {
  console.log('Querying boxes for:', { workspaceId, boxId });
  
  const { data, error } = await getSupabaseBrowserClient()
    .from('boxes')
    .select('id, retired_at')
    .eq('workspace_id', workspaceId)
    .eq('box_id', boxId)
    .limit(1);

  console.log('Box result:', { data: data?.length, error });

  if (error || !data?.length) {
    console.log('No box found');
    return null;
  }

  const row = data[0] as BoxRouteRow;
  const isActive = row.retired_at === null;
  
  console.log('Box is active:', isActive);
  
  return (state === 'active' && isActive) || (state === 'deleted' && !isActive) ? row : null;
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
