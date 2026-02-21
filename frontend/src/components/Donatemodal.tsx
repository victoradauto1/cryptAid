import React from "react";

/* ============================================================
   TYPES
============================================================ */

interface DonateModalProps {
  isOpen: boolean;
  amount: string;
  onAmountChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  disabled?: boolean;
  error?: string;
}

/* ============================================================
   COMPONENT
============================================================ */

/**
 * DonateModal
 *
 * Specialized modal for campaign donations.
 * Includes amount input and validation.
 */
export default function DonateModal({
  isOpen,
  amount,
  onAmountChange,
  onCancel,
  onConfirm,
  disabled = false,
  error,
}: DonateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <h3 className="text-xl font-bold mb-4 text-[#3b3b3b]">
          Make a Donation
        </h3>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2 text-[#3b3b3b]">
            Amount (ETH)
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.1"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            className="w-full p-3 rounded-lg bg-[#faf8f6] border border-[#d0d0d0] text-[#3b3b3b] focus:outline-none focus:ring-2 focus:ring-[#3f8f7b]"
            disabled={disabled}
          />
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={disabled}
            className="flex-1 px-4 py-2 border border-[#d0d0d0] rounded-lg font-medium text-[#3b3b3b] hover:bg-[#faf8f6] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            className="flex-1 px-4 py-2 bg-[#3f8f7b] hover:bg-[#2d7561] text-white font-semibold rounded-lg transition-colors disabled:bg-[#9b9b9b] disabled:cursor-not-allowed"
          >
            {disabled ? "Processing..." : "Confirm Donation"}
          </button>
        </div>
      </div>
    </div>
  );
}