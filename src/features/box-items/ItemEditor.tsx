import { FormEvent } from 'react';
import { BoxItemDraft } from './boxItemsService';

type ItemEditorProps = {
  draft: BoxItemDraft;
  submitLabel: string;
  isSubmitting: boolean;
  onChange: (draft: BoxItemDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ItemEditor({
  draft,
  submitLabel,
  isSubmitting,
  onChange,
  onSubmit,
}: ItemEditorProps) {
  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="item-name">Item name</label>
      <input
        id="item-name"
        type="text"
        value={draft.name}
        onChange={(event) => onChange({ ...draft, name: event.target.value })}
      />

      <label htmlFor="item-category">Category</label>
      <input
        id="item-category"
        type="text"
        value={draft.category}
        onChange={(event) => onChange({ ...draft, category: event.target.value })}
      />

      <label htmlFor="item-notes">Item notes</label>
      <textarea
        id="item-notes"
        value={draft.notes}
        onChange={(event) => onChange({ ...draft, notes: event.target.value })}
      />

      <label htmlFor="item-quantity">Quantity</label>
      <input
        id="item-quantity"
        type="number"
        inputMode="numeric"
        min="0"
        value={draft.quantity}
        onChange={(event) => onChange({ ...draft, quantity: event.target.value })}
      />

      <button type="submit" disabled={isSubmitting || !draft.name.trim()}>
        {isSubmitting ? 'Saving item…' : submitLabel}
      </button>
    </form>
  );
}
