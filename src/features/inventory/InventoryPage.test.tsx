import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import InventoryRoute from '../../../app/inventory/page';

const {
  getActiveWorkspaceMock,
  listBoxesMock,
  createBoxMock,
} = vi.hoisted(() => ({
  getActiveWorkspaceMock: vi.fn(),
  listBoxesMock: vi.fn(),
  createBoxMock: vi.fn(),
}));

vi.mock('@/src/features/workspace-access', () => ({
  getActiveWorkspace: getActiveWorkspaceMock,
}));

vi.mock('./inventoryService', () => ({
  listBoxes: listBoxesMock,
  createBox: createBoxMock,
}));

describe('Inventory route', () => {
  beforeEach(() => {
    getActiveWorkspaceMock.mockReset();
    listBoxesMock.mockReset();
    createBoxMock.mockReset();
  });

  it('shows the create form and empty state for a workspace with no boxes', async () => {
    getActiveWorkspaceMock.mockResolvedValue({
      workspaceId: 'workspace-1',
      workspaceName: 'Home Base',
    });
    listBoxesMock.mockResolvedValue([]);

    render(<InventoryRoute />);

    expect(await screen.findByRole('heading', { name: 'Inventory' })).toBeVisible();
    expect(screen.getByLabelText('Box name')).toBeVisible();
    expect(screen.getByText('No boxes yet. Create your first box to get started.')).toBeVisible();
  });

  it('renders existing boxes for the active workspace', async () => {
    getActiveWorkspaceMock.mockResolvedValue({
      workspaceId: 'workspace-1',
      workspaceName: 'Home Base',
    });
    listBoxesMock.mockResolvedValue([
      {
        id: 'box-row-1',
        workspaceId: 'workspace-1',
        boxId: 'BOX-0001',
        name: 'Winter clothes',
      },
    ]);

    render(<InventoryRoute />);

    expect(await screen.findByText('BOX-0001')).toBeVisible();
    expect(screen.getByText('Winter clothes')).toBeVisible();
    expect(screen.queryByText('No boxes yet. Create your first box to get started.')).not.toBeInTheDocument();
  });

  it('rejects a blank box name before creating a box', async () => {
    getActiveWorkspaceMock.mockResolvedValue({
      workspaceId: 'workspace-1',
      workspaceName: 'Home Base',
    });
    listBoxesMock.mockResolvedValue([]);

    render(<InventoryRoute />);

    fireEvent.change(await screen.findByLabelText('Box name'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create box' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a box name.');
    expect(createBoxMock).not.toHaveBeenCalled();
  });

  it('adds the created box to the list and clears the form after a successful create', async () => {
    getActiveWorkspaceMock.mockResolvedValue({
      workspaceId: 'workspace-1',
      workspaceName: 'Home Base',
    });
    listBoxesMock.mockResolvedValue([]);
    createBoxMock.mockResolvedValue({
      id: 'box-row-1',
      workspaceId: 'workspace-1',
      boxId: 'BOX-0001',
      name: 'Winter clothes',
    });

    render(<InventoryRoute />);

    fireEvent.change(await screen.findByLabelText('Box name'), {
      target: { value: 'Winter clothes' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create box' }));

    expect(await screen.findByText('BOX-0001')).toBeVisible();
    expect(screen.getByText('Winter clothes')).toBeVisible();
    expect(screen.getByLabelText('Box name')).toHaveValue('');
    expect(createBoxMock).toHaveBeenCalledWith('workspace-1', 'Winter clothes');
  });

  it('shows a retryable error and keeps the entered name when box creation fails', async () => {
    getActiveWorkspaceMock.mockResolvedValue({
      workspaceId: 'workspace-1',
      workspaceName: 'Home Base',
    });
    listBoxesMock.mockResolvedValue([]);
    createBoxMock.mockRejectedValue(new Error('rpc failed'));

    render(<InventoryRoute />);

    fireEvent.change(await screen.findByLabelText('Box name'), {
      target: { value: 'Winter clothes' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create box' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not create your box. Try again.',
    );
    expect(screen.getByLabelText('Box name')).toHaveValue('Winter clothes');
    expect(screen.queryByText('BOX-0001')).not.toBeInTheDocument();
  });

  it('shows a recovery state when no active workspace can be resolved', async () => {
    getActiveWorkspaceMock.mockResolvedValue(null);

    render(<InventoryRoute />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not load your inventory. Sign in again.',
    );
    expect(screen.queryByLabelText('Box name')).not.toBeInTheDocument();
    expect(listBoxesMock).not.toHaveBeenCalled();
  });
});
