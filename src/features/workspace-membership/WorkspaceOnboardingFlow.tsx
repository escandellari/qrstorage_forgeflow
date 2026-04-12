'use client';

import { FormEvent, useEffect, useState } from 'react';
import { WorkspaceHomePage } from '@/src/features/workspace-home';
import { WorkspaceOnboardingLayout } from './WorkspaceOnboardingLayout';
import {
  createWorkspaceForOwner,
  exchangeAuthCodeForSession,
  findWorkspaceMembership,
} from './workspaceMembershipService';

type FlowState = 'loading' | 'needs-workspace' | 'done' | 'error';

export function WorkspaceOnboardingFlow() {
  const [flowState, setFlowState] = useState<FlowState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceOwnerId, setWorkspaceOwnerId] = useState<string | null>(null);
  const [activeWorkspaceName, setActiveWorkspaceName] = useState<string | null>(null);

  useEffect(() => {
    const authCode = new URLSearchParams(window.location.search).get('code');

    if (!authCode) {
      setErrorMessage('This sign-in link is invalid or expired.');
      setFlowState('error');
      return;
    }

    void (async () => {
      try {
        const { data, error } = await exchangeAuthCodeForSession(authCode);

        if (error || !data.user) {
          setErrorMessage('We could not complete your sign-in link. Try again.');
          setFlowState('error');
          return;
        }

        const membership = await findWorkspaceMembership(data.user.id);

        if (!membership) {
          setWorkspaceOwnerId(data.user.id);
          setFlowState('needs-workspace');
          return;
        }

        setActiveWorkspaceName(membership.workspaceName ?? 'your workspace');
        setFlowState('done');
      } catch {
        setErrorMessage('We could not complete your sign-in link. Try again.');
        setFlowState('error');
      }
    })();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedWorkspaceName = workspaceName.trim();

    if (!trimmedWorkspaceName) {
      setErrorMessage('Enter a workspace name.');
      return;
    }

    if (!workspaceOwnerId) {
      setErrorMessage('We could not create your workspace. Try again.');
      setFlowState('error');
      return;
    }

    try {
      const createdWorkspace = await createWorkspaceForOwner(workspaceOwnerId, trimmedWorkspaceName);
      setActiveWorkspaceName(createdWorkspace.workspaceName ?? 'your workspace');
      setFlowState('done');
    } catch {
      setErrorMessage('We could not create your workspace. Try again.');
    }
  }

  if (flowState === 'done' && activeWorkspaceName) {
    return <WorkspaceHomePage workspaceName={activeWorkspaceName} />;
  }

  return (
    <WorkspaceOnboardingLayout>
      {flowState === 'needs-workspace' ? (
          <>
            <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(2rem, 8vw, 3.5rem)' }}>
              Name your shared workspace
            </h1>
            <p style={{ margin: '0 0 24px', fontSize: '1rem', lineHeight: 1.6, color: '#4f4565' }}>
              Create the workspace once, then start sharing boxes and inventory.
            </p>
            <form noValidate onSubmit={handleSubmit}>
              <label
                htmlFor="workspace-name"
                style={{ display: 'block', marginBottom: '12px', fontWeight: 700 }}
              >
                Workspace name
              </label>
              <input
                id="workspace-name"
                type="text"
                value={workspaceName}
                onChange={(event) => {
                  setWorkspaceName(event.target.value);
                  setErrorMessage(null);
                }}
                style={{
                  width: '100%',
                  minHeight: '48px',
                  padding: '0 16px',
                  borderRadius: '16px',
                  border: '1px solid #cfc5eb',
                  marginBottom: '16px',
                }}
              />
              {errorMessage ? (
                <p
                  role="alert"
                  style={{ margin: '0 0 16px', fontSize: '0.95rem', color: '#b42318' }}
                >
                  {errorMessage}
                </p>
              ) : null}
              <button
                type="submit"
                style={{
                  width: '100%',
                  minHeight: '48px',
                  borderRadius: '999px',
                  border: 'none',
                  backgroundColor: '#6a4bb6',
                  color: '#ffffff',
                  fontWeight: 700,
                }}
              >
                Create workspace
              </button>
            </form>
          </>
        ) : flowState === 'error' ? (
          <>
            <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(2rem, 8vw, 3.5rem)' }}>
              Completing sign-in…
            </h1>
            <p
              role="alert"
              style={{ margin: '0 0 16px', fontSize: '1rem', lineHeight: 1.6, color: '#b42318' }}
            >
              {errorMessage}
            </p>
            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '48px',
                padding: '0 20px',
                borderRadius: '999px',
                backgroundColor: '#6a4bb6',
                color: '#ffffff',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Back to home
            </a>
          </>
      ) : (
        <>
          <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(2rem, 8vw, 3.5rem)' }}>
            Completing sign-in…
          </h1>
          <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.6, color: '#4f4565' }}>
            Please wait while we finish signing you in.
          </p>
        </>
      )}
    </WorkspaceOnboardingLayout>
  );
}
