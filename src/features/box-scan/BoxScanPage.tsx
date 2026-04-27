'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBoxIdFromScanValue } from './boxScanService';

type DetectedBarcode = {
  rawValue?: string;
};

type BarcodeDetectorInstance = {
  detect(source: ImageBitmapSource): Promise<DetectedBarcode[]>;
};

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorInstance;

type WindowWithBarcodeDetector = Window & typeof globalThis & {
  BarcodeDetector?: BarcodeDetectorConstructor;
};

const INVALID_QR_MESSAGE = 'That QR code does not point to a box in this app.';

function getBarcodeDetector() {
  return (window as WindowWithBarcodeDetector).BarcodeDetector;
}

export function BoxScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorInstance | null>(null);
  const frameRef = useRef<number | null>(null);
  const isOpeningRef = useRef(false);
  const [manualValue, setManualValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const canScanWithCamera = typeof window !== 'undefined'
    && typeof navigator !== 'undefined'
    && typeof navigator.mediaDevices?.getUserMedia === 'function'
    && typeof getBarcodeDetector() === 'function';

  function stopCamera() {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    const stream = streamRef.current;

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const video = videoRef.current;

    if (video) {
      video.srcObject = null;
    }

    setIsCameraActive(false);
  }

  useEffect(() => stopCamera, []);

  function openScannedValue(scanValue: string) {
    const boxId = getBoxIdFromScanValue(scanValue);

    if (!boxId) {
      setErrorMessage(INVALID_QR_MESSAGE);
      return false;
    }

    isOpeningRef.current = true;
    stopCamera();
    router.push(`/boxes/${boxId}`);
    return true;
  }

  async function scanVideoFrame() {
    const video = videoRef.current;
    const detector = detectorRef.current;

    if (!video || !detector || isOpeningRef.current) {
      return;
    }

    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      frameRef.current = requestAnimationFrame(() => {
        void scanVideoFrame();
      });
      return;
    }

    try {
      const detectedCodes = await detector.detect(video);

      for (const code of detectedCodes) {
        if (code.rawValue && openScannedValue(code.rawValue)) {
          return;
        }
      }
    } catch {
      setErrorMessage('The camera could not read that QR code. Try again.');
      stopCamera();
      return;
    }

    frameRef.current = requestAnimationFrame(() => {
      void scanVideoFrame();
    });
  }

  async function handleStartCamera() {
    if (!canScanWithCamera || isStartingCamera || isCameraActive) {
      return;
    }

    setIsStartingCamera(true);
    setErrorMessage(null);
    isOpeningRef.current = false;

    try {
      const BarcodeDetector = getBarcodeDetector();

      if (!BarcodeDetector) {
        setErrorMessage('This browser cannot scan QR codes with the camera yet.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: 'environment',
          },
        },
      });

      const video = videoRef.current;

      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      detectorRef.current = new BarcodeDetector({ formats: ['qr_code'] });
      streamRef.current = stream;
      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;
      await video.play();
      setIsCameraActive(true);
      frameRef.current = requestAnimationFrame(() => {
        void scanVideoFrame();
      });
    } catch {
      setErrorMessage('We could not start the camera. Check camera access and try again.');
      stopCamera();
    } finally {
      setIsStartingCamera(false);
    }
  }

  function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (openScannedValue(manualValue)) {
      setManualValue('');
    }
  }

  return (
    <main className="box-scan-shell">
      <div className="box-scan-header">
        <Link href="/inventory" className="box-details-back">&lt; Back</Link>
        <h1 className="box-scan-title">Scan box QR</h1>
      </div>

      <section className="box-scan-card" aria-label="Scan box QR code">
        <p className="box-scan-copy">Scan an existing box label and jump straight into that box.</p>
        <div className="box-scan-camera-frame">
          <video ref={videoRef} className="box-scan-video" aria-label="Box QR scanner preview" />
          {!isCameraActive ? <p className="box-scan-camera-placeholder">Camera preview appears here.</p> : null}
        </div>
        <div className="box-scan-actions">
          <button type="button" className="ui-btn-primary" onClick={() => void handleStartCamera()} disabled={!canScanWithCamera || isStartingCamera || isCameraActive}>
            {isStartingCamera ? 'Starting camera…' : isCameraActive ? 'Camera active' : 'Start camera scan'}
          </button>
          {isCameraActive ? (
            <button type="button" className="ui-btn-secondary" onClick={stopCamera}>
              Stop camera
            </button>
          ) : null}
        </div>
        {!canScanWithCamera ? (
          <p className="box-scan-note">Live camera scanning is not available in this browser. Paste a QR value below instead.</p>
        ) : null}
        <form className="box-scan-form" onSubmit={handleManualSubmit}>
          <label htmlFor="qr-value" className="ui-label">QR code value</label>
          <input
            id="qr-value"
            type="text"
            value={manualValue}
            onChange={(event) => {
              setManualValue(event.target.value);
              setErrorMessage(null);
            }}
            placeholder="https://your-app.example/boxes/BOX-0001"
            className="ui-input"
          />
          <button type="submit" className="ui-btn-secondary">Open scanned box</button>
        </form>
        {errorMessage ? <p role="alert" className="ui-alert">{errorMessage}</p> : null}
      </section>
    </main>
  );
}
