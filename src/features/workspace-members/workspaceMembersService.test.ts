import {
  leaveWorkspace,
  listWorkspaceMembers,
  removeWorkspaceMember,
} from './workspaceMembersService';

const rpcMock = vi.fn();

vi.mock('@/src/features/auth/supabaseBrowserClient', () => ({
  getSupabaseBrowserClient: () => ({
    rpc: rpcMock,
  }),
}));

describe('workspaceMembersService', () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it('lists workspace members through the list_workspace_members rpc', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          userId: 'user-1',
          role: 'owner',
          isCurrentUser: true,
        },
      ],
      error: null,
    });

    await expect(listWorkspaceMembers('workspace-1')).resolves.toEqual([
      {
        userId: 'user-1',
        role: 'owner',
        isCurrentUser: true,
      },
    ]);
    expect(rpcMock).toHaveBeenCalledWith('list_workspace_members', {
      workspace_id_input: 'workspace-1',
    });
  });

  it('leaves the workspace through the leave_workspace rpc', async () => {
    rpcMock.mockResolvedValue({
      data: { status: 'left' },
      error: null,
    });

    await expect(leaveWorkspace('workspace-1')).resolves.toBeUndefined();
    expect(rpcMock).toHaveBeenCalledWith('leave_workspace', {
      workspace_id_input: 'workspace-1',
    });
  });

  it('removes another member through the remove_workspace_member rpc', async () => {
    rpcMock.mockResolvedValue({
      data: { status: 'removed' },
      error: null,
    });

    await expect(removeWorkspaceMember('workspace-1', 'user-2')).resolves.toBeUndefined();
    expect(rpcMock).toHaveBeenCalledWith('remove_workspace_member', {
      workspace_id_input: 'workspace-1',
      member_user_id_input: 'user-2',
    });
  });
});
