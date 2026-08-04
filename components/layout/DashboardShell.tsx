"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Activity,
  ChevronDown,
  LogOut,
} from "lucide-react";

import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/theme-toggle";
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
  SidebarSeparator,
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
  const router = useRouter();
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
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader className="gap-3 p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg" tooltip="AURUM QMS">
                <Link href={meta.home}>
                  <motion.span
                    className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"
                    whileHover={{ rotate: -4, scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Activity />
                  </motion.span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate font-semibold tracking-tight">
                      AURUM QMS
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/65">
                      Care + Stay
                    </span>
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <div className="px-2 group-data-[collapsible=icon]:hidden">
            <Badge
              variant="outline"
              className={cn("gap-1.5", suiteClasses.border, suiteClasses.soft)}
            >
              <meta.icon />
              {suite.label}
            </Badge>
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{meta.shortLabel} workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {meta.nav.map((item) => {
                  const Icon = item.icon;
                  const active = isNavItemActive(pathname, item.href);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                        className="relative"
                      >
                        <Link href={item.href}>
                          {active && (
                            <motion.span
                              layoutId={`active-nav-${role}`}
                              className="absolute inset-y-2 left-0.5 w-0.5 rounded-full bg-sidebar-primary"
                              aria-hidden="true"
                            />
                          )}
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

          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel>Workspace context</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="rounded-md border border-sidebar-border bg-sidebar-accent/45 p-3 text-xs text-sidebar-foreground/75 group-data-[collapsible=icon]:hidden">
                <p className="font-medium text-sidebar-foreground">{meta.label}</p>
                <p className="mt-1 leading-relaxed">{meta.description}</p>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-3">
          <SidebarSeparator className="mb-2" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg" tooltip="Account menu">
                <Avatar className="size-8 rounded-md">
                  <AvatarFallback className="rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                    {initials(displayName) || "Q"}
                  </AvatarFallback>
                </Avatar>
                <span className="flex min-w-0 flex-1 flex-col text-left group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-sm font-medium">{displayName}</span>
                  <span className="truncate text-xs text-sidebar-foreground/65">
                    {meta.shortLabel}
                  </span>
                </span>
                <ChevronDown className="ml-auto group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-64">
              <DropdownMenuLabel>
                <span className="block truncate">{displayName}</span>
                <span className="mt-1 block truncate text-xs font-normal text-muted-foreground">
                  {profile?.email || "Signed-in workspace"}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push(meta.home)}>
                  <Activity />
                  Open workspace
                </DropdownMenuItem>
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
        <header className="sticky top-0 z-40 flex min-h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-md supports-backdrop-filter:bg-background/75 sm:px-6">
          <SidebarTrigger aria-label="Toggle navigation" />
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="hidden h-5 w-px bg-border sm:block" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {currentItem?.label || meta.shortLabel}
              </p>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                {suite.label} · {meta.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="hidden items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-xs text-muted-foreground lg:flex">
              <motion.span
                className={cn("size-1.5 rounded-full", suiteClasses.solid)}
                animate={{ opacity: [0.55, 1, 0.55] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              />
              Workspace live
            </span>
            <NotificationBell
              userId={profile?.id || profile?.user_id}
              userRole={profile?.role || role}
            />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Switch workspace">
                  <meta.icon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
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
                          key === role && "bg-accent text-accent-foreground",
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <ItemIcon />
                          {item.label}
                        </span>
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            itemSuite.classes.solid,
                          )}
                        />
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <motion.div
          id="main-content"
          key={pathname}
          className="min-w-0 flex-1"
          initial={{ opacity: 0, y: 10, filter: "blur(3px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </SidebarInset>
    </SidebarProvider>
  );
}
