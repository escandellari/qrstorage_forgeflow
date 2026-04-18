import { searchInventory } from './inventorySearchService';

const rpcMock = vi.fn();

vi.mock('@/src/features/auth/supabaseBrowserClient', () => ({
  getSupabaseBrowserClient: () => ({
    rpc: rpcMock,
  }),
}));

describe('inventorySearchService', () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it('calls search_inventory and maps snake_case RPC rows into SearchResult values', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          box_row_id: 'box-row-1',
          box_id: 'BOX-0001',
          box_name: 'Winter clothes',
          location: 'Hall cupboard',
          rank: 0.5,
          rank_source: 'box',
          match_context: 'box name: Winter clothes',
        },
      ],
      error: null,
    });

    await expect(searchInventory('winter', 'workspace-1')).resolves.toEqual([
      {
        boxRowId: 'box-row-1',
        boxId: 'BOX-0001',
        boxName: 'Winter clothes',
        location: 'Hall cupboard',
        rank: 0.5,
        rankSource: 'box',
        matchContext: 'box name: Winter clothes',
      },
    ]);

    expect(rpcMock).toHaveBeenCalledWith('search_inventory', {
      query_input: 'winter',
      workspace_id_input: 'workspace-1',
    });
  });
});
