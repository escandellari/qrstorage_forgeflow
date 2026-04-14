'use client';

export function BoxLabelPrintButton() {
  return (
    <button type="button" onClick={() => window.print()}>
      Print label
    </button>
  );
}
