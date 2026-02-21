import React from "react";

/* ============================================================
   FORM INPUT
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

export function FormInput({
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

/* ============================================================
   FORM TEXTAREA
============================================================ */

interface FormTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  helpText?: string;
}

export function FormTextarea({
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