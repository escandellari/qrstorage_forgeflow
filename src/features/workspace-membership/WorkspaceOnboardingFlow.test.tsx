import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AuthCallbackRoute from '../../../app/auth/callback/page';

const {
  exchangeAuthCodeForSessionMock,
  findWorkspaceMembershipMock,
  createWorkspaceForOwnerMock,
} = vi.hoisted(() => ({
  exchangeAuthCodeForSessionMock: vi.fn(),
  findWorkspaceMembershipMock: vi.fn(),
  createWorkspaceForOwnerMock: vi.fn(),
}));

vi.mock('./workspaceMembershipService', () => ({
  exchangeAuthCodeForSession: exchangeAuthCodeForSessionMock,
  findWorkspaceMembership: findWorkspaceMembershipMock,
  createWorkspaceForOwner: createWorkspaceForOwnerMock,
}));

describe('Workspace onboarding callback route', () => {
  beforeEach(() => {
    exchangeAuthCodeForSessionMock.mockReset();
    findWorkspaceMembershipMock.mockReset();
    createWorkspaceForOwnerMock.mockReset();
    window.history.replaceState({}, '', '/auth/callback?code=magic-code');
  });

  it('shows a recovery message and route back to home when the callback exchange fails', async () => {
    exchangeAuthCodeForSessionMock.mockResolvedValue({
      data: { session: null, user: null },
      error: new Error('exchange failed'),
    });

    render(<AuthCallbackRoute />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not complete your sign-in link. Try again.',
    );
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
  });

  it('skips workspace creation when the signed-in user already belongs to a workspace', async () => {
    exchangeAuthCodeForSessionMock.mockResolvedValue({
      data: {
        session: { access_token: 'token' },
        user: { id: 'user-1' },
      },
      error: null,
    });
    findWorkspaceMembershipMock.mockResolvedValue({
      workspaceId: 'workspace-1',
      workspaceName: 'Home Base',
    });

    render(<AuthCallbackRoute />);

    expect(await screen.findByRole('heading', { name: 'You are inside Home Base' })).toBeVisible();
    expect(screen.queryByLabelText('Workspace name')).not.toBeInTheDocument();
    expect(createWorkspaceForOwnerMock).not.toHaveBeenCalled();
  });

  it('shows the recovery state when the callback route is missing the auth code', async () => {
    window.history.replaceState({}, '', '/auth/callback');

    render(<AuthCallbackRoute />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This sign-in link is invalid or expired.',
    );
    expect(exchangeAuthCodeForSessionMock).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
  });

  it('rejects a blank workspace name before creating the owner workspace', async () => {
    exchangeAuthCodeForSessionMock.mockResolvedValue({
      data: {
        session: { access_token: 'token' },
        user: { id: 'user-1' },
      },
      error: null,
    });
    findWorkspaceMembershipMock.mockResolvedValue(null);

    render(<AuthCallbackRoute />);

    fireEvent.change(await screen.findByLabelText('Workspace name'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create workspace' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a workspace name.');
    expect(createWorkspaceForOwnerMock).not.toHaveBeenCalled();
  });

  it('shows a retryable error when workspace creation fails after sign-in', async () => {
    exchangeAuthCodeForSessionMock.mockResolvedValue({
      data: {
        session: { access_token: 'token' },
        user: { id: 'user-1' },
      },
      error: null,
    });
    findWorkspaceMembershipMock.mockResolvedValue(null);
    createWorkspaceForOwnerMock.mockRejectedValue(new Error('insert failed'));

    render(<AuthCallbackRoute />);

    fireEvent.change(await screen.findByLabelText('Workspace name'), {
      target: { value: 'Home Base' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create workspace' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not create your workspace. Try again.',
    );
    expect(screen.getByLabelText('Workspace name')).toBeVisible();
  });
});
