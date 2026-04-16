import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

const activeWorkspace = {
  workspaceId: 'workspace-1',
  workspaceName: 'Home Base',
};

const createdBox = {
  id: 'box-row-1',
  workspaceId: 'workspace-1',
  boxId: 'BOX-0001',
  name: 'Winter clothes',
};

function createDeferredPromise<T>() {
  let resolvePromise: (value: T) => void;

  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve: resolvePromise!,
  };
}

function renderInventoryRoute() {
  render(<InventoryRoute />);
}

function mockActiveWorkspace() {
  getActiveWorkspaceMock.mockResolvedValue(activeWorkspace);
}

async function submitCreateBoxForm(name: string) {
  fireEvent.change(await screen.findByLabelText('Box name'), {
    target: { value: name },
  });

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Create box' }));
  });
}

describe('Inventory route', () => {
  beforeEach(() => {
    getActiveWorkspaceMock.mockReset();
    listBoxesMock.mockReset();
    createBoxMock.mockReset();
  });

  it('waits for the active workspace before enabling box creation', async () => {
    const workspaceDeferred = createDeferredPromise<typeof activeWorkspace>();
    getActiveWorkspaceMock.mockReturnValue(workspaceDeferred.promise);
    listBoxesMock.mockResolvedValue([]);

    renderInventoryRoute();

    expect(await screen.findByRole('heading', { name: 'Inventory' })).toBeVisible();
    expect(screen.getByText('Loading your inventory…')).toBeVisible();
    expect(screen.queryByLabelText('Box name')).not.toBeInTheDocument();

    await act(async () => {
      workspaceDeferred.resolve(activeWorkspace);
      await workspaceDeferred.promise;
    });

    expect(await screen.findByLabelText('Box name')).toBeVisible();
    expect(screen.getByText('No boxes yet. Create your first box to get started.')).toBeVisible();
  });

  it('renders existing boxes for the active workspace with links to the box pages', async () => {
    mockActiveWorkspace();
    listBoxesMock.mockResolvedValue([createdBox]);

    renderInventoryRoute();

    const boxLink = await screen.findByRole('link', { name: /BOX-0001/i });

    expect(boxLink).toBeVisible();
    expect(boxLink).toHaveAttribute('href', '/boxes/BOX-0001');
    expect(screen.getByText('Winter clothes')).toBeVisible();
    expect(screen.queryByText('No boxes yet. Create your first box to get started.')).not.toBeInTheDocument();
  });

  it('creates a box without a name and shows the fallback label', async () => {
    mockActiveWorkspace();
    listBoxesMock.mockResolvedValue([]);
    createBoxMock.mockResolvedValue({
      ...createdBox,
      name: null,
    });

    renderInventoryRoute();

    await submitCreateBoxForm('   ');

    expect(await screen.findByText('BOX-0001')).toBeVisible();
    expect(screen.getByText('Unnamed box')).toBeVisible();
    expect(createBoxMock).toHaveBeenCalledWith('workspace-1', null);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('adds the created box to the list and clears the form after a successful create', async () => {
    mockActiveWorkspace();
    listBoxesMock.mockResolvedValue([]);
    createBoxMock.mockResolvedValue(createdBox);

    renderInventoryRoute();

    await submitCreateBoxForm('Winter clothes');

    expect(await screen.findByText('BOX-0001')).toBeVisible();
    expect(screen.getByText('Winter clothes')).toBeVisible();
    expect(screen.getByLabelText('Box name')).toHaveValue('');
    expect(createBoxMock).toHaveBeenCalledWith('workspace-1', 'Winter clothes');
  });

  it('prevents duplicate submissions while creating a box', async () => {
    const createDeferred = createDeferredPromise<typeof createdBox>();
    mockActiveWorkspace();
    listBoxesMock.mockResolvedValue([]);
    createBoxMock.mockReturnValue(createDeferred.promise);

    renderInventoryRoute();

    fireEvent.change(await screen.findByLabelText('Box name'), {
      target: { value: 'Winter clothes' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create box' }));
    fireEvent.click(screen.getByRole('button', { name: 'Creating box…' }));

    expect(createBoxMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Creating box…' })).toBeDisabled();

    await act(async () => {
      createDeferred.resolve(createdBox);
      await createDeferred.promise;
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Create box' })).toBeEnabled();
    });
  });

  it('shows a retryable error and keeps the entered name when box creation fails', async () => {
    mockActiveWorkspace();
    listBoxesMock.mockResolvedValue([]);
    createBoxMock.mockRejectedValue(new Error('rpc failed'));

    renderInventoryRoute();

    await submitCreateBoxForm('Winter clothes');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not create your box. Try again.',
    );
    expect(screen.getByLabelText('Box name')).toHaveValue('Winter clothes');
    expect(screen.queryByText('BOX-0001')).not.toBeInTheDocument();
  });

  it('keeps box creation available without showing the empty state when loading boxes fails after the workspace resolves', async () => {
    mockActiveWorkspace();
    listBoxesMock.mockRejectedValue(new Error('read failed'));

    renderInventoryRoute();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not load your inventory. Try again.',
    );
    expect(screen.getByLabelText('Box name')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Create box' })).toBeVisible();
    expect(screen.queryByText('No boxes yet. Create your first box to get started.')).not.toBeInTheDocument();
  });

  it('shows a recovery state when no active workspace can be resolved', async () => {
    getActiveWorkspaceMock.mockResolvedValue(null);

    renderInventoryRoute();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not load your inventory. Sign in again.',
    );
    expect(screen.queryByLabelText('Box name')).not.toBeInTheDocument();
    expect(listBoxesMock).not.toHaveBeenCalled();
  });
});
