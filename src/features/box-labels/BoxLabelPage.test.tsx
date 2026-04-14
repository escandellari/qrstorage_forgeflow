import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { BoxDetails } from '@/src/features/box-details/boxDetailsService';
import BoxLabelRoute from '../../../app/boxes/[boxId]/label/page';

const { getActiveWorkspaceMock, getBoxDetailsMock, qrCodeSvgMock } = vi.hoisted(() => ({
  getActiveWorkspaceMock: vi.fn(),
  getBoxDetailsMock: vi.fn(),
  qrCodeSvgMock: vi.fn(({ value }: { value: string }) => (
    <svg aria-label="Box QR code" data-value={value} />
  )),
}));

vi.mock('@/src/features/workspace-access', () => ({
  getActiveWorkspace: getActiveWorkspaceMock,
}));

vi.mock('@/src/features/box-details/boxDetailsService', () => ({
  getBoxDetails: getBoxDetailsMock,
}));

vi.mock('qrcode.react', () => ({
  QRCodeSVG: qrCodeSvgMock,
}));

const activeWorkspace = {
  workspaceId: 'workspace-1',
  workspaceName: 'Home Base',
};

const existingBox: BoxDetails = {
  id: 'box-row-1',
  workspaceId: 'workspace-1',
  boxId: 'BOX-0001',
  name: 'Winter clothes',
  location: 'Hall cupboard',
  notes: 'Coats and hats',
  labelTarget: 'Front handle',
};

const unnamedBox = {
  ...existingBox,
  name: null,
};

async function renderLabelRoute(boxId = 'BOX-0001') {
  render(await BoxLabelRoute({ params: Promise.resolve({ boxId }) }));
}

async function renderLoadedLabelRoute(box: BoxDetails = existingBox) {
  getActiveWorkspaceMock.mockResolvedValue(activeWorkspace);
  getBoxDetailsMock.mockResolvedValue(box);

  await act(async () => {
    await renderLabelRoute(box.boxId);
  });
}

describe('Box label route', () => {
  beforeEach(() => {
    getActiveWorkspaceMock.mockReset();
    getBoxDetailsMock.mockReset();
    qrCodeSvgMock.mockClear();
  });

  it('renders the printable label for a named box', async () => {
    await renderLoadedLabelRoute();

    expect(await screen.findByRole('heading', { name: 'BOX-0001' })).toBeVisible();
    expect(screen.getByText('Winter clothes')).toBeVisible();
    expect(screen.getByLabelText('Box QR code')).toBeVisible();
  });

  it('encodes the canonical box page URL in the QR code', async () => {
    await renderLoadedLabelRoute();

    expect(qrCodeSvgMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Box QR code',
        value: 'http://localhost:3000/boxes/BOX-0001',
      }),
      undefined,
    );
  });

  it('omits the box name cleanly when the box is unnamed', async () => {
    await renderLoadedLabelRoute(unnamedBox);

    expect(await screen.findByRole('heading', { name: 'BOX-0001' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Printable box label' })).toBeVisible();
    expect(screen.queryByText('Winter clothes')).not.toBeInTheDocument();
  });

  it('prints the label with the browser print dialog', async () => {
    const printSpy = vi.fn();
    window.print = printSpy;

    await renderLoadedLabelRoute();

    fireEvent.click(screen.getByRole('button', { name: 'Print label' }));

    expect(printSpy).toHaveBeenCalledTimes(1);
  });
});
