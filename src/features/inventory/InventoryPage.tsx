'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { InviteSender } from '@/src/features/workspace-invites';
import { getActiveWorkspace } from '@/src/features/workspace-access';
import { type BoxSummary, createBox, listBoxes } from './inventoryService';

function getBoxNameLabel(name: string | null) {
  return name && name.trim() ? name : 'Unnamed box';
}

function BoxIcon({ muted }: { muted?: boolean }) {
  const color = muted ? '#a594e0' : 'white';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function InventoryPage() {
  const [boxes, setBoxes] = useState<BoxSummary[]>([]);
  const [boxName, setBoxName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [hasWorkspace, setHasWorkspace] = useState(true);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const workspace = await getActiveWorkspace();
        if (!workspace) {
          setHasWorkspace(false);
          setErrorMessage('We could not load your inventory. Sign in again.');
          return;
        }

        setHasWorkspace(true);
        setWorkspaceId(workspace.workspaceId);
        setHasLoadError(false);

        try {
          const loadedBoxes = await listBoxes(workspace.workspaceId);
          setBoxes(loadedBoxes);
        } catch {
          setHasLoadError(true);
          setErrorMessage('We could not load your inventory. Try again.');
        }
      } catch {
        setHasWorkspace(false);
        setErrorMessage('We could not load your inventory. Sign in again.');
      } finally {
        setIsLoadingWorkspace(false);
      }
    })();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const trimmedBoxName = boxName.trim();

    if (!workspaceId) {
      return;
    }

    setIsSubmitting(true);

    try {
      const createdBox = await createBox(workspaceId, trimmedBoxName || null);
      setBoxes((currentBoxes) => [...currentBoxes, createdBox]);
      setBoxName('');
      setErrorMessage(null);
      setIsFormOpen(false);
    } catch {
      setErrorMessage('We could not create your box. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!hasWorkspace) {
    return (
      <main className="inventory-shell">
        <h1 className="inventory-page-title">Inventory</h1>
        <p role="alert" className="ui-alert">{errorMessage}</p>
      </main>
    );
  }

  if (isLoadingWorkspace) {
    return (
      <main className="inventory-shell">
        <h1 className="inventory-page-title">Inventory</h1>
        <div className="inventory-list-card">
          <div className="ui-empty">
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>Loading your inventory…</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="inventory-shell">
      <h1 className="inventory-page-title">Inventory</h1>

      {/* Create box card */}
      <div className="inventory-create-card">
        <h2 className="inventory-create-title">Create new box</h2>
        {errorMessage && !isFormOpen ? <p role="alert" className="ui-alert" style={{ marginBottom: '12px' }}>{errorMessage}</p> : null}
        {isFormOpen ? (
          <form onSubmit={handleSubmit}>
            <div className="inventory-create-fields">
              <div>
                <label htmlFor="box-name" className="ui-label">Box name</label>
                <input
                  id="box-name"
                  type="text"
                  placeholder="Kitchen supplies"
                  value={boxName}
                  onChange={(event) => {
                    setBoxName(event.target.value);
                    setErrorMessage(null);
                  }}
                  className="ui-input"
                />
              </div>
            </div>
            {errorMessage ? <p role="alert" className="ui-alert" style={{ marginBottom: '12px' }}>{errorMessage}</p> : null}
            <div className="inventory-create-actions">
              <button type="submit" disabled={isSubmitting} className="ui-btn-primary">
                {isSubmitting ? 'Creating…' : 'Create'}
              </button>
              <button
                type="button"
                className="ui-btn-secondary"
                onClick={() => {
                  setIsFormOpen(false);
                  setBoxName('');
                  setErrorMessage(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            className="ui-btn-primary"
            onClick={() => setIsFormOpen(true)}
          >
            + Create box
          </button>
        )}
      </div>

      {/* Invite member */}
      {workspaceId ? <InviteSender workspaceId={workspaceId} /> : null}

      {/* Box list */}
      <div className="inventory-list-card">
        <nav aria-label="Inventory actions" className="inventory-actions-nav">
          <Link href="/search" className="ui-btn-link">Search inventory</Link>
          <Link href="/scan" className="ui-btn-link">Scan box QR</Link>
        </nav>
        {!hasLoadError && boxes.length === 0 ? (
          <div className="ui-empty">
            <div className="ui-empty-icon">
              <BoxIcon muted />
            </div>
            <p className="ui-empty-title">No boxes yet</p>
            <p className="ui-empty-body">Create your first box to get started</p>
          </div>
        ) : null}
        {boxes.length > 0 ? (
          <ul style={{ list: 'none', margin: 0, padding: 0 } as React.CSSProperties}>
            {boxes.map((box) => (
              <li key={box.id} style={{ listStyle: 'none' }}>
                <Link href={`/boxes/${box.boxId}`} className="inventory-box-row">
                  <div>
                    <div className="inventory-box-id">{box.boxId}</div>
                    <div className="inventory-box-name">{getBoxNameLabel(box.name)}</div>
                  </div>
                  <span className="inventory-box-chevron"><ChevronRight /></span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </main>
  );
}
