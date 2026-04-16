import { getSupabaseBrowserClient } from '@/src/features/auth/supabaseBrowserClient';

export { BoxAccessGate } from './BoxAccessGate';

export type ActiveWorkspace = {
  workspaceId: string;
  workspaceName: string | null;
};

export async function getActiveWorkspace(): Promise<ActiveWorkspace | null> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('workspace_memberships')
    .select('workspace_id');

  if (error) {
    throw error;
  }

  const membership = data[0];

  if (!membership) {
    return null;
  }

  return {
    workspaceId: membership.workspace_id,
    workspaceName: null,
  };
}
