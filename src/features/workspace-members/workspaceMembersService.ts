import { getSupabaseBrowserClient } from '@/src/features/auth/supabaseBrowserClient';

export type WorkspaceMember = {
  userId: string;
  role: 'owner' | 'member';
  isCurrentUser: boolean;
};

type WorkspaceMemberRow = {
  userId: string;
  role: 'owner' | 'member';
  isCurrentUser: boolean;
};

function mapWorkspaceMemberRow(row: WorkspaceMemberRow): WorkspaceMember {
  return {
    userId: row.userId,
    role: row.role,
    isCurrentUser: row.isCurrentUser,
  };
}

export async function listWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const { data, error } = await getSupabaseBrowserClient().rpc('list_workspace_members', {
    workspace_id_input: workspaceId,
  });

  if (error) {
    throw error;
  }

  return ((data ?? []) as WorkspaceMemberRow[]).map(mapWorkspaceMemberRow);
}

export async function leaveWorkspace(workspaceId: string) {
  const { error } = await getSupabaseBrowserClient().rpc('leave_workspace', {
    workspace_id_input: workspaceId,
  });

  if (error) {
    throw error;
  }
}

export async function removeWorkspaceMember(workspaceId: string, memberUserId: string) {
  const { error } = await getSupabaseBrowserClient().rpc('remove_workspace_member', {
    workspace_id_input: workspaceId,
    member_user_id_input: memberUserId,
  });

  if (error) {
    throw error;
  }
}
