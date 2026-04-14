'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getActiveWorkspace } from '@/src/features/workspace-access';
import { getBoxDetails, type BoxDetails } from '@/src/features/box-details/boxDetailsService';
import { BoxLabelPrintButton } from './BoxLabelPrintButton';

type BoxLabelPageProps = {
  boxId: string;
};

export function BoxLabelPage({ boxId }: BoxLabelPageProps) {
  const [box, setBox] = useState<BoxDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const workspace = await getActiveWorkspace();

        if (!workspace) {
          setErrorMessage('We could not load your label. Sign in again.');
          return;
        }

        const loadedBox = await getBoxDetails(workspace.workspaceId, boxId);

        if (!loadedBox) {
          setErrorMessage('We could not load your label. Sign in again.');
          return;
        }

        setBox(loadedBox);
      } catch {
        setErrorMessage('We could not load your label. Sign in again.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [boxId]);

  if (isLoading) {
    return (
      <main>
        <h1>Loading label…</h1>
      </main>
    );
  }

  if (!box) {
    return (
      <main>
        <h1>Box label</h1>
        <p role="alert">{errorMessage}</p>
      </main>
    );
  }

  const boxUrl = new URL(`/boxes/${box.boxId}`, window.location.origin).toString();

  return (
    <main className="box-label-page">
      <div className="box-label-actions">
        <BoxLabelPrintButton />
      </div>
      <section aria-label="Printable box label" className="box-label-sheet">
        <QRCodeSVG className="box-label-qr" title="Box QR code" value={boxUrl} />
        <h1>{box.boxId}</h1>
        {box.name ? <p className="box-label-name">{box.name}</p> : null}
      </section>
    </main>
  );
}
