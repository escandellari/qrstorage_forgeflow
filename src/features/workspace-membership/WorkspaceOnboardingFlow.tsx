'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { readSafeNextPath } from '@/src/features/workspace-access/authRedirect';
import { WorkspaceHomePage } from '@/src/features/workspace-home';
import { WorkspaceOnboardingLayout } from './WorkspaceOnboardingLayout';
import { getSupabaseBrowserClient } from '@/src/features/auth/supabaseBrowserClient';
import {
  createWorkspaceForOwner,
  exchangeAuthCodeForSession,
  findWorkspaceMembership,
} from './workspaceMembershipService';

type FlowState = 'loading' | 'needs-workspace' | 'done' | 'error';

export function WorkspaceOnboardingFlow() {
  const router = useRouter();
  const [flowState, setFlowState] = useState<FlowState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceOwnerId, setWorkspaceOwnerId] = useState<string | null>(null);
  const [activeWorkspaceName, setActiveWorkspaceName] = useState<string | null>(null);
  const [nextPath, setNextPath] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const safeNextPath = readSafeNextPath(window.location.search);

    setNextPath(safeNextPath);

    // First check for existing session (persisted in localStorage)
    void (async () => {
      try {
        console.log('Checking for existing session...');
        
        // Check what's in localStorage
        const storedKeys = Object.keys(window.localStorage).filter(k => k.includes('supabase') || k.includes('auth'));
        console.log('localStorage keys:', storedKeys);
        
        // Try retrieving session from storage
        const supabase = getSupabaseBrowserClient();
        let { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // If no session, manually restore from localStorage
        if (!session || !session.user) {
          const storageKey = 'sb-dpjzbdqcxmkkinzgxmxw-auth-token';
          const stored = window.localStorage.getItem(storageKey);
          
          if (stored) {
            try {
              const tokenData = JSON.parse(stored);
              console.log('Manually restoring session from token:', tokenData);
              
              // Try setting the session
              const { error: setError } = await supabase.auth.setSession({
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
              });
              console.log('setSession result:', { error: setError });
              
              // Refresh session after restore
              if (!setError) {
                const refreshed = await supabase.auth.getSession();
                session = refreshed.data.session;
                console.log('Refreshed session:', session ? 'exists' : null);
              }
            } catch (e) {
              console.log('Failed to restore session:', e);
            }
          }
        }

        // Get the user from the session
        const user = session?.user;
        
        if (user) {
          console.log('Existing session found:', user.id);

          // Clear the hash fragment to clean up URL
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
          }

          if (safeNextPath?.startsWith('/invites/')) {
            router.replace(safeNextPath);
            return;
          }

          console.log('Checking membership for user:', user.id);
          const membership = await findWorkspaceMembership(user.id);
          console.log('Membership result:', membership);

          if (!membership) {
            console.log('No membership found - showing create workspace form');
            setWorkspaceOwnerId(user.id);
            setFlowState('needs-workspace');
            return;
          }

          if (safeNextPath) {
            router.replace(safeNextPath);
            return;
          }

          setActiveWorkspaceName(membership.workspaceName ?? 'your workspace');
          setFlowState('done');
          return;
        }
      } catch (e) {
        console.log('Session check error:', e);
      }
    })();

    // Check for hash fragment tokens that Supabase client should have processed
    const hasHashTokens = window.location.hash.includes('access_token=');

    if (hasHashTokens) {
      // Wait for Supabase client to process the hash and set session
      void (async () => {
        try {
          console.log('Hash tokens detected, waiting for session...');

          // Small delay to let Supabase client initialize
          await new Promise((resolve) => setTimeout(resolve, 100));

          const {
            data: { session },
            error: sessionError,
          } = await getSupabaseBrowserClient().auth.getSession();

          console.log('Session result:', { session: session ? 'exists' : null, sessionError, user: session?.user?.id });

          if (sessionError) {
            console.error('Session error:', sessionError);
            setErrorMessage('This sign-in link is invalid or expired.');
            setFlowState('error');
            return;
          }

          if (!session?.user) {
            console.log('No session/user found after 100ms, waiting longer...');

            // Try waiting longer
            await new Promise((resolve) => setTimeout(resolve, 500));

            const retryResult = await getSupabaseBrowserClient().auth.getSession();
            console.log('Retry session result:', { session: retryResult.data.session ? 'exists' : null, error: retryResult.error });

            if (!retryResult.data.session?.user) {
              setErrorMessage('This sign-in link is invalid or expired.');
              setFlowState('error');
              return;
            }

            const user = retryResult.data.session.user;

            if (safeNextPath?.startsWith('/invites/')) {
              router.replace(safeNextPath);
              return;
            }

            const membership = await findWorkspaceMembership(user.id);

            if (!membership) {
              setWorkspaceOwnerId(user.id);
              setFlowState('needs-workspace');
              return;
            }

            if (safeNextPath) {
              router.replace(safeNextPath);
              return;
            }

            setActiveWorkspaceName(membership.workspaceName ?? 'your workspace');
            setFlowState('done');
            return;
          }

          const user = session.user;

          if (safeNextPath?.startsWith('/invites/')) {
            router.replace(safeNextPath);
            return;
          }

          const membership = await findWorkspaceMembership(user.id);

          if (!membership) {
            setWorkspaceOwnerId(user.id);
            setFlowState('needs-workspace');
            return;
          }

          if (safeNextPath) {
            router.replace(safeNextPath);
            return;
          }

          setActiveWorkspaceName(membership.workspaceName ?? 'your workspace');
          setFlowState('done');
        } catch {
          setErrorMessage('We could not complete your sign-in link. Try again.');
          setFlowState('error');
        }
      })();
      return;
    }

    const authCode = searchParams.get('code');
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

        if (safeNextPath?.startsWith('/invites/')) {
          router.replace(safeNextPath);
          return;
        }

        const membership = await findWorkspaceMembership(data.user.id);

        if (!membership) {
          setWorkspaceOwnerId(data.user.id);
          setFlowState('needs-workspace');
          return;
        }

        if (safeNextPath) {
          router.replace(safeNextPath);
          return;
        }

        setActiveWorkspaceName(membership.workspaceName ?? 'your workspace');
        setFlowState('done');
      } catch {
        setErrorMessage('We could not complete your sign-in link. Try again.');
        setFlowState('error');
      }
    })();
  }, [router]);

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

      if (nextPath) {
        router.replace(nextPath);
        return;
      }

      setActiveWorkspaceName(createdWorkspace.workspaceName ?? 'your workspace');
      setFlowState('done');
    } catch (err) {
      console.error('Create workspace error:', err);
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
          <h1 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 700 }}>
            Name your shared workspace
          </h1>
          <p style={{ margin: '0 0 24px', fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--text-muted)' }}>
            Create the workspace once, then start sharing boxes and inventory.
          </p>
          <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label htmlFor="workspace-name" className="ui-label">
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
                className="ui-input"
              />
            </div>
            {errorMessage ? (
              <p role="alert" className="ui-alert">{errorMessage}</p>
            ) : null}
            <button type="submit" className="ui-btn-primary">
              Create workspace
            </button>
          </form>
        </>
      ) : flowState === 'error' ? (
        <>
          <h1 style={{ margin: '0 0 12px', fontSize: '1.5rem', fontWeight: 700 }}>
            Sign-in failed
          </h1>
          <p role="alert" className="ui-alert" style={{ marginBottom: '16px' }}>
            {errorMessage}
          </p>
          <a href="/" className="ui-btn-primary">
            Back to home
          </a>
        </>
      ) : (
        <>
          <h1 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 700 }}>
            Completing sign-in…
          </h1>
          <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--text-muted)' }}>
            Please wait while we finish signing you in.
          </p>
        </>
      )}
    </WorkspaceOnboardingLayout>
  );
}
