import { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "outline" | "ghost" | "icon";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pill?: boolean;
  className?: string;
  children?: ReactNode;
}

type AsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & { href?: never };
type AsAnchor = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & { href: string };
type ButtonProps = AsButton | AsAnchor;

function buildClass(
  variant: ButtonVariant,
  size: ButtonSize,
  _pill: boolean,
  extra?: string
) {
  const base =
    "inline-flex items-center justify-center font-semibold transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-40";

  const variants: Record<ButtonVariant, string> = {
    primary: "bg-accent text-white hover:bg-[#c93d3c]",
    outline: "border border-white/20 text-[#F2F2F2] hover:bg-surface",
    ghost: "text-[#9A9A9A] hover:text-[#F2F2F2] hover:bg-surface",
    icon: "border border-white/10 text-[#9A9A9A] hover:border-white/30 hover:text-[#F2F2F2]",
  };

  const isIcon = variant === "icon";
  const sizes: Record<ButtonSize, string> = {
    xs: isIcon ? "h-7 w-7" : "px-3 py-1 text-xs gap-1.5",
    sm: isIcon ? "h-8 w-8" : "px-4 py-1.5 text-sm gap-1.5",
    md: isIcon ? "h-9 w-9" : "px-4 py-2 text-sm gap-2",
    lg: isIcon ? "h-10 w-10" : "px-5 py-2.5 text-base gap-2",
  };

  return [base, variants[variant], sizes[size], "rounded-lg", extra]
    .filter(Boolean)
    .join(" ");
}

export default function Button({
  variant = "primary",
  size = "md",
  pill = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const cls = buildClass(variant, size, pill, className);
  if ("href" in rest && rest.href !== undefined) {
    const { href, ...anchorRest } = rest as AsAnchor;
    return (
      <a href={href} className={cls} {...anchorRest}>
        {children}
      </a>
    );
  }
  return (
    <button className={cls} {...(rest as AsButton)}>
      {children}
    </button>
  );
}
