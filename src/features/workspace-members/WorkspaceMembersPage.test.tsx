import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import WorkspaceMembersRoute from '../../../app/workspace/members/page';
import { activeWorkspace } from '@/src/features/workspace-access/testFixtures';

const {
  getActiveWorkspaceMock,
  listWorkspaceMembersMock,
  leaveWorkspaceMock,
  removeWorkspaceMemberMock,
  replaceMock,
} = vi.hoisted(() => ({
  getActiveWorkspaceMock: vi.fn(),
  listWorkspaceMembersMock: vi.fn(),
  leaveWorkspaceMock: vi.fn(),
  removeWorkspaceMemberMock: vi.fn(),
  replaceMock: vi.fn(),
}));

vi.mock('@/src/features/workspace-access', () => ({
  getActiveWorkspace: getActiveWorkspaceMock,
}));

vi.mock('./workspaceMembersService', () => ({
  listWorkspaceMembers: listWorkspaceMembersMock,
  leaveWorkspace: leaveWorkspaceMock,
  removeWorkspaceMember: removeWorkspaceMemberMock,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

const ownerMembership = {
  userId: 'user-1',
  role: 'owner' as const,
  isCurrentUser: true,
};

const memberMembership = {
  userId: 'user-2',
  role: 'member' as const,
  isCurrentUser: false,
};

function renderWorkspaceMembersRoute() {
  render(<WorkspaceMembersRoute />);
}

describe('Workspace members route', () => {
  beforeEach(() => {
    getActiveWorkspaceMock.mockReset();
    listWorkspaceMembersMock.mockReset();
    leaveWorkspaceMock.mockReset();
    removeWorkspaceMemberMock.mockReset();
    replaceMock.mockReset();
  });

  it('lets the owner remove another member and updates the member list', async () => {
    getActiveWorkspaceMock.mockResolvedValue(activeWorkspace);
    listWorkspaceMembersMock.mockResolvedValue([ownerMembership, memberMembership]);
    removeWorkspaceMemberMock.mockResolvedValue(undefined);

    await act(async () => {
      renderWorkspaceMembersRoute();
    });

    expect(await screen.findByText('user-1')).toBeVisible();
    expect(screen.getByText('user-2')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Leave workspace' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Remove member' })).toHaveLength(1);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove member' }));
    });

    expect(removeWorkspaceMemberMock).toHaveBeenCalledWith('workspace-1', 'user-2');

    await waitFor(() => {
      expect(screen.queryByText('user-2')).not.toBeInTheDocument();
    });
    expect(screen.getByText('user-1')).toBeVisible();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('confirms self-leave and routes the member out of the workspace', async () => {
    getActiveWorkspaceMock.mockResolvedValue(activeWorkspace);
    listWorkspaceMembersMock.mockResolvedValue([
      {
        userId: 'user-1',
        role: 'member',
        isCurrentUser: true,
      },
      {
        userId: 'user-2',
        role: 'owner',
        isCurrentUser: false,
      },
    ]);
    leaveWorkspaceMock.mockResolvedValue(undefined);

    await act(async () => {
      renderWorkspaceMembersRoute();
    });

    expect(await screen.findByRole('button', { name: 'Leave workspace' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Remove member' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Leave workspace' }));

    expect(screen.getByRole('button', { name: 'Confirm leave workspace' })).toBeVisible();
    expect(leaveWorkspaceMock).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm leave workspace' }));
    });

    expect(leaveWorkspaceMock).toHaveBeenCalledWith('workspace-1');
    expect(replaceMock).toHaveBeenCalledWith('/');
  });

  it('keeps the members list visible when removing another member fails', async () => {
    getActiveWorkspaceMock.mockResolvedValue(activeWorkspace);
    listWorkspaceMembersMock.mockResolvedValue([ownerMembership, memberMembership]);
    removeWorkspaceMemberMock.mockRejectedValue(new Error('remove failed'));

    await act(async () => {
      renderWorkspaceMembersRoute();
    });

    expect(await screen.findByText('user-1')).toBeVisible();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove member' }));
    });

    expect(screen.getByRole('alert')).toHaveTextContent('We could not remove this member. Try again.');
    expect(screen.getByText('user-1')).toBeVisible();
    expect(screen.getByText('user-2')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Remove member' })).toBeVisible();
  });

  it('keeps the members list visible when leaving the workspace fails', async () => {
    getActiveWorkspaceMock.mockResolvedValue(activeWorkspace);
    listWorkspaceMembersMock.mockResolvedValue([
      {
        userId: 'user-1',
        role: 'member',
        isCurrentUser: true,
      },
      {
        userId: 'user-2',
        role: 'owner',
        isCurrentUser: false,
      },
    ]);
    leaveWorkspaceMock.mockRejectedValue(new Error('leave failed'));

    await act(async () => {
      renderWorkspaceMembersRoute();
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Leave workspace' }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm leave workspace' }));
    });

    expect(screen.getByRole('alert')).toHaveTextContent('We could not leave this workspace. Try again.');
    expect(screen.getByText('user-1')).toBeVisible();
    expect(screen.getByText('user-2')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Confirm leave workspace' })).toBeVisible();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
