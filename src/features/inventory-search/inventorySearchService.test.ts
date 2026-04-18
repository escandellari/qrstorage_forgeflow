import type { SearchResult } from './inventorySearchService';
import { searchInventory, sortResults } from './inventorySearchService';

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

  describe('searchInventory', () => {
    it('calls rpc search_inventory with query_input and workspace_id_input and maps rows to SearchResult', async () => {
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
          {
            box_row_id: 'box-row-1',
            box_id: 'BOX-0001',
            box_name: 'Winter clothes',
            location: 'Hall cupboard',
            rank: 0.2,
            rank_source: 'item',
            match_context: 'item name: Beanies',
          },
        ],
        error: null,
      });

      const results = await searchInventory('winter', 'workspace-1');

      expect(rpcMock).toHaveBeenCalledWith('search_inventory', {
        query_input: 'winter',
        workspace_id_input: 'workspace-1',
      });

      expect(results).toEqual<SearchResult[]>([
        {
          boxRowId: 'box-row-1',
          boxId: 'BOX-0001',
          boxName: 'Winter clothes',
          location: 'Hall cupboard',
          rank: 0.5,
          rankSource: 'box',
          matchContext: 'box name: Winter clothes',
        },
        {
          boxRowId: 'box-row-1',
          boxId: 'BOX-0001',
          boxName: 'Winter clothes',
          location: 'Hall cupboard',
          rank: 0.2,
          rankSource: 'item',
          matchContext: 'item name: Beanies',
        },
      ]);
    });

    it('returns an empty array when the RPC returns null data', async () => {
      rpcMock.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(searchInventory('winter', 'workspace-1')).resolves.toEqual([]);
    });
  });

  describe('sortResults', () => {
    it('places box-level results before item-level results', () => {
      const itemResult: SearchResult = {
        boxRowId: 'box-row-1',
        boxId: 'BOX-0001',
        boxName: 'Winter clothes',
        location: 'Hall cupboard',
        rank: 0.9,
        rankSource: 'item',
        matchContext: 'item name: Beanies',
      };
      const boxResult: SearchResult = {
        boxRowId: 'box-row-2',
        boxId: 'BOX-0002',
        boxName: 'Summer gear',
        location: 'Loft',
        rank: 0.3,
        rankSource: 'box',
        matchContext: 'box name: Summer gear',
      };

      expect(sortResults([itemResult, boxResult])).toEqual([boxResult, itemResult]);
    });

    it('places equal rank_source results in ascending boxId order', () => {
      const resultC: SearchResult = {
        boxRowId: 'box-row-3',
        boxId: 'BOX-0003',
        boxName: 'Tools',
        location: 'Garage',
        rank: 0.5,
        rankSource: 'box',
        matchContext: 'box name: Tools',
      };
      const resultA: SearchResult = {
        boxRowId: 'box-row-1',
        boxId: 'BOX-0001',
        boxName: 'Winter clothes',
        location: 'Hall cupboard',
        rank: 0.5,
        rankSource: 'box',
        matchContext: 'box name: Winter clothes',
      };
      const resultB: SearchResult = {
        boxRowId: 'box-row-2',
        boxId: 'BOX-0002',
        boxName: 'Summer gear',
        location: 'Loft',
        rank: 0.5,
        rankSource: 'box',
        matchContext: 'box name: Summer gear',
      };

      expect(sortResults([resultC, resultA, resultB])).toEqual([resultA, resultB, resultC]);
    });
  });
});
