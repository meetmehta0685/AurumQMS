"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { cn } from "@/lib/utils";

export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export function MotionPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("t-page", className)}>{children}</div>;
}
