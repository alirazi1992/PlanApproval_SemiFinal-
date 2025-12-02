// src/components/ui/Card.tsx
import React, { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  variant?: "default" | "glass";
}

export function Card({
  children,
  className,
  variant = "glass",
  ...rest
}: CardProps) {
  return (
    <div
      // اگر می‌خوای کل سایت RTL باشه، بهتره dir روی لِی‌اوت اصلی باشه، نه اینجا
      className={cn(
        "rounded-[12px]",
        variant === "default" &&
          "bg-white border border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.06)]",
        variant === "glass" &&
          "bg-white/80 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(15,23,42,0.12)]",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
