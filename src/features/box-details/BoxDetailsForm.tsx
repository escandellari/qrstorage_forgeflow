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
      <label htmlFor="box-name">Box name</label>
      <input
        id="box-name"
        type="text"
        value={draft.name}
        onChange={(event) => {
          onChange({ ...draft, name: event.target.value });
        }}
      />

      <label htmlFor="box-location">Location</label>
      <input
        id="box-location"
        type="text"
        value={draft.location}
        onChange={(event) => {
          onChange({ ...draft, location: event.target.value });
        }}
      />

      <label htmlFor="box-notes">Notes</label>
      <textarea
        id="box-notes"
        value={draft.notes}
        onChange={(event) => {
          onChange({ ...draft, notes: event.target.value });
        }}
      />

      <label htmlFor="box-label-target">Label target</label>
      <input
        id="box-label-target"
        type="text"
        value={draft.labelTarget}
        onChange={(event) => {
          onChange({ ...draft, labelTarget: event.target.value });
        }}
      />

      {errorMessage ? <p role="alert">{errorMessage}</p> : null}

      <button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving…' : 'Save box details'}
      </button>
    </form>
  );
}
