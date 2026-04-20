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

async function callWorkspaceMembersRpc<T>(
  rpcName: 'list_workspace_members' | 'leave_workspace' | 'remove_workspace_member',
  args: Record<string, string>,
): Promise<T> {
  const { data, error } = await getSupabaseBrowserClient().rpc(rpcName, args);

  if (error) {
    throw error;
  }

  return data as T;
}

export async function listWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const data = await callWorkspaceMembersRpc<WorkspaceMemberRow[]>('list_workspace_members', {
    workspace_id_input: workspaceId,
  });

  return (data ?? []).map(mapWorkspaceMemberRow);
}

export async function leaveWorkspace(workspaceId: string) {
  await callWorkspaceMembersRpc('leave_workspace', {
    workspace_id_input: workspaceId,
  });
}

export async function removeWorkspaceMember(workspaceId: string, memberUserId: string) {
  await callWorkspaceMembersRpc('remove_workspace_member', {
    workspace_id_input: workspaceId,
    member_user_id_input: memberUserId,
  });
}
