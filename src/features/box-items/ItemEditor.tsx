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
    <form onSubmit={onSubmit} className="items-add-form">
      <p className="items-add-form-title">{submitLabel === 'Add item' ? 'Add item' : 'Edit item'}</p>

      <div className="box-details-form-field">
        <label htmlFor="item-name" className="ui-label">Item name</label>
        <input
          id="item-name"
          type="text"
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
          className="ui-input"
          placeholder="e.g. Winter jacket"
        />
      </div>

      <div className="items-add-row">
        <div className="box-details-form-field">
          <label htmlFor="item-category" className="ui-label">Category</label>
          <input
            id="item-category"
            type="text"
            value={draft.category}
            onChange={(event) => onChange({ ...draft, category: event.target.value })}
            className="ui-input"
            placeholder="e.g. Clothing"
          />
        </div>

        <div className="box-details-form-field">
          <label htmlFor="item-quantity" className="ui-label">Quantity</label>
          <input
            id="item-quantity"
            type="number"
            inputMode="numeric"
            min="0"
            value={draft.quantity}
            onChange={(event) => onChange({ ...draft, quantity: event.target.value })}
            className="ui-input"
            placeholder="1"
          />
        </div>
      </div>

      <div className="box-details-form-field">
        <label htmlFor="item-notes" className="ui-label">Notes</label>
        <textarea
          id="item-notes"
          value={draft.notes}
          onChange={(event) => onChange({ ...draft, notes: event.target.value })}
          className="ui-input"
          style={{ minHeight: '64px', padding: '12px 16px', resize: 'vertical' }}
          placeholder="Optional notes"
        />
      </div>

      <button type="submit" disabled={isSubmitting || !draft.name.trim()} className="ui-btn-primary">
        {isSubmitting ? 'Saving item…' : submitLabel}
      </button>
    </form>
  );
}
