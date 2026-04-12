import { getSupabaseBrowserClient } from '@/src/features/auth/supabaseBrowserClient';

export type WorkspaceMembership = {
  workspaceId: string;
  workspaceName: string | null;
};

export async function exchangeAuthCodeForSession(authCode: string) {
  return getSupabaseBrowserClient().auth.exchangeCodeForSession(authCode);
}

export async function findWorkspaceMembership(userId: string): Promise<WorkspaceMembership | null> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('workspace_memberships')
    .select('workspace_id')
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  const membership = data[0];

  if (!membership) {
    return null;
  }

  const { data: workspace, error: workspaceError } = await getSupabaseBrowserClient()
    .from('workspaces')
    .select('id, name')
    .eq('id', membership.workspace_id)
    .single();

  if (workspaceError) {
    throw workspaceError;
  }

  return {
    workspaceId: membership.workspace_id,
    workspaceName: workspace.name,
  };
}

export async function createWorkspaceForOwner(userId: string, workspaceName: string) {
  const { data: workspace, error: workspaceError } = await getSupabaseBrowserClient()
    .from('workspaces')
    .insert({ name: workspaceName })
    .select('id, name')
    .single();

  if (workspaceError) {
    throw workspaceError;
  }

  const { error: membershipError } = await getSupabaseBrowserClient().from('workspace_memberships').insert({
    workspace_id: workspace.id,
    user_id: userId,
    role: 'owner',
  });

  if (membershipError) {
    throw membershipError;
  }

  return {
    workspaceId: workspace.id,
    workspaceName: workspace.name,
  };
}
