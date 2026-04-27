'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getActiveWorkspace } from '@/src/features/workspace-access';
import { retireBox } from '@/src/features/box-retirement';
import {
  type BoxDetails,
  type BoxDetailsDraft,
  createBoxDetailsDraft,
  getBoxDetails,
  updateBoxDetails,
} from './boxDetailsService';
import { BoxItemsPanel } from '@/src/features/box-items';
import { BoxDetailsForm } from './BoxDetailsForm';

type BoxDetailsPageProps = {
  boxId: string;
};

function getSavedValueLabel(value: string | null) {
  return value && value.trim() ? value : 'Not set';
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function LabelIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

export function BoxDetailsPage({ boxId }: BoxDetailsPageProps) {
  const router = useRouter();
  const [box, setBox] = useState<BoxDetails | null>(null);
  const [draft, setDraft] = useState<BoxDetailsDraft>({
    name: '',
    location: '',
    notes: '',
    labelTarget: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const workspace = await getActiveWorkspace();

        if (!workspace) {
          setErrorMessage('We could not load your box. Sign in again.');
          return;
        }

        setWorkspaceId(workspace.workspaceId);
        const loadedBox = await getBoxDetails(workspace.workspaceId, boxId);

        if (!loadedBox) {
          setErrorMessage('We could not load your box. Sign in again.');
          return;
        }

        setBox(loadedBox);
        setDraft(createBoxDetailsDraft(loadedBox));
      } catch {
        setErrorMessage('We could not load your box. Sign in again.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [boxId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!workspaceId || !box || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const updatedBox = await updateBoxDetails(workspaceId, box.boxId, draft);
      setBox(updatedBox);
      setDraft(createBoxDetailsDraft(updatedBox));
      setErrorMessage(null);
    } catch {
      setErrorMessage('We could not save your box details. Try again.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!workspaceId || !box || isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      await retireBox(workspaceId, box.boxId);
      setErrorMessage(null);
      router.replace('/inventory');
    } catch {
      setErrorMessage('We could not delete your box. Try again.');
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="box-details-shell">
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Loading box…</p>
      </main>
    );
  }

  if (!box) {
    return (
      <main className="box-details-shell">
        <p role="alert" className="ui-alert">{errorMessage}</p>
      </main>
    );
  }

  return (
    <main className="box-details-shell">
      {/* Header */}
      <div className="box-details-header">
        <Link href="/inventory" className="box-details-back">
          <ChevronLeft /> Back
        </Link>
        <h1 className="box-details-title">{box.boxId}</h1>
        <Link href={`/boxes/${box.boxId}/label`} className="box-details-action-link">
          <LabelIcon /> Label
        </Link>
      </div>

      {/* Saved summary */}
      <div className="box-details-card">
        <p className="box-details-section-title">Saved details</p>
        <section aria-label="Saved box details">
          <dl className="box-details-dl">
            <div>
              <dt>Box name</dt>
              <dd>{getSavedValueLabel(box.name)}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{getSavedValueLabel(box.location)}</dd>
            </div>
            <div>
              <dt>Notes</dt>
              <dd>{getSavedValueLabel(box.notes)}</dd>
            </div>
            <div>
              <dt>Label target</dt>
              <dd>{getSavedValueLabel(box.labelTarget)}</dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Edit form */}
      <div className="box-details-card">
        <p className="box-details-section-title">Edit details</p>
        <BoxDetailsForm
          draft={draft}
          isSaving={isSaving}
          errorMessage={errorMessage}
          onChange={(nextDraft) => {
            setDraft(nextDraft);
            setErrorMessage(null);
          }}
          onSubmit={handleSubmit}
        />
      </div>

      {/* Items */}
      <BoxItemsPanel boxId={box.id} />

      {/* Delete */}
      <div style={{ padding: '8px 0 24px' }}>
        <nav aria-label="Box actions">
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
            className="ui-btn-danger"
          >
            {isDeleting ? 'Deleting box…' : 'Delete box'}
          </button>
        </nav>
      </div>
    </main>
  );
}
