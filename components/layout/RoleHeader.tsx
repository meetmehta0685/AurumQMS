"use client";

import { LogOut } from "lucide-react";

import { BrandMark } from "@/components/layout/BrandMark";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  getRoleFromPathname,
  roleMeta,
  suiteMeta,
} from "@/components/layout/role-config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  const { profile, logout } = useAuth();
  const meta = roleMeta[currentRole] ?? roleMeta[getRoleFromPathname("/")];
  const suite = suiteMeta[meta.suite];
  const displayName = profile?.full_name || "Workspace user";

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <BrandMark href={meta.home} compact />
        <span className={cn("hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex", suite.classes.soft)}>
          <meta.icon className="size-3.5" />
          {suite.label}
        </span>

        <div className="ml-auto flex items-center gap-1">
          <NotificationBell
            userId={profile?.id || profile?.user_id}
            userRole={profile?.role || currentRole}
          />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="Open account menu">
                <Avatar className="size-8">
                  <AvatarFallback className={cn("text-xs font-semibold", suite.classes.solid)}>
                    {initials(displayName) || "Q"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="font-normal">
                <span className="block truncate font-medium">{displayName}</span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
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
    </header>
  );
}
