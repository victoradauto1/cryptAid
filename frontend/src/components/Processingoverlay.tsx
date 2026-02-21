import React from "react";

/* ============================================================
   TYPES
============================================================ */

interface ProcessingOverlayProps {
  isOpen: boolean;
  title?: string;
  message?: string;
}

/* ============================================================
   COMPONENT
============================================================ */

/**
 * ProcessingOverlay
 *
 * Full-screen overlay shown during blockchain transactions.
 * Displays loading spinner and instructions.
 */
export default function ProcessingOverlay({
  isOpen,
  title = "Processing Transaction",
  message = "Please confirm the transaction in your wallet and wait for blockchain confirmation...",
}: ProcessingOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-150">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center">
        <div className="w-16 h-16 border-4 border-[#3f8f7b] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-[#3b3b3b]">{title}</h3>
        <p className="text-sm text-[#6b6b6b]">{message}</p>
      </div>
    </div>
  );
}