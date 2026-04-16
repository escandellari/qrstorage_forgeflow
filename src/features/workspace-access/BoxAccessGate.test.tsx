import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import BoxRoute from '../../../app/boxes/[boxId]/page';

const { getActiveWorkspaceMock, getBoxDetailsMock, signInWithOtpMock } = vi.hoisted(() => ({
  getActiveWorkspaceMock: vi.fn(),
  getBoxDetailsMock: vi.fn(),
  signInWithOtpMock: vi.fn(),
}));

vi.mock('@/src/features/workspace-access', async () => {
  const actual = await vi.importActual<typeof import('./index')>('./index');

  return {
    ...actual,
    getActiveWorkspace: getActiveWorkspaceMock,
  };
});

vi.mock('@/src/features/box-details', () => ({
  BoxDetailsPage: ({ boxId }: { boxId: string }) => <main>Loaded {boxId}</main>,
}));

vi.mock('@/src/features/box-details/boxDetailsService', () => ({
  getBoxDetails: getBoxDetailsMock,
}));

vi.mock('@/src/features/auth-entry/supabaseBrowserClient', () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      signInWithOtp: signInWithOtpMock,
    },
  }),
}));

async function renderBoxRoute(boxId = 'BOX-0001') {
  render(await BoxRoute({ params: Promise.resolve({ boxId }) }));
}

describe('Box access gate', () => {
  beforeEach(() => {
    getActiveWorkspaceMock.mockReset();
    getBoxDetailsMock.mockReset();
    signInWithOtpMock.mockReset();
  });

  it('shows a sign-in prompt for a signed-out box visitor', async () => {
    getActiveWorkspaceMock.mockResolvedValue(null);

    await act(async () => {
      await renderBoxRoute();
    });

    expect(await screen.findByRole('heading', { name: 'Sign in to open BOX-0001' })).toBeVisible();
    expect(screen.getByLabelText('Email address')).toBeVisible();
    expect(screen.queryByText('We could not load your box. Sign in again.')).not.toBeInTheDocument();
  });

  it('requests a magic link that returns to the requested box page', async () => {
    getActiveWorkspaceMock.mockResolvedValue(null);
    signInWithOtpMock.mockResolvedValue({
      data: { session: null, user: null },
      error: null,
    });

    await act(async () => {
      await renderBoxRoute();
    });

    fireEvent.change(await screen.findByLabelText('Email address'), {
      target: { value: 'alex@example.com' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Email me a sign-in link' }));
    });

    expect(signInWithOtpMock).toHaveBeenCalledWith({
      email: 'alex@example.com',
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback?next=%2Fboxes%2FBOX-0001',
      },
    });
  });
});
