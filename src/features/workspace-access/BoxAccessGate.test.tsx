import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { BoxAccessGate } from './BoxAccessGate';
import { activeWorkspace } from './testFixtures';

const { getActiveWorkspaceMock, signInWithOtpMock, getBoxRouteStateMock } = vi.hoisted(() => ({
  getActiveWorkspaceMock: vi.fn(),
  signInWithOtpMock: vi.fn(),
  getBoxRouteStateMock: vi.fn(),
}));

vi.mock('./index', async () => {
  const actual = await vi.importActual<typeof import('./index')>('./index');

  return {
    ...actual,
    getActiveWorkspace: getActiveWorkspaceMock,
  };
});

vi.mock('@/src/features/box-details', () => ({
  BoxDetailsPage: ({ boxId }: { boxId: string }) => <main>Loaded {boxId}</main>,
}));

vi.mock('@/src/features/box-retirement', async () => {
  const actual = await vi.importActual<typeof import('@/src/features/box-retirement')>(
    '@/src/features/box-retirement',
  );

  return {
    ...actual,
    getBoxRouteState: getBoxRouteStateMock,
  };
});

vi.mock('@/src/features/auth-entry/supabaseBrowserClient', () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      signInWithOtp: signInWithOtpMock,
    },
  }),
}));

function renderBoxAccessGate(boxId = 'BOX-0001') {
  render(<BoxAccessGate boxId={boxId} />);
}

describe('Box access gate', () => {
  beforeEach(() => {
    getActiveWorkspaceMock.mockReset();
    signInWithOtpMock.mockReset();
    getBoxRouteStateMock.mockReset();
  });

  it('shows a sign-in prompt for a signed-out box visitor', async () => {
    getActiveWorkspaceMock.mockResolvedValue(null);

    await act(async () => {
      renderBoxAccessGate();
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
      renderBoxAccessGate();
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

  it('keeps deleted-box and access-denied states distinct for signed-in members', async () => {
    getActiveWorkspaceMock.mockResolvedValue(activeWorkspace);
    getBoxRouteStateMock.mockResolvedValueOnce('deleted');

    await act(async () => {
      renderBoxAccessGate();
    });

    expect(await screen.findByRole('heading', { name: 'BOX-0001 was deleted' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Access denied' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Sign in to open BOX-0001' })).not.toBeInTheDocument();
  });

  it('shows access denied without using deleted-box copy for an unauthorised member', async () => {
    getActiveWorkspaceMock.mockResolvedValue(activeWorkspace);
    getBoxRouteStateMock.mockResolvedValueOnce('access-denied');

    await act(async () => {
      renderBoxAccessGate();
    });

    expect(await screen.findByRole('heading', { name: 'Access denied' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'BOX-0001 was deleted' })).not.toBeInTheDocument();
    expect(screen.queryByText('This box no longer exists.')).not.toBeInTheDocument();
  });
});
