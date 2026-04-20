import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { InviteAcceptancePage } from './InviteAcceptancePage';

const { acceptWorkspaceInviteMock, replaceMock } = vi.hoisted(() => ({
  acceptWorkspaceInviteMock: vi.fn(),
  replaceMock: vi.fn(),
}));

vi.mock('./inviteService', () => ({
  acceptWorkspaceInvite: acceptWorkspaceInviteMock,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

describe('InviteAcceptancePage', () => {
  beforeEach(() => {
    acceptWorkspaceInviteMock.mockReset();
    replaceMock.mockReset();
  });

  it('shows a switch-account prompt when the signed-in email does not match the invited email', async () => {
    acceptWorkspaceInviteMock.mockResolvedValue({
      status: 'email-mismatch',
      invitedEmail: 'pat@example.com',
      signedInEmail: 'alex@example.com',
    });

    render(<InviteAcceptancePage token="invite-token" />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'This invite is for pat@example.com' })).toBeVisible();
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'You are signed in as alex@example.com. Sign in again with pat@example.com to join this workspace.',
    );
    expect(screen.getByRole('button', { name: 'Sign in with pat@example.com' })).toBeVisible();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('shows the expired-invite screen when the invite is no longer valid', async () => {
    acceptWorkspaceInviteMock.mockResolvedValue({
      status: 'expired',
      invitedEmail: 'pat@example.com',
    });

    render(<InviteAcceptancePage token="invite-token" />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'This invite has expired' })).toBeVisible();
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ask the workspace owner to send a fresh invite to pat@example.com.',
    );
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
