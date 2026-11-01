import Link from "next/link";
import { Activity } from "lucide-react";

import { cn } from "@/lib/utils";

export function BrandMark({
  href = "/",
  caption,
  compact = false,
  className,
}: {
  href?: string;
  caption?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("group/brand flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35", className)}
    >
      <span className="gloss flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-primary text-primary-foreground transition-transform duration-(--duration-fast) ease-(--ease-bounce) group-hover/brand:-rotate-6">
        <Activity className="size-4" strokeWidth={2.5} />
      </span>
      <span className={cn("flex min-w-0 flex-col leading-none", compact && "max-sm:sr-only")}>
        <span className="truncate text-[15px] font-semibold tracking-[-0.02em]">
          AURUM<span className="text-muted-foreground"> QMS</span>
        </span>
        {caption && (
          <span className="mt-1 truncate text-xs text-muted-foreground">{caption}</span>
        )}
      </span>
    </Link>
  );
}
