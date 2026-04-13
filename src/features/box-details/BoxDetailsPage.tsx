'use client';

import { FormEvent, useEffect, useState } from 'react';
import { getActiveWorkspace } from '@/src/features/workspace-access';
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

export function BoxDetailsPage({ boxId }: BoxDetailsPageProps) {
  const [box, setBox] = useState<BoxDetails | null>(null);
  const [draft, setDraft] = useState<BoxDetailsDraft>({
    name: '',
    location: '',
    notes: '',
    labelTarget: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

  if (isLoading) {
    return (
      <main>
        <h1>Loading box…</h1>
      </main>
    );
  }

  if (!box) {
    return (
      <main>
        <h1>Box</h1>
        <p role="alert">{errorMessage}</p>
      </main>
    );
  }

  return (
    <main>
      <h1>{box.boxId}</h1>
      <section aria-label="Saved box details">
        <h2>Saved box details</h2>
        <dl>
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
      <BoxItemsPanel boxId={box.id} />
    </main>
  );
}
