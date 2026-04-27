import { fireEvent, render, screen } from '@testing-library/react';
import { BoxScanPage } from './BoxScanPage';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe('BoxScanPage', () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it('opens the matching box when given a valid box QR value', () => {
    render(<BoxScanPage />);

    fireEvent.change(screen.getByLabelText('QR code value'), {
      target: { value: 'https://forgeflow.example/boxes/BOX-0001' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Open scanned box' }));

    expect(pushMock).toHaveBeenCalledWith('/boxes/BOX-0001');
  });

  it('shows an error when the scanned value is not a box URL', () => {
    render(<BoxScanPage />);

    fireEvent.change(screen.getByLabelText('QR code value'), {
      target: { value: 'https://forgeflow.example/search?q=box' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Open scanned box' }));

    expect(screen.getByRole('alert')).toHaveTextContent('That QR code does not point to a box in this app.');
    expect(pushMock).not.toHaveBeenCalled();
  });
});
