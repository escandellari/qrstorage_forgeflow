"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { getActiveWorkspace } from "@/src/features/workspace-access";
import {
  getBoxDetails,
  type BoxDetails,
} from "@/src/features/box-details/boxDetailsService";
import { BoxLabelPrintButton } from "./BoxLabelPrintButton";
import { buildBoxLabelUrl } from "./boxLabelService";

type BoxLabelPageProps = {
  boxId: string;
};

function ChevronLeft() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

const LABEL_LOAD_ERROR_MESSAGE = "We could not load your label. Sign in again.";

export function BoxLabelPage({ boxId }: BoxLabelPageProps) {
  const [box, setBox] = useState<BoxDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const workspace = await getActiveWorkspace();

        if (!workspace) {
          setErrorMessage(LABEL_LOAD_ERROR_MESSAGE);
          return;
        }

        const loadedBox = await getBoxDetails(workspace.workspaceId, boxId);

        if (!loadedBox) {
          setErrorMessage(LABEL_LOAD_ERROR_MESSAGE);
          return;
        }

        setBox(loadedBox);
      } catch {
        setErrorMessage(LABEL_LOAD_ERROR_MESSAGE);
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

  const boxUrl = buildBoxLabelUrl(window.location.origin, box.boxId);

  return (
    <main className="box-label-page">
      <div className="box-label-actions">
        <Link href={`/boxes/${boxId}`} className="box-details-back">
          <ChevronLeft /> Back
        </Link>
        <BoxLabelPrintButton />
      </div>
      <section aria-label="Printable box label" className="box-label-sheet">
        <QRCodeSVG
          className="box-label-qr"
          title="Box QR code"
          value={boxUrl}
        />
        <h1>{box.boxId}</h1>
        {box.name ? <p className="box-label-name">{box.name}</p> : null}
      </section>
    </main>
  );
}
