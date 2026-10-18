import { ReactNode } from "react";

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label htmlFor={htmlFor} className="text-xs font-medium text-[#9A9A9A]">
          {label}
        </label>
        {hint}
      </div>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-ask">
          {error}
        </p>
      )}
    </div>
  );
}
