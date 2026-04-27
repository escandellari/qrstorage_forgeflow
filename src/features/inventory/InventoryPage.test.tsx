import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import InventoryRoute from '../../../app/inventory/page';
import { activeWorkspace } from '@/src/features/workspace-access/testFixtures';

const {
  getActiveWorkspaceMock,
  listBoxesMock,
  createBoxMock,
  createWorkspaceInviteMock,
} = vi.hoisted(() => ({
  getActiveWorkspaceMock: vi.fn(),
  listBoxesMock: vi.fn(),
  createBoxMock: vi.fn(),
  createWorkspaceInviteMock: vi.fn(),
}));

vi.mock('@/src/features/workspace-access', () => ({
  getActiveWorkspace: getActiveWorkspaceMock,
}));

vi.mock('./inventoryService', () => ({
  listBoxes: listBoxesMock,
  createBox: createBoxMock,
}));

vi.mock('@/src/features/workspace-invites/inviteService', () => ({
  createWorkspaceInvite: createWorkspaceInviteMock,
}));

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

async function openCreateBoxForm() {
  const createButton = await screen.findByRole('button', { name: '+ Create box' });

  fireEvent.click(createButton);

  return screen.findByLabelText('Box name');
}

async function submitCreateBoxForm(name: string) {
  fireEvent.change(await openCreateBoxForm(), {
    target: { value: name },
  });

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
  });
}

describe('Inventory route', () => {
  beforeEach(() => {
    getActiveWorkspaceMock.mockReset();
    listBoxesMock.mockReset();
    createBoxMock.mockReset();
    createWorkspaceInviteMock.mockReset();
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

    expect(await screen.findByRole('button', { name: '+ Create box' })).toBeVisible();
    expect(screen.getByText('No boxes yet')).toBeVisible();
    expect(screen.getByText('Create your first box to get started')).toBeVisible();
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

  it('shows a visible path into inventory search from the inventory route', async () => {
    mockActiveWorkspace();
    listBoxesMock.mockResolvedValue([]);

    renderInventoryRoute();

    const searchLink = await screen.findByRole('link', { name: 'Search inventory' });

    expect(searchLink).toHaveAttribute('href', '/search');
  });

  it('shows a visible path into QR scanning from the inventory route', async () => {
    mockActiveWorkspace();
    listBoxesMock.mockResolvedValue([]);

    renderInventoryRoute();

    const scanLink = await screen.findByRole('link', { name: 'Scan box QR' });

    expect(scanLink).toHaveAttribute('href', '/scan');
  });

  it('rejects a blank member email before creating an invite', async () => {
    mockActiveWorkspace();
    listBoxesMock.mockResolvedValue([]);

    renderInventoryRoute();

    const createInviteButton = await screen.findByRole('button', { name: 'Invite' });

    await act(async () => {
      fireEvent.click(createInviteButton);
    });

    expect(createWorkspaceInviteMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Member email address')).toBeRequired();
  });

  it('creates an email-bound workspace invite from the inventory route', async () => {
    mockActiveWorkspace();
    listBoxesMock.mockResolvedValue([]);
    createWorkspaceInviteMock.mockResolvedValue({
      token: 'invite-token',
      invitedEmail: 'pat@example.com',
    });

    renderInventoryRoute();

    fireEvent.change(await screen.findByLabelText('Member email address'), {
      target: { value: 'pat@example.com' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
    });

    expect(createWorkspaceInviteMock).toHaveBeenCalledWith('workspace-1', 'pat@example.com');
    expect(await screen.findByText('Invite ready for pat@example.com.')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Email invite →' })).toHaveAttribute(
      'href',
      expect.stringContaining('mailto:pat@example.com'),
    );
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
    expect(screen.getByRole('button', { name: '+ Create box' })).toBeVisible();
    expect(createBoxMock).toHaveBeenCalledWith('workspace-1', 'Winter clothes');
  });

  it('prevents duplicate submissions while creating a box', async () => {
    const createDeferred = createDeferredPromise<typeof createdBox>();
    mockActiveWorkspace();
    listBoxesMock.mockResolvedValue([]);
    createBoxMock.mockReturnValue(createDeferred.promise);

    renderInventoryRoute();

    fireEvent.change(await openCreateBoxForm(), {
      target: { value: 'Winter clothes' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    fireEvent.click(screen.getByRole('button', { name: 'Creating…' }));

    expect(createBoxMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Creating…' })).toBeDisabled();

    await act(async () => {
      createDeferred.resolve(createdBox);
      await createDeferred.promise;
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '+ Create box' })).toBeEnabled();
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
    expect(screen.getByRole('button', { name: '+ Create box' })).toBeVisible();
    expect(screen.queryByText('No boxes yet')).not.toBeInTheDocument();
    expect(screen.queryByText('Create your first box to get started')).not.toBeInTheDocument();
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
