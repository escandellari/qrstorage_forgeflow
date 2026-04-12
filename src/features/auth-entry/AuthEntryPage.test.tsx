import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import HomePage from '../../../app/page';

const signInWithOtpMock = vi.fn();

vi.mock('./supabaseBrowserClient', () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      signInWithOtp: signInWithOtpMock,
    },
  }),
}));

function renderHomePage() {
  render(<HomePage />);
}

function submitEmailForm(email: string) {
  fireEvent.change(screen.getByLabelText('Email address'), {
    target: { value: email },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Email me a sign-in link' }));
}

describe('HomePage auth entry route', () => {
  beforeEach(() => {
    signInWithOtpMock.mockReset();
  });

  it('shows a clear error when the submitted email is invalid', async () => {
    renderHomePage();
    submitEmailForm('not-an-email');

    expect(await screen.findByText('Enter a valid email address.')).toBeVisible();
    expect(screen.queryByText('Check your email')).not.toBeInTheDocument();
    expect(signInWithOtpMock).not.toHaveBeenCalled();
  });

  it('shows a retryable error when the provider request fails', async () => {
    signInWithOtpMock.mockResolvedValue({
      data: { session: null, user: null },
      error: new Error('provider failed'),
    });

    renderHomePage();
    submitEmailForm('alex@example.com');

    expect(await screen.findByText('We could not send your sign-in link. Try again.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Email me a sign-in link' })).toBeEnabled();
    expect(screen.queryByText('Check your email')).not.toBeInTheDocument();
  });
});
