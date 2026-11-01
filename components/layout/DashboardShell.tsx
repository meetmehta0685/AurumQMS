"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ChevronsUpDown, LogOut } from "lucide-react";

import { BrandMark } from "@/components/layout/BrandMark";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  getRoleFromPathname,
  isNavItemActive,
  roleMeta,
  suiteMeta,
} from "@/components/layout/role-config";
import type { UserRole } from "@/types";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, logout } = useAuth();

  const routeRole = getRoleFromPathname(pathname);
  const role: UserRole = profile?.role ?? routeRole;
  const meta = roleMeta[role] ?? roleMeta.patient;
  const suite = suiteMeta[meta.suite];
  const currentItem = meta.nav.find((item) =>
    isNavItemActive(pathname, item.href),
  );
  const displayName = profile?.full_name || "Workspace user";
  const suiteClasses = suite.classes;

  return (
    <SidebarProvider defaultOpen>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader className="gap-4 px-2 pt-3 pb-2">
          <div className="flex items-center gap-2 px-1 group-data-[collapsible=icon]:px-0">
            <BrandMark href={meta.home} caption={suite.label} className="flex-1" />
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] font-medium text-sidebar-foreground/55">
              {meta.shortLabel} workspace
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {meta.nav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isNavItemActive(pathname, item.href)}
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg" tooltip="Account menu" className="hover:bg-card hover:shadow-xs data-[state=open]:bg-card data-[state=open]:shadow-xs dark:hover:bg-sidebar-accent">
                <Avatar className="size-8 rounded-full">
                  <AvatarFallback className={cn("rounded-full text-xs font-semibold", suiteClasses.solid)}>
                    {initials(displayName) || "Q"}
                  </AvatarFallback>
                </Avatar>
                <span className="flex min-w-0 flex-1 flex-col text-left leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-sm font-medium">{displayName}</span>
                  <span className="truncate text-xs text-sidebar-foreground/60">
                    {profile?.email || meta.shortLabel}
                  </span>
                </span>
                <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-60">
              <DropdownMenuLabel className="font-normal">
                <span className="block truncate font-medium">{displayName}</span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {meta.label}
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
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border/70 bg-background/80 px-3 backdrop-blur-lg sm:px-5 md:rounded-t-2xl">
          <SidebarTrigger aria-label="Toggle navigation" className="text-muted-foreground" />
          <div className="mx-1 hidden h-4 w-px bg-border sm:block" />
          <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
            <span className="hidden truncate text-muted-foreground sm:inline">{meta.shortLabel}</span>
            <ChevronRight className="hidden size-3.5 shrink-0 text-muted-foreground/60 sm:block" />
            <span className="truncate font-medium">{currentItem?.label || "Overview"}</span>
          </nav>
          <div className="flex items-center gap-1">
            <NotificationBell
              userId={profile?.id || profile?.user_id}
              userRole={profile?.role || role}
            />
            <ThemeToggle />
          </div>
        </header>
        <div id="main-content" key={pathname} className="t-page min-w-0 flex-1">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
