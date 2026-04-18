import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { activeWorkspace } from '@/src/features/workspace-access/testFixtures';
import InventorySearchRoute from '../../../app/search/page';

const {
  getActiveWorkspaceMock,
  searchInventoryMock,
  sortResultsMock,
} = vi.hoisted(() => ({
  getActiveWorkspaceMock: vi.fn(),
  searchInventoryMock: vi.fn(),
  sortResultsMock: vi.fn((results: unknown[]) => results),
}));

vi.mock('@/src/features/workspace-access', () => ({
  getActiveWorkspace: getActiveWorkspaceMock,
}));

vi.mock('./inventorySearchService', () => ({
  searchInventory: searchInventoryMock,
  sortResults: sortResultsMock,
}));

const boxResult = {
  boxRowId: 'box-row-1',
  boxId: 'BOX-0001',
  boxName: 'Winter clothes',
  location: 'Hall cupboard',
  rank: 0.5,
  rankSource: 'box' as const,
  matchContext: 'box name: Winter clothes',
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
    sortResultsMock.mockReset();
    sortResultsMock.mockImplementation((results: unknown[]) => results);
  });

  it('renders a result row showing box name, box ID, location, and matched context', async () => {
    mockActiveWorkspace();
    searchInventoryMock.mockResolvedValue([boxResult]);

    renderSearchRoute();

    fireEvent.change(await screen.findByRole('searchbox', { name: 'Search' }), {
      target: { value: 'winter' },
    });

    await act(async () => {
      fireEvent.submit(screen.getByRole('form', { name: 'Inventory search' }));
    });

    await waitFor(() => {
      expect(screen.getByText('Winter clothes')).toBeVisible();
    });

    expect(sortResultsMock).toHaveBeenCalledWith([boxResult]);
    expect(screen.getByText('BOX-0001')).toBeVisible();
    expect(screen.getByText('Hall cupboard')).toBeVisible();
    expect(screen.getByText('box name: Winter clothes')).toBeVisible();

    const link = screen.getByRole('link', { name: /BOX-0001/i });
    expect(link).toHaveAttribute('href', '/boxes/BOX-0001');
  });

  it('shows inline error and hides the search form when no active workspace is available', async () => {
    getActiveWorkspaceMock.mockResolvedValue(null);

    renderSearchRoute();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not load the search. Sign in again.',
    );
    expect(screen.queryByRole('form', { name: 'Inventory search' })).not.toBeInTheDocument();
  });

  it('keeps the previous results visible and shows a retryable error when search fails on a later submit', async () => {
    mockActiveWorkspace();
    searchInventoryMock.mockResolvedValueOnce([boxResult]);

    renderSearchRoute();

    fireEvent.change(await screen.findByRole('searchbox', { name: 'Search' }), {
      target: { value: 'winter' },
    });

    await act(async () => {
      fireEvent.submit(screen.getByRole('form', { name: 'Inventory search' }));
    });

    await waitFor(() => {
      expect(screen.getByText('Winter clothes')).toBeVisible();
    });

    searchInventoryMock.mockRejectedValueOnce(new Error('rpc failed'));

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), {
      target: { value: 'summer' },
    });

    await act(async () => {
      fireEvent.submit(screen.getByRole('form', { name: 'Inventory search' }));
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Search failed. Try again.');
    });

    expect(screen.getByText('Winter clothes')).toBeVisible();
  });

  it('does not call the search service on keystrokes, only on explicit submit', async () => {
    mockActiveWorkspace();
    searchInventoryMock.mockResolvedValue([]);

    renderSearchRoute();

    const input = await screen.findByRole('searchbox', { name: 'Search' });
    fireEvent.change(input, { target: { value: 'w' } });
    fireEvent.change(input, { target: { value: 'wi' } });
    fireEvent.change(input, { target: { value: 'win' } });

    expect(searchInventoryMock).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.submit(screen.getByRole('form', { name: 'Inventory search' }));
    });

    expect(searchInventoryMock).toHaveBeenCalledTimes(1);
  });

  it('does not show the empty state before the first search is submitted', async () => {
    mockActiveWorkspace();

    renderSearchRoute();

    await screen.findByRole('searchbox', { name: 'Search' });

    expect(screen.queryByText('No search results found.')).not.toBeInTheDocument();
  });

  it('shows the agreed empty state when a search returns no results', async () => {
    mockActiveWorkspace();
    searchInventoryMock.mockResolvedValue([]);

    renderSearchRoute();

    fireEvent.change(await screen.findByRole('searchbox', { name: 'Search' }), {
      target: { value: 'missing' },
    });

    await act(async () => {
      fireEvent.submit(screen.getByRole('form', { name: 'Inventory search' }));
    });

    expect(await screen.findByText('No search results found.')).toBeVisible();
  });
});
