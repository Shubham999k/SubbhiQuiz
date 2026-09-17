import React, { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { X } from "lucide-react";

const QRScannerModal = ({ isOpen, onClose, onScan }) => {
  useEffect(() => {
    if (!isOpen) return;

    // We must ensure the element exists before initializing the scanner
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false,
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear();
      },
      (errorMessage) => {
        // Ignore general scanning errors as they happen constantly during scanning
        if (!errorMessage.includes("NotFoundException")) {
          console.log(errorMessage);
        }
      },
    );

    return () => {
      scanner
        .clear()
        .catch((error) =>
          console.error("Failed to clear html5QrcodeScanner. ", error),
        );
    };
  }, [isOpen, onScan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-bg-surface rounded-2xl shadow-xl border border-border-subtle w-full max-w-md overflow-hidden animate-slide-up relative">
        <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-bg-base">
          <h3 className="text-lg font-bold text-text-base">
            Scan Classroom QR
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-muted hover:text-text-base hover:bg-bg-hover transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-text-muted text-sm text-center mb-4">
            Point your camera at the QR code projected on the classroom screen.
          </p>

          <div className="rounded-xl overflow-hidden border-2 border-primary-500/30">
            <div id="qr-reader" className="w-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
