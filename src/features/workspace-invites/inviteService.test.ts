import { createWorkspaceInvite } from './inviteService';

const rpcMock = vi.fn();

vi.mock('@/src/features/auth/supabaseBrowserClient', () => ({
  getSupabaseBrowserClient: () => ({
    rpc: rpcMock,
    auth: {
      getSession: vi.fn(),
    },
  }),
}));

describe('inviteService', () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it('rejects a blank invited email before calling the RPC', async () => {
    rpcMock.mockResolvedValue({
      data: {
        token: 'invite-token',
        invitedEmail: 'pat@example.com',
      },
      error: null,
    });

    await expect(createWorkspaceInvite('workspace-1', '   ')).rejects.toThrow('Enter an email address.');
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('calls the create_workspace_invite rpc with the normalised email address', async () => {
    rpcMock.mockResolvedValue({
      data: {
        token: 'invite-token',
        invitedEmail: 'pat@example.com',
      },
      error: null,
    });

    await expect(createWorkspaceInvite('workspace-1', '  Pat@example.com ')).resolves.toEqual({
      token: 'invite-token',
      invitedEmail: 'pat@example.com',
    });
    expect(rpcMock).toHaveBeenCalledWith('create_workspace_invite', {
      workspace_id_input: 'workspace-1',
      invited_email_input: 'pat@example.com',
    });
  });
});
