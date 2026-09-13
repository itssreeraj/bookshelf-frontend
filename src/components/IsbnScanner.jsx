import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

const hints = new Map();
// ISBNs are encoded as EAN-13 barcodes (prefixed 978/979). Restricting the
// formats we look for makes detection faster and avoids false positives.
hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]);

export default function IsbnScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const reader = new BrowserMultiFormatReader(hints);

    reader
      .decodeFromConstraints(
        // 'ideal' (not 'exact') so this still works on a desktop webcam with
        // no rear camera -- it just falls back to whatever camera exists.
        { video: { facingMode: { ideal: 'environment' } } },
        videoRef.current,
        (result) => {
          if (cancelled || !result) return;
          const text = result.getText();
          // Extra filter: only accept codes that actually look like an ISBN-13,
          // in case a non-book EAN-13 barcode drifts into frame.
          if (/^(978|979)\d{10}$/.test(text)) {
            onDetected(text);
          }
        }
      )
      .then((controls) => {
        if (cancelled) {
          controls.stop();
        } else {
          controlsRef.current = controls;
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err?.name === 'NotAllowedError'
            ? 'Camera access was denied. Allow camera permission and try again.'
            : 'Could not access a camera on this device.'
        );
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
    // Intentionally run once per mount -- the parent remounts this component
    // fresh each time the scanner modal opens, which is the lifecycle we want.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {error ? (
        <p className="text-stamp-red text-sm">{error}</p>
      ) : (
        <>
          <div className="relative overflow-hidden bg-ink">
            <video ref={videoRef} className="w-full aspect-[4/3] object-cover" muted playsInline />
            <div className="absolute inset-x-10 top-1/2 -translate-y-1/2 h-14 border-2 border-brass rounded pointer-events-none" />
          </div>
          <p className="text-xs text-ink/50 mt-2 text-center">
            Hold the barcode on the back of the book steady inside the frame
          </p>
        </>
      )}
      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full px-4 py-2 font-body text-sm text-ink/60 hover:text-ink"
      >
        Cancel
      </button>
    </div>
  );
}
