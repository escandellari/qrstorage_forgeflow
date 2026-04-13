'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  type BoxItem,
  createBoxItem,
  createBoxItemDraft,
  listBoxItems,
  removeBoxItem,
  updateBoxItem,
} from './boxItemsService';
import { ItemEditor } from './ItemEditor';

type BoxItemsPanelProps = {
  boxId: string;
};

function getItemValueLabel(value: string | number | null) {
  return value === null || value === '' ? 'Not set' : value;
}

export function BoxItemsPanel({ boxId }: BoxItemsPanelProps) {
  const [items, setItems] = useState<BoxItem[]>([]);
  const [draft, setDraft] = useState(createBoxItemDraft());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setItems(await listBoxItems(boxId));
      } catch {
        setErrorMessage('We could not update your items. Try again.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [boxId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || !draft.name.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingItemId) {
        const updatedItem = await updateBoxItem(editingItemId, boxId, draft);
        setItems((currentItems) =>
          currentItems.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
        );
        setEditingItemId(null);
      } else {
        const createdItem = await createBoxItem(boxId, draft);
        setItems((currentItems) => [...currentItems, createdItem]);
      }

      setDraft(createBoxItemDraft());
      setErrorMessage(null);
    } catch {
      setErrorMessage('We could not update your items. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove(item: BoxItem) {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await removeBoxItem(item.id);
      setItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== item.id));
      if (editingItemId === item.id) {
        setEditingItemId(null);
        setDraft(createBoxItemDraft());
      }
      setErrorMessage(null);
    } catch {
      setErrorMessage('We could not update your items. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section aria-label="Box items">
      <h2>Box items</h2>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      {isLoading ? <p>Loading items…</p> : null}
      {!isLoading && items.length === 0 ? <p>No items yet.</p> : null}
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <strong>{item.name}</strong>
            <div>Category: {getItemValueLabel(item.category)}</div>
            <div>Notes: {getItemValueLabel(item.notes)}</div>
            <div>Quantity: {getItemValueLabel(item.quantity)}</div>
            <button
              type="button"
              onClick={() => {
                setDraft(createBoxItemDraft(item));
                setEditingItemId(item.id);
                setErrorMessage(null);
              }}
            >
              Edit {item.name}
            </button>
            <button type="button" onClick={() => void handleRemove(item)}>
              Remove {item.name}
            </button>
          </li>
        ))}
      </ul>
      <ItemEditor
        draft={draft}
        submitLabel={editingItemId ? 'Save item' : 'Add item'}
        isSubmitting={isSubmitting}
        onChange={(nextDraft) => {
          setDraft(nextDraft);
          setErrorMessage(null);
        }}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
