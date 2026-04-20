'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AuthEntryPage } from '@/src/features/auth-entry';
import { BoxDetailsPage } from '@/src/features/box-details';
import { DeletedBoxPage, getBoxRouteState } from '@/src/features/box-retirement';
import { getActiveWorkspace } from './index';

type BoxAccessGateProps = {
  boxId: string;
};

type AccessState = 'loading' | 'signed-out' | 'active' | 'deleted' | 'access-denied';

function AccessDeniedBoxPage({ boxId }: { boxId: string }) {
  return (
    <main>
      <h1>Access denied</h1>
      <p>You do not have permission to open {boxId}.</p>
      <nav aria-label="Box access recovery">
        <Link href="/inventory">Back to inventory</Link>
      </nav>
    </main>
  );
}

export function BoxAccessGate({ boxId }: BoxAccessGateProps) {
  const [accessState, setAccessState] = useState<AccessState>('loading');

  useEffect(() => {
    void (async () => {
      try {
        const workspace = await getActiveWorkspace();

        if (!workspace) {
          setAccessState('signed-out');
          return;
        }

        setAccessState(await getBoxRouteState(workspace.workspaceId, boxId));
      } catch {
        setAccessState('signed-out');
      }
    })();
  }, [boxId]);

  if (accessState === 'loading') {
    return (
      <main>
        <h1>Loading box…</h1>
      </main>
    );
  }

  if (accessState === 'signed-out') {
    return (
      <AuthEntryPage
        title={`Sign in to open ${boxId}`}
        description="Email yourself a magic link to open this box in your shared storage workspace."
        nextPath={`/boxes/${boxId}`}
      />
    );
  }

  if (accessState === 'deleted') {
    return <DeletedBoxPage boxId={boxId} />;
  }

  if (accessState === 'access-denied') {
    return <AccessDeniedBoxPage boxId={boxId} />;
  }

  return <BoxDetailsPage boxId={boxId} />;
}
