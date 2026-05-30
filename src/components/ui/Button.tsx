"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/25",
    secondary: "bg-amber-500 hover:bg-amber-400 text-slate-900",
    outline: "border border-slate-500 hover:bg-slate-700/50 text-slate-100",
    danger: "bg-red-600 hover:bg-red-500 text-white",
    ghost: "hover:bg-slate-700/50 text-slate-200",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm font-medium",
    lg: "px-6 py-3 text-base font-semibold",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
