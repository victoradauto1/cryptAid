import React from "react";

/* ============================================================
   TYPES
============================================================ */

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

/* ============================================================
   COMPONENT
============================================================ */

/**
 * ConfirmModal
 *
 * Generic confirmation modal component.
 * Used for user confirmations before actions.
 */
export default function ConfirmModal({
  isOpen,
  title,
  children,
  onCancel,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  disabled = false,
  icon,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          {icon && (
            <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <h3 className="text-xl font-bold text-[#3b3b3b]">{title}</h3>
        </div>

        {/* Content */}
        <div className="mb-6">{children}</div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={disabled}
            className="flex-1 px-4 py-2 border border-[#d0d0d0] rounded-lg font-medium text-[#3b3b3b] hover:bg-[#faf8f6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            className="flex-1 px-4 py-2 bg-[#3f8f7b] hover:bg-[#2d7561] text-white font-semibold rounded-lg transition-colors disabled:bg-[#9b9b9b] disabled:cursor-not-allowed"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   WALLET ICON (for wallet connection modals)
============================================================ */

export function WalletIcon() {
  return (
    <svg
      className="w-6 h-6 text-violet-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
}