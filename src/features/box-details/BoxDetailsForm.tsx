import { FormEvent } from 'react';
import { BoxDetailsDraft } from './boxDetailsService';

type BoxDetailsFormProps = {
  draft: BoxDetailsDraft;
  isSaving: boolean;
  errorMessage: string | null;
  onChange: (draft: BoxDetailsDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function BoxDetailsForm({
  draft,
  isSaving,
  errorMessage,
  onChange,
  onSubmit,
}: BoxDetailsFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <div className="box-details-form-fields">
        <div className="box-details-form-field">
          <label htmlFor="box-name" className="ui-label">Box name</label>
          <input
            id="box-name"
            type="text"
            value={draft.name}
            onChange={(event) => {
              onChange({ ...draft, name: event.target.value });
            }}
            className="ui-input"
          />
        </div>

        <div className="box-details-form-field">
          <label htmlFor="box-location" className="ui-label">Location</label>
          <input
            id="box-location"
            type="text"
            value={draft.location}
            onChange={(event) => {
              onChange({ ...draft, location: event.target.value });
            }}
            className="ui-input"
          />
        </div>

        <div className="box-details-form-field">
          <label htmlFor="box-notes" className="ui-label">Notes</label>
          <textarea
            id="box-notes"
            value={draft.notes}
            onChange={(event) => {
              onChange({ ...draft, notes: event.target.value });
            }}
            className="ui-input"
            style={{ minHeight: '80px', padding: '12px 16px', resize: 'vertical' }}
          />
        </div>

        <div className="box-details-form-field">
          <label htmlFor="box-label-target" className="ui-label">Label target</label>
          <input
            id="box-label-target"
            type="text"
            value={draft.labelTarget}
            onChange={(event) => {
              onChange({ ...draft, labelTarget: event.target.value });
            }}
            className="ui-input"
          />
        </div>
      </div>

      {errorMessage ? <p role="alert" className="ui-alert" style={{ marginBottom: '12px' }}>{errorMessage}</p> : null}

      <button type="submit" disabled={isSaving} className="ui-btn-primary">
        {isSaving ? 'Saving…' : 'Save box details'}
      </button>
    </form>
  );
}
