'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { getActiveWorkspace } from '@/src/features/workspace-access';
import { type BoxSummary, createBox, listBoxes } from './inventoryService';

function getBoxNameLabel(name: string | null) {
  return name && name.trim() ? name : 'Unnamed box';
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
    } catch {
      setErrorMessage('We could not create your box. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!hasWorkspace) {
    return (
      <main>
        <h1>Inventory</h1>
        <p role="alert">{errorMessage}</p>
      </main>
    );
  }

  if (isLoadingWorkspace) {
    return (
      <main>
        <h1>Inventory</h1>
        <p>Loading your inventory…</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Inventory</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="box-name">Box name</label>
        <input
          id="box-name"
          type="text"
          value={boxName}
          onChange={(event) => {
            setBoxName(event.target.value);
            setErrorMessage(null);
          }}
        />
        {errorMessage ? <p role="alert">{errorMessage}</p> : null}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating box…' : 'Create box'}
        </button>
      </form>
      {!hasLoadError && boxes.length === 0 ? (
        <p>No boxes yet. Create your first box to get started.</p>
      ) : (
        <ul>
          {boxes.map((box) => (
            <li key={box.id}>
              <Link href={`/boxes/${box.boxId}`}>
                <span>{box.boxId}</span>
                <span>{getBoxNameLabel(box.name)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
