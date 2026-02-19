"use client";

/**
 * CreateCampaign
 *
 * Responsibilities:
 * - Collect campaign metadata (title, description, video, image)
 * - Enforce mandatory goal (ETH) and deadline (timestamp)
 * - Create campaign on-chain with all data in a single transaction
 * - Handle wallet connection flow
 *
 * Business Rules:
 * - Campaign succeeds when EITHER:
 *   1. Goal amount is reached, OR
 *   2. Deadline is reached (time-based goal)
 * - Both goal and deadline are mandatory
 * - Goal must be > 0 ETH
 * - Deadline must be in the future
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { parseEther } from "ethers";
import { useCryptoAid } from "../../context/cryptoAidProvider";

export default function CreateCampaign() {
  const router = useRouter();
  const { actions, isReady, connectWallet, account } = useCryptoAid();
  const isExecutingRef = useRef(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");

  // UI states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletMissing, setWalletMissing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /* ============================================================
     VALIDATION
  ============================================================ */

  const validateGoal = () => {
    if (!goal || goal.trim() === "") {
      throw new Error("Goal amount is required.");
    }

    const goalValue = parseFloat(goal);

    if (isNaN(goalValue) || goalValue <= 0) {
      throw new Error("Goal must be greater than 0 ETH.");
    }

    try {
      return parseEther(goal);
    } catch {
      throw new Error("Invalid goal format. Use numbers only (e.g., 1.5).");
    }
  };

  const validateDeadline = () => {
    if (!deadline) {
      throw new Error("Deadline is required.");
    }

    const timestamp = Math.floor(new Date(deadline).getTime() / 1000);
    const now = Math.floor(Date.now() / 1000);

    if (isNaN(timestamp) || timestamp <= now) {
      throw new Error("Deadline must be a valid future date.");
    }

    return BigInt(timestamp);
  };

  /* ============================================================
     FORM HANDLERS
  ============================================================ */

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setVideoUrl("");
    setImageUrl("");
    setGoal("");
    setDeadline("");
    setErrorMessage("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // Validate title
    if (!title.trim()) {
      setErrorMessage("Title is required.");
      return;
    }

    // Validate goal
    try {
      validateGoal();
    } catch (err: any) {
      setErrorMessage(err.message);
      return;
    }

    // Validate deadline
    try {
      validateDeadline();
    } catch (err: any) {
      setErrorMessage(err.message);
      return;
    }

    // Check wallet connection
    if (!isReady || !actions) {
      setWalletMissing(true);
      setShowConfirmModal(true);
      return;
    }

    setWalletMissing(false);
    setShowConfirmModal(true);
  };

  /* ============================================================
     BLOCKCHAIN EXECUTION
  ============================================================ */

  const executeCreateCampaign = async () => {
    if (isExecutingRef.current) return;

    // If wallet is missing, connect first
    if (walletMissing) {
      setShowConfirmModal(false);
      setIsProcessing(true);

      try {
        await connectWallet();
        setWalletMissing(false);
        setShowConfirmModal(true);
      } catch {
        setErrorMessage("Failed to connect wallet. Please try again.");
      } finally {
        setIsProcessing(false);
      }

      return;
    }

    // Validate again before execution
    let goalWei: bigint;
    let deadlineTimestamp: bigint;

    try {
      goalWei = validateGoal();
      deadlineTimestamp = validateDeadline();
    } catch (err: any) {
      setErrorMessage(err.message);
      setShowConfirmModal(false);
      return;
    }

    isExecutingRef.current = true;
    setIsProcessing(true);
    setShowConfirmModal(false);

    try {
      const receipt = await actions!.createCampaign(
        title.trim(),
        description.trim(),
        videoUrl.trim(),
        imageUrl.trim(),
        goalWei,
        deadlineTimestamp
      );

      console.log("Campaign created successfully:", receipt);

      resetForm();
      router.push("/campaigns");
    } catch (err: any) {
      console.error("Campaign creation failed:", err);
      setErrorMessage(
        err.message || "Failed to create campaign. Please try again."
      );
      setShowConfirmModal(false);
    } finally {
      setIsProcessing(false);
      isExecutingRef.current = false;
    }
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <main className="min-h-screen bg-[#faf8f6] text-[#3b3b3b]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">
            Create <span className="text-[#3f8f7b]">Campaign</span>
          </h1>
          <Link
            href="/"
            className="text-[#6b6b6b] hover:text-[#3b3b3b] font-medium transition-colors"
          >
            ← Back
          </Link>
        </div>

        <p className="text-lg leading-relaxed mb-8 text-[#6b6b6b]">
          Create a blockchain-powered fundraising campaign. Set your goal and
          deadline—your campaign succeeds when either the funding goal or time
          limit is reached.
        </p>

        {/* Form Card */}
        <div className="bg-white border border-[#e0e0e0] rounded-lg p-8 shadow-sm">
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
            </div>
          )}

          {/* Connected Wallet Info */}
          {account && (
            <div className="mb-6 p-3 bg-[#f0f7f5] border border-[#3f8f7b]/20 rounded-lg">
              <p className="text-xs text-[#6b6b6b]">
                <strong>Connected:</strong> {account.slice(0, 6)}...
                {account.slice(-4)}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <FormInput
              label="Campaign Title"
              value={title}
              onChange={setTitle}
              placeholder="e.g., Help Build a Community Center"
              required
              helpText="A clear, descriptive title for your campaign"
            />

            {/* Description */}
            <FormTextarea
              label="Description"
              value={description}
              onChange={setDescription}
              placeholder="Tell your story and explain what you're raising funds for..."
              rows={5}
              helpText="Explain your cause and how funds will be used"
            />

            {/* Image URL */}
            <FormInput
              label="Image URL"
              value={imageUrl}
              onChange={setImageUrl}
              placeholder="https://example.com/campaign-image.jpg"
              helpText="A cover image for your campaign (optional)"
            />

            {/* Video URL */}
            <FormInput
              label="Video URL"
              value={videoUrl}
              onChange={setVideoUrl}
              placeholder="https://youtube.com/watch?v=..."
              helpText="A video explaining your campaign (optional)"
            />

            {/* Goal */}
            <FormInput
              label="Funding Goal (ETH)"
              type="number"
              step="0.01"
              min="0.01"
              value={goal}
              onChange={setGoal}
              placeholder="e.g., 5"
              required
              helpText="The amount of ETH you aim to raise"
            />

            {/* Deadline */}
            <FormInput
              label="Campaign Deadline"
              type="datetime-local"
              value={deadline}
              onChange={setDeadline}
              required
              helpText="Campaign ends when goal is reached OR deadline passes"
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-[#3f8f7b] hover:bg-[#2d7561] disabled:bg-[#9b9b9b] text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : "Create Campaign"}
            </button>

            <p className="text-xs text-[#9b9b9b] text-center">
              By creating a campaign, you agree that funds will be stored on the
              blockchain and can be withdrawn once the goal or deadline is reached.
            </p>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <ConfirmModal
          title={walletMissing ? "Connect Wallet" : "Confirm Campaign Creation"}
          onCancel={() => {
            setShowConfirmModal(false);
            setWalletMissing(false);
          }}
          onConfirm={executeCreateCampaign}
          confirmText={walletMissing ? "Connect Wallet" : "Create Campaign"}
          disabled={isProcessing}
        >
          {walletMissing ? (
            <p className="text-sm text-[#6b6b6b]">
              You must connect your wallet before creating a campaign.
            </p>
          ) : (
            <div className="space-y-3 text-sm text-[#6b6b6b]">
              <div>
                <strong className="text-[#3b3b3b]">Title:</strong> {title}
              </div>
              <div>
                <strong className="text-[#3b3b3b]">Goal:</strong> {goal} ETH
              </div>
              <div>
                <strong className="text-[#3b3b3b]">Deadline:</strong>{" "}
                {new Date(deadline).toLocaleString()}
              </div>
              <div className="pt-2 border-t border-[#e0e0e0]">
                <p className="text-xs">
                  This will create a smart contract transaction. You'll need to
                  confirm it in your wallet.
                </p>
              </div>
            </div>
          )}
        </ConfirmModal>
      )}

      {/* Processing Overlay */}
      {isProcessing && <ProcessingOverlay />}
    </main>
  );
}

