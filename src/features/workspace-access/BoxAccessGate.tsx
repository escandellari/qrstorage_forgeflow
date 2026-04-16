'use client';

import { useEffect, useState } from 'react';
import { AuthEntryPage } from '@/src/features/auth-entry';
import { BoxDetailsPage } from '@/src/features/box-details';
import { getActiveWorkspace } from './index';

type BoxAccessGateProps = {
  boxId: string;
};

export function BoxAccessGate({ boxId }: BoxAccessGateProps) {
  const [accessState, setAccessState] = useState<'loading' | 'signed-out' | 'ready'>('loading');

  useEffect(() => {
    void (async () => {
      try {
        const workspace = await getActiveWorkspace();
        setAccessState(workspace ? 'ready' : 'signed-out');
      } catch {
        setAccessState('signed-out');
      }
    })();
  }, []);

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

  return <BoxDetailsPage boxId={boxId} />;
}
