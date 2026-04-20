'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthEntryPage } from '@/src/features/auth-entry';
import { useMagicLinkRequest } from '@/src/features/auth-entry/useMagicLinkRequest';
import { acceptWorkspaceInvite, type InviteAcceptanceResult } from './inviteService';

type InviteAcceptancePageProps = {
  token: string;
};

export function InviteAcceptancePage({ token }: InviteAcceptancePageProps) {
  const router = useRouter();
  const requestMagicLink = useMagicLinkRequest();
  const hasStartedRef = useRef(false);
  const [result, setResult] = useState<InviteAcceptanceResult | null>(null);
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [magicLinkError, setMagicLinkError] = useState<string | null>(null);

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;

    void (async () => {
      try {
        const nextResult = await acceptWorkspaceInvite(token);
        setResult(nextResult);

        if (
          nextResult.status === 'accepted' ||
          nextResult.status === 'already-accepted' ||
          nextResult.status === 'already-member'
        ) {
          router.replace('/inventory');
        }
      } catch {
        setResult({ status: 'error' });
      }
    })();
  }, [router, token]);

  if (result?.status === 'signed-out') {
    return (
      <AuthEntryPage
        title="Sign in to accept your invite"
        description="Email yourself a magic link to join this shared storage workspace."
        nextPath={`/invites/${token}`}
      />
    );
  }

  if (result?.status === 'email-mismatch') {
    return (
      <main>
        <h1>This invite is for {result.invitedEmail}</h1>
        <p role="alert">
          You are signed in as {result.signedInEmail}. Sign in again with {result.invitedEmail} to
          join this workspace.
        </p>
        {magicLinkError ? <p role="alert">{magicLinkError}</p> : null}
        <button
          type="button"
          disabled={isSendingMagicLink}
          onClick={() => {
            setMagicLinkError(null);
            setIsSendingMagicLink(true);

            void (async () => {
              try {
                await requestMagicLink(result.invitedEmail, `/invites/${token}`);
              } catch {
                setMagicLinkError('We could not send your sign-in link. Try again.');
              } finally {
                setIsSendingMagicLink(false);
              }
            })();
          }}
        >
          {isSendingMagicLink ? `Sending link to ${result.invitedEmail}…` : `Sign in with ${result.invitedEmail}`}
        </button>
      </main>
    );
  }

  if (result?.status === 'expired') {
    return (
      <main>
        <h1>This invite has expired</h1>
        <p role="alert">Ask the workspace owner to send a fresh invite to {result.invitedEmail}.</p>
      </main>
    );
  }

  if (result?.status === 'already-accepted' || result?.status === 'already-member') {
    return (
      <main>
        <h1>You are already in this workspace</h1>
        <p>Taking you back to your workspace.</p>
      </main>
    );
  }

  if (result?.status === 'error') {
    return (
      <main>
        <h1>Invite</h1>
        <p role="alert">We could not open this invite. Try again.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Opening your invite…</h1>
      <p>Please wait while we open your workspace invite.</p>
    </main>
  );
}
