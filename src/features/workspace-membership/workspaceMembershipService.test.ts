import { createWorkspaceForOwner } from './workspaceMembershipService';

const deleteMock = vi.fn();
const singleMock = vi.fn();
const selectMock = vi.fn();
const insertMock = vi.fn();
const eqMock = vi.fn();
const fromMock = vi.fn();

vi.mock('@/src/features/auth/supabaseBrowserClient', () => ({
  getSupabaseBrowserClient: () => ({
    from: fromMock,
  }),
}));

describe('createWorkspaceForOwner', () => {
  beforeEach(() => {
    deleteMock.mockReset();
    singleMock.mockReset();
    selectMock.mockReset();
    insertMock.mockReset();
    eqMock.mockReset();
    fromMock.mockReset();
  });

  it('deletes the created workspace when owner membership creation fails', async () => {
    const membershipError = new Error('membership insert failed');

    singleMock.mockResolvedValueOnce({
      data: { id: 'workspace-1', name: 'Home Base' },
      error: null,
    });
    insertMock.mockImplementationOnce(() => ({
      select: selectMock,
    }));
    selectMock.mockReturnValueOnce({
      single: singleMock,
    });

    insertMock.mockResolvedValueOnce({
      error: membershipError,
    });

    deleteMock.mockReturnValue({
      eq: eqMock,
    });
    eqMock.mockResolvedValue({
      error: null,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'workspaces') {
        return {
          insert: insertMock,
          delete: deleteMock,
        };
      }

      if (table === 'workspace_memberships') {
        return {
          insert: insertMock,
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    await expect(createWorkspaceForOwner('user-1', 'Home Base')).rejects.toThrow(
      'membership insert failed',
    );
    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(eqMock).toHaveBeenCalledWith('id', 'workspace-1');
  });
});
