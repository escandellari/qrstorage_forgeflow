import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import InventorySearchRoute from '../../../app/search/page';

const {
  getActiveWorkspaceMock,
  searchInventoryMock,
} = vi.hoisted(() => ({
  getActiveWorkspaceMock: vi.fn(),
  searchInventoryMock: vi.fn(),
}));

vi.mock('@/src/features/workspace-access', () => ({
  getActiveWorkspace: getActiveWorkspaceMock,
}));

vi.mock('./inventorySearchService', () => ({
  searchInventory: searchInventoryMock,
  sortResults: (results: unknown[]) => results,
}));

const activeWorkspace = {
  workspaceId: 'workspace-1',
  workspaceName: 'Home Base',
};

const boxResult = {
  boxRowId: 'box-row-1',
  boxId: 'BOX-0001',
  boxName: 'Winter clothes',
  location: 'Hall cupboard',
  rank: 0.5,
  rankSource: 'box',
  matchContext: 'box name: Winter clothes',
};

const itemResult = {
  boxRowId: 'box-row-1',
  boxId: 'BOX-0001',
  boxName: 'Winter clothes',
  location: 'Hall cupboard',
  rank: 0.2,
  rankSource: 'item',
  matchContext: 'item name: Beanies',
};

function renderSearchRoute() {
  render(<InventorySearchRoute />);
}

function mockActiveWorkspace() {
  getActiveWorkspaceMock.mockResolvedValue(activeWorkspace);
}

describe('InventorySearchPage', () => {
  beforeEach(() => {
    getActiveWorkspaceMock.mockReset();
    searchInventoryMock.mockReset();
  });

  it('renders a result row showing box name, box ID, location, and match_context', async () => {
    mockActiveWorkspace();
    searchInventoryMock.mockResolvedValue([boxResult]);

    renderSearchRoute();

    await act(async () => {
      fireEvent.change(await screen.findByLabelText('Search'), {
        target: { value: 'winter' },
      });
      fireEvent.submit(screen.getByRole('form'));
    });

    await waitFor(() => {
      expect(screen.getByText('Winter clothes')).toBeVisible();
    });

    expect(screen.getByText('BOX-0001')).toBeVisible();
    expect(screen.getByText('Hall cupboard')).toBeVisible();
    expect(screen.getByText('box name: Winter clothes')).toBeVisible();

    const link = screen.getByRole('link', { name: /BOX-0001/i });
    expect(link).toHaveAttribute('href', '/boxes/BOX-0001');
  });

  it('shows inline error and hides form when getActiveWorkspace returns null', async () => {
    getActiveWorkspaceMock.mockResolvedValue(null);

    renderSearchRoute();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not load the search. Sign in again.',
    );
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });

  it('shows retryable error without clearing results when RPC fails', async () => {
    mockActiveWorkspace();
    searchInventoryMock.mockResolvedValueOnce([boxResult]);

    renderSearchRoute();

    await act(async () => {
      fireEvent.change(await screen.findByLabelText('Search'), {
        target: { value: 'winter' },
      });
      fireEvent.submit(screen.getByRole('form'));
    });

    await waitFor(() => {
      expect(screen.getByText('Winter clothes')).toBeVisible();
    });

    searchInventoryMock.mockRejectedValueOnce(new Error('rpc failed'));

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Search'), {
        target: { value: 'summer' },
      });
      fireEvent.submit(screen.getByRole('form'));
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Search failed. Try again.');
    });

    expect(screen.getByText('Winter clothes')).toBeVisible();
  });

  it('does not call service on keystrokes, only on explicit submit', async () => {
    mockActiveWorkspace();
    searchInventoryMock.mockResolvedValue([]);

    renderSearchRoute();

    const input = await screen.findByLabelText('Search');
    fireEvent.change(input, { target: { value: 'w' } });
    fireEvent.change(input, { target: { value: 'wi' } });
    fireEvent.change(input, { target: { value: 'win' } });

    expect(searchInventoryMock).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.submit(screen.getByRole('form'));
    });

    expect(searchInventoryMock).toHaveBeenCalledTimes(1);
  });
});
