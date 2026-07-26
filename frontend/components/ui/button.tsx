import type { ButtonHTMLAttributes, ReactNode } from "react";
import { buttonTokens } from "@/lib/design-tokens";

type ButtonVariant = "primary" | "ink" | "quiet" | "link";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cx(buttonTokens.base, buttonTokens[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}
export function IconButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cx("button-lift icon-button rounded-full border border-[rgb(var(--border))] text-ink-600 hover:border-brass hover:text-ink-900 disabled:opacity-40", className)}
      {...props}
    >
      {children}
    </button>
  );
}
