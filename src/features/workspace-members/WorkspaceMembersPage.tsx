'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getActiveWorkspace } from '@/src/features/workspace-access';
import {
  leaveWorkspace,
  listWorkspaceMembers,
  removeWorkspaceMember,
  type WorkspaceMember,
} from './workspaceMembersService';

const LOAD_ERROR_MESSAGE = 'We could not load your members. Sign in again.';

export function WorkspaceMembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmingLeave, setIsConfirmingLeave] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const workspace = await getActiveWorkspace();

        if (!workspace) {
          setErrorMessage(LOAD_ERROR_MESSAGE);
          return;
        }

        setWorkspaceId(workspace.workspaceId);
        setMembers(await listWorkspaceMembers(workspace.workspaceId));
      } catch {
        setErrorMessage(LOAD_ERROR_MESSAGE);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const currentMember = members.find((member) => member.isCurrentUser);
  const isOwner = currentMember?.role === 'owner';

  async function handleLeaveWorkspace() {
    if (!workspaceId || isLeaving) {
      return;
    }

    setIsLeaving(true);

    try {
      await leaveWorkspace(workspaceId);
      router.replace('/');
    } catch {
      setErrorMessage('We could not leave this workspace. Try again.');
      setIsLeaving(false);
    }
  }

  async function handleRemoveMember(memberUserId: string) {
    if (!workspaceId) {
      return;
    }

    try {
      await removeWorkspaceMember(workspaceId, memberUserId);
      setMembers((currentMembers) =>
        currentMembers.filter((currentMember) => currentMember.userId !== memberUserId),
      );
    } catch {
      setErrorMessage('We could not remove this member. Try again.');
    }
  }

  return (
    <main>
      <h1>Members</h1>
      {isLoading ? <p>Loading members…</p> : null}
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      {!isLoading && !errorMessage ? (
        <ul>
          {members.map((member) => (
            <li key={member.userId}>
              <span>{member.userId}</span>
              <span>{member.role}</span>
              {member.isCurrentUser ? (
                isConfirmingLeave ? (
                  <button type="button" disabled={isLeaving} onClick={() => void handleLeaveWorkspace()}>
                    {isLeaving ? 'Leaving workspace…' : 'Confirm leave workspace'}
                  </button>
                ) : (
                  <button type="button" onClick={() => setIsConfirmingLeave(true)}>
                    Leave workspace
                  </button>
                )
              ) : null}
              {!member.isCurrentUser && isOwner ? (
                <button type="button" onClick={() => void handleRemoveMember(member.userId)}>
                  Remove member
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
