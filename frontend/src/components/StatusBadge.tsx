import React from "react";

/* ============================================================
   TYPES
============================================================ */

type StatusType = "ACTIVE" | "ENDED" | "SUCCESSFUL";

interface StatusBadgeProps {
  status: StatusType;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/* ============================================================
   COMPONENT
============================================================ */

/**
 * StatusBadge
 *
 * Displays campaign status with appropriate styling.
 * Used in campaign cards, details pages, etc.
 */
export default function StatusBadge({
  status,
  size = "md",
  className = "",
}: StatusBadgeProps) {
  const baseClasses = "inline-block rounded-full font-semibold";

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-xs",
    lg: "px-4 py-1.5 text-sm",
  };

  const statusClasses = {
    SUCCESSFUL: "bg-green-100 text-green-700",
    ACTIVE: "bg-blue-100 text-blue-700",
    ENDED: "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`${baseClasses} ${sizeClasses[size]} ${statusClasses[status]} ${className}`}
    >
      {status}
    </span>
  );
}