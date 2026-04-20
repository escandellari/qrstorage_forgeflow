import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { BoxDetailsPage } from './BoxDetailsPage';
import { activeWorkspace } from '@/src/features/workspace-access/testFixtures';

const {
  getActiveWorkspaceMock,
  getBoxDetailsMock,
  updateBoxDetailsMock,
  retireBoxMock,
  replaceMock,
} = vi.hoisted(() => ({
  getActiveWorkspaceMock: vi.fn(),
  getBoxDetailsMock: vi.fn(),
  updateBoxDetailsMock: vi.fn(),
  retireBoxMock: vi.fn(),
  replaceMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock('@/src/features/workspace-access', () => ({
  getActiveWorkspace: getActiveWorkspaceMock,
}));

vi.mock('@/src/features/box-retirement', () => ({
  retireBox: retireBoxMock,
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

const existingBox = {
  id: 'box-row-1',
  workspaceId: 'workspace-1',
  boxId: 'BOX-0001',
  name: 'Winter clothes',
  location: 'Hall cupboard',
  notes: 'Coats and hats',
  labelTarget: 'Front handle',
};

function renderBoxDetailsPage(boxId = 'BOX-0001') {
  render(<BoxDetailsPage boxId={boxId} />);
}

describe('Box details route', () => {
  beforeEach(() => {
    getActiveWorkspaceMock.mockReset();
    getBoxDetailsMock.mockReset();
    updateBoxDetailsMock.mockReset();
    retireBoxMock.mockReset();
    replaceMock.mockReset();
  });

  it('loads the existing box into the editable form', async () => {
    getActiveWorkspaceMock.mockResolvedValue(activeWorkspace);
    getBoxDetailsMock.mockResolvedValue(existingBox);

    await act(async () => {
      renderBoxDetailsPage();
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
      renderBoxDetailsPage();
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

  it('retires the box and returns to inventory from the box page', async () => {
    getActiveWorkspaceMock.mockResolvedValue(activeWorkspace);
    getBoxDetailsMock.mockResolvedValue(existingBox);
    retireBoxMock.mockResolvedValue(undefined);

    await act(async () => {
      renderBoxDetailsPage();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete box' }));
    });

    expect(retireBoxMock).toHaveBeenCalledWith('workspace-1', 'BOX-0001');
    expect(replaceMock).toHaveBeenCalledWith('/inventory');
  });
});
