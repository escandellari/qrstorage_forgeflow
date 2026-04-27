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
    <div className="auth-shell">
      <div className="auth-card" style={{ alignItems: 'stretch', textAlign: 'left' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 700 }}>Access denied</h1>
        <p style={{ margin: '0 0 24px', fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          You do not have permission to open {boxId}.
        </p>
        <nav aria-label="Box access recovery">
          <Link href="/inventory" className="ui-btn-primary">Back to inventory</Link>
        </nav>
      </div>
    </div>
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
      <div className="auth-shell">
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Loading box…</p>
      </div>
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
