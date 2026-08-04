"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Activity, ChevronDown, LogOut } from "lucide-react";

import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  getRoleFromPathname,
  roleMeta,
  suiteMeta,
} from "@/components/layout/role-config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface RoleHeaderProps {
  currentRole: UserRole;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function RoleHeader({ currentRole }: RoleHeaderProps) {
  const router = useRouter();
  const { profile, logout } = useAuth();
  const meta = roleMeta[currentRole] ?? roleMeta[getRoleFromPathname("/")];
  const suite = suiteMeta[meta.suite];
  const displayName = profile?.full_name || "Workspace user";

  return (
    <motion.header
      className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md supports-backdrop-filter:bg-background/75"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href={meta.home} className="flex min-w-0 items-center gap-3">
          <motion.span
            className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"
            whileHover={{ rotate: -4, scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <Activity />
          </motion.span>
          <span className="hidden min-w-0 flex-col sm:flex">
            <span className="truncate text-sm font-semibold tracking-tight">
              AURUM QMS
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {suite.label}
            </span>
          </span>
        </Link>

        <div className="h-5 w-px bg-border" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 px-2.5">
              <Badge
                variant="outline"
                className={cn(
                  "gap-1.5",
                  suite.classes.border,
                  suite.classes.soft,
                )}
              >
                <meta.icon />
                {meta.shortLabel}
              </Badge>
              <ChevronDown className="text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {Object.entries(roleMeta).map(([key, item]) => {
                const ItemIcon = item.icon;
                const itemSuite = suiteMeta[item.suite];
                return (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => router.push(item.home)}
                    className={cn(
                      "justify-between",
                      key === currentRole && "bg-accent text-accent-foreground",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <ItemIcon />
                      {item.label}
                    </span>
                    <span className={cn("size-1.5 rounded-full", itemSuite.classes.solid)} />
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-1">
          <NotificationBell
            userId={profile?.id || profile?.user_id}
            userRole={profile?.role || currentRole}
          />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open account menu"
              >
                <Avatar className="size-8 rounded-md">
                  <AvatarFallback className="rounded-md bg-muted text-muted-foreground">
                    {initials(displayName) || "Q"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>
                <span className="block truncate">{displayName}</span>
                <span className="mt-1 block truncate text-xs font-normal text-muted-foreground">
                  {profile?.email || meta.label}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
}
