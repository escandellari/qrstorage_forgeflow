import { createBox, listBoxes } from './inventoryService';

const selectMock = vi.fn();
const eqMock = vi.fn();
const fromMock = vi.fn();
const rpcMock = vi.fn();

vi.mock('@/src/features/auth/supabaseBrowserClient', () => ({
  getSupabaseBrowserClient: () => ({
    from: fromMock,
    rpc: rpcMock,
  }),
}));

describe('inventoryService', () => {
  beforeEach(() => {
    selectMock.mockReset();
    eqMock.mockReset();
    fromMock.mockReset();
    rpcMock.mockReset();
  });

  it('returns an empty list when the workspace has no boxes', async () => {
    eqMock.mockResolvedValue({
      data: null,
      error: null,
    });
    selectMock.mockReturnValue({
      eq: eqMock,
    });
    fromMock.mockReturnValue({
      select: selectMock,
    });

    await expect(listBoxes('workspace-1')).resolves.toEqual([]);
    expect(fromMock).toHaveBeenCalledWith('boxes');
    expect(selectMock).toHaveBeenCalledWith('id, workspace_id, box_id, name');
    expect(eqMock).toHaveBeenCalledWith('workspace_id', 'workspace-1');
  });

  it('calls the create_box rpc with the provided name and maps the created box', async () => {
    rpcMock.mockResolvedValue({
      data: {
        id: 'box-row-1',
        workspace_id: 'workspace-1',
        box_id: 'BOX-0001',
        name: 'Winter clothes',
      },
      error: null,
    });

    await expect(createBox('workspace-1', 'Winter clothes')).resolves.toEqual({
      id: 'box-row-1',
      workspaceId: 'workspace-1',
      boxId: 'BOX-0001',
      name: 'Winter clothes',
    });
    expect(rpcMock).toHaveBeenCalledWith('create_box', {
      workspace_id_input: 'workspace-1',
      name_input: 'Winter clothes',
    });
  });
});
