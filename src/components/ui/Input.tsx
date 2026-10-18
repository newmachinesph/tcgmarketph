import { InputHTMLAttributes, Ref } from "react";

export type InputVariant = "default" | "pill" | "sm";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
  ref?: Ref<HTMLInputElement>;
}

const variantClass: Record<InputVariant, string> = {
  default:
    "w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20 aria-[invalid=true]:border-ask/50 aria-[invalid=true]:ring-ask/20",
  pill: "w-full rounded-xl border border-white/10 bg-surface py-2 pr-4 pl-10 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/20",
  sm: "w-full rounded-md border border-white/10 bg-surface2 px-3 py-1.5 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none",
};

export default function Input({
  variant = "default",
  className,
  ref,
  ...props
}: InputProps) {
  return (
    <input
      ref={ref}
      className={[variantClass[variant], className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