/* ============================================================
   FORM COMPONENTS
============================================================ */

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  step?: string;
  min?: string;
  required?: boolean;
  helpText?: string;
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  step,
  min,
  required = false,
  helpText,
}: FormInputProps) {
  return (
    <div>
      <label className="block font-semibold mb-2 text-[#3b3b3b]">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <input
        type={type}
        step={step}
        min={min}
        placeholder={placeholder}
        className="w-full p-3 rounded-lg bg-[#faf8f6] border border-[#d0d0d0] text-[#3b3b3b] focus:outline-none focus:ring-2 focus:ring-[#3f8f7b] focus:border-transparent transition-all"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />

      {helpText && <p className="text-xs text-[#9b9b9b] mt-1">{helpText}</p>}
    </div>
  );
}

interface FormTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  helpText?: string;
}

function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  required = false,
  helpText,
}: FormTextareaProps) {
  return (
    <div>
      <label className="block font-semibold mb-2 text-[#3b3b3b]">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <textarea
        placeholder={placeholder}
        rows={rows}
        className="w-full p-3 rounded-lg bg-[#faf8f6] border border-[#d0d0d0] text-[#3b3b3b] focus:outline-none focus:ring-2 focus:ring-[#3f8f7b] focus:border-transparent transition-all resize-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />

      {helpText && <p className="text-xs text-[#9b9b9b] mt-1">{helpText}</p>}
    </div>
  );
}

/* ============================================================
   MODAL COMPONENTS
============================================================ */

interface ConfirmModalProps {
  title: string;
  children: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText: string;
  disabled?: boolean;
}

function ConfirmModal({
  title,
  children,
  onCancel,
  onConfirm,
  confirmText,
  disabled = false,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <h3 className="text-xl font-bold mb-4 text-[#3b3b3b]">{title}</h3>

        <div className="mb-6">{children}</div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={disabled}
            className="flex-1 px-4 py-2 border border-[#d0d0d0] rounded-lg font-medium text-[#3b3b3b] hover:bg-[#faf8f6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
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

function ProcessingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center">
        <div className="w-16 h-16 border-4 border-[#3f8f7b] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-[#3b3b3b]">
          Processing Transaction
        </h3>
        <p className="text-sm text-[#6b6b6b]">
          Please confirm the transaction in your wallet and wait for blockchain
          confirmation...
        </p>
      </div>
    </div>
  );
}