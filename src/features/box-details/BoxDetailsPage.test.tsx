import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import BoxRoute from '../../../app/boxes/[boxId]/page';

const { getActiveWorkspaceMock, getBoxDetailsMock, updateBoxDetailsMock } = vi.hoisted(() => ({
  getActiveWorkspaceMock: vi.fn(),
  getBoxDetailsMock: vi.fn(),
  updateBoxDetailsMock: vi.fn(),
}));

vi.mock('@/src/features/workspace-access', () => ({
  getActiveWorkspace: getActiveWorkspaceMock,
}));

vi.mock('@/src/features/box-items', () => ({
  BoxItemsPanel: () => <section aria-label="Box items" />,
}));

vi.mock('./boxDetailsService', () => ({
  createBoxDetailsDraft: (box: {
    name: string | null;
    location: string | null;
    notes: string | null;
    labelTarget: string | null;
  }) => ({
    name: box.name ?? '',
    location: box.location ?? '',
    notes: box.notes ?? '',
    labelTarget: box.labelTarget ?? '',
  }),
  getBoxDetails: getBoxDetailsMock,
  updateBoxDetails: updateBoxDetailsMock,
}));

const activeWorkspace = {
  workspaceId: 'workspace-1',
  workspaceName: 'Home Base',
};

const existingBox = {
  id: 'box-row-1',
  workspaceId: 'workspace-1',
  boxId: 'BOX-0001',
  name: 'Winter clothes',
  location: 'Hall cupboard',
  notes: 'Coats and hats',
  labelTarget: 'Front handle',
};

async function renderBoxRoute(boxId = 'BOX-0001') {
  render(await BoxRoute({ params: Promise.resolve({ boxId }) }));
}

describe('Box details route', () => {
  beforeEach(() => {
    getActiveWorkspaceMock.mockReset();
    getBoxDetailsMock.mockReset();
    updateBoxDetailsMock.mockReset();
  });

  it('loads the existing box into the editable form', async () => {
    getActiveWorkspaceMock.mockResolvedValue(activeWorkspace);
    getBoxDetailsMock.mockResolvedValue(existingBox);

    await act(async () => {
      await renderBoxRoute();
    });

    expect(await screen.findByRole('heading', { name: 'BOX-0001' })).toBeVisible();
    expect(screen.getByLabelText('Box name')).toHaveValue('Winter clothes');
    expect(screen.getByLabelText('Location')).toHaveValue('Hall cupboard');
    expect(screen.getByLabelText('Notes')).toHaveValue('Coats and hats');
    expect(screen.getByLabelText('Label target')).toHaveValue('Front handle');
    expect(getBoxDetailsMock).toHaveBeenCalledWith('workspace-1', 'BOX-0001');
  });

  it('shows a save error while keeping the last saved details understandable', async () => {
    getActiveWorkspaceMock.mockResolvedValue(activeWorkspace);
    getBoxDetailsMock.mockResolvedValue(existingBox);
    updateBoxDetailsMock.mockRejectedValue(new Error('update failed'));

    await act(async () => {
      await renderBoxRoute();
    });

    fireEvent.change(screen.getByLabelText('Box name'), {
      target: { value: 'Winter coats' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save box details' }));
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not save your box details. Try again.',
    );
    expect(screen.getByLabelText('Box name')).toHaveValue('Winter coats');
    expect(screen.getByText('Saved box details')).toBeVisible();
    expect(screen.getByText('Winter clothes')).toBeVisible();
    expect(screen.queryByText('Winter coats')).not.toBeInTheDocument();
  });
});
