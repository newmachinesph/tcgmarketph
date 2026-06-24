import { InputHTMLAttributes } from "react";

export type InputVariant = "default" | "pill" | "sm";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
}

const variantClass: Record<InputVariant, string> = {
  default:
    "w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20",
  pill: "w-full rounded-xl border border-white/10 bg-surface py-2 pr-4 pl-10 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/20",
  sm: "w-full rounded-md border border-white/10 bg-surface2 px-3 py-1.5 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none",
};

export default function Input({
  variant = "default",
  className,
  ...props
}: InputProps) {
  return (
    <input
      className={[variantClass[variant], className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
