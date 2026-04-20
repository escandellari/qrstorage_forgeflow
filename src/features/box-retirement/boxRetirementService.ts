import { getSupabaseBrowserClient } from '@/src/features/auth/supabaseBrowserClient';

export type BoxRouteState = 'active' | 'deleted' | 'access-denied';

type BoxRouteRow = {
  id: string;
};

async function findActiveBox(workspaceId: string, boxId: string) {
  const { data, error } = await getSupabaseBrowserClient()
    .from('boxes')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('box_id', boxId)
    .is('retired_at', null);

  if (error) {
    throw error;
  }

  return (data?.[0] as BoxRouteRow | undefined) ?? null;
}

async function findRetiredBox(workspaceId: string, boxId: string) {
  const { data, error } = await getSupabaseBrowserClient()
    .from('boxes')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('box_id', boxId)
    .not('retired_at', 'is', null);

  if (error) {
    throw error;
  }

  return (data?.[0] as BoxRouteRow | undefined) ?? null;
}

export async function getBoxRouteState(
  workspaceId: string,
  boxId: string,
): Promise<BoxRouteState> {
  if (await findActiveBox(workspaceId, boxId)) {
    return 'active';
  }

  if (await findRetiredBox(workspaceId, boxId)) {
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
