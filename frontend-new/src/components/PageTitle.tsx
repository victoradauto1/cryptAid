"use client";

import { ReactNode } from "react";

interface PageTitleProps {
  children: ReactNode;
  glow?: boolean;
  shine?: boolean;
  className?: string;
}

export default function PageTitle({
  children,
  glow = false,
  shine = false,
  className = "",
}: PageTitleProps) {
  const effectClass =
    glow ? "glow-title" :
    shine ? "shine-title" :
    "";

  return (
    <h1
      className={`
        font-extrabold
        tracking-tight
        mb-10
        ${effectClass}
        ${className}
      `}
    >
      {children}
    </h1>
  );
}
