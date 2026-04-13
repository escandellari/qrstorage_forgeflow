import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { BoxItemsPanel } from './BoxItemsPanel';

const { listBoxItemsMock, createBoxItemMock, updateBoxItemMock, removeBoxItemMock } = vi.hoisted(() => ({
  listBoxItemsMock: vi.fn(),
  createBoxItemMock: vi.fn(),
  updateBoxItemMock: vi.fn(),
  removeBoxItemMock: vi.fn(),
}));

vi.mock('./boxItemsService', () => ({
  createBoxItemDraft: (item?: {
    name: string;
    category: string | null;
    notes: string | null;
    quantity: number | null;
  }) => ({
    name: item?.name ?? '',
    category: item?.category ?? '',
    notes: item?.notes ?? '',
    quantity: item?.quantity?.toString() ?? '',
  }),
  listBoxItems: listBoxItemsMock,
  createBoxItem: createBoxItemMock,
  updateBoxItem: updateBoxItemMock,
  removeBoxItem: removeBoxItemMock,
}));

describe('BoxItemsPanel', () => {
  beforeEach(() => {
    listBoxItemsMock.mockReset();
    createBoxItemMock.mockReset();
    updateBoxItemMock.mockReset();
    removeBoxItemMock.mockReset();
  });

  it('shows a clear error when item removal fails without hiding the rest of the box contents', async () => {
    listBoxItemsMock.mockResolvedValue([
      {
        id: 'item-row-1',
        boxId: 'box-row-1',
        name: 'Beanies',
        category: 'Clothing',
        notes: 'Top shelf',
        quantity: 3,
      },
    ]);
    removeBoxItemMock.mockRejectedValue(new Error('delete failed'));

    render(<BoxItemsPanel boxId="box-row-1" />);

    expect(await screen.findByText('Beanies')).toBeVisible();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove Beanies' }));
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not update your items. Try again.',
    );
    expect(screen.getByText('Beanies')).toBeVisible();
    expect(screen.getByRole('region', { name: 'Box items' })).toHaveTextContent('Top shelf');
    expect(screen.getByRole('button', { name: 'Add item' })).toBeVisible();
  });
});
