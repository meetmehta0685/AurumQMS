"use client";

import type { ReactNode } from "react";
import { MotionConfig, motion } from "motion/react";
import { cn } from "@/lib/utils";

const easeOut = [0.16, 1, 0.3, 1] as const;

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
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: 10, filter: "blur(3px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.36, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}
