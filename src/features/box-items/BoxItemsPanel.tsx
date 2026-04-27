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
  const [hasLoadError, setHasLoadError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setHasLoadError(false);

      try {
        setItems(await listBoxItems(boxId));
      } catch {
        setHasLoadError(true);
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
    <div className="items-panel-card" style={{ marginBottom: '16px' }}>
      <section aria-label="Box items">
        <p className="items-panel-title">Items</p>

        {errorMessage ? <p role="alert" className="ui-alert" style={{ marginBottom: '12px' }}>{errorMessage}</p> : null}

        {isLoading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading items…</p>
        ) : !hasLoadError && items.length === 0 ? (
          <div className="ui-empty" style={{ padding: '24px' }}>
            <p className="ui-empty-title">No items yet</p>
            <p className="ui-empty-body">Add the first item to this box below</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {items.map((item) => (
              <li key={item.id} className="item-row">
                <div className="item-row-info">
                  <div className="item-row-name">{item.name}</div>
                  <div className="item-row-meta">
                    {item.category ? `${item.category}` : ''}
                    {item.category && item.notes ? ' · ' : ''}
                    {item.notes ? item.notes : ''}
                    {!item.category && !item.notes ? 'No details' : ''}
                  </div>
                </div>
                {item.quantity !== null ? (
                  <span className="item-qty-badge">{item.quantity}</span>
                ) : null}
                <div className="item-row-actions">
                  <button
                    type="button"
                    className="item-action-btn"
                    onClick={() => {
                      setDraft(createBoxItemDraft(item));
                      setEditingItemId(item.id);
                      setErrorMessage(null);
                    }}
                    aria-label={`Edit ${item.name}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="item-action-btn item-action-btn-danger"
                    onClick={() => void handleRemove(item)}
                    aria-label={`Remove ${item.name}`}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

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
    </div>
  );
}
