"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  Clock,
  ConciergeBell,
  Heart,
  LogOut,
  User,
  Stethoscope,
  FlaskConical,
  Pill,
  Shield,
  Bed,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/hooks/useAuth";

interface RoleHeaderProps {
  currentRole:
    | "patient"
    | "doctor"
    | "admin"
    | "lab"
    | "pharma"
    | "guest"
    | "staff";
}

const roleConfigs = {
  patient: {
    label: "Patient Portal",
    badge: "Patient",
    color: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
    icon: Heart,
    href: "/patient",
  },
  doctor: {
    label: "Doctor Workstation",
    badge: "Physician",
    color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    icon: Stethoscope,
    href: "/doctor",
  },
  admin: {
    label: "Admin Command Center",
    badge: "System Admin",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    icon: Shield,
    href: "/admin",
  },
  lab: {
    label: "Laboratory Portal",
    badge: "Lab Technician",
    color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
    icon: FlaskConical,
    href: "/lab",
  },
  pharma: {
    label: "Pharmacy Portal",
    badge: "Pharmacist",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    icon: Pill,
    href: "/pharma",
  },
  guest: {
    label: "Guest Suite",
    badge: "Guest",
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
    icon: ConciergeBell,
    href: "/guest",
  },
  staff: {
    label: "Property Staff",
    badge: "Hospitality Staff",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    icon: Bed,
    href: "/staff",
  },
};

export function RoleHeader({ currentRole }: RoleHeaderProps) {
  const router = useRouter();
  const { profile, logout } = useAuth();
  const [timeString, setTimeString] = useState<string>("");
  const [dateString, setDateString] = useState<string>("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
      setDateString(
        now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const config = roleConfigs[currentRole] || roleConfigs.patient;
  const RoleIcon = config.icon;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Left: Brand Identity & Role Tag */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/20 transition-transform group-hover:scale-105">
              <Activity className="size-5" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-lg font-bold tracking-tight">
                  Aurum
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  QMS & Stay
                </span>
              </div>
            </div>
          </Link>

          <div className="h-6 w-px bg-border/60" />

          {/* Role Pill */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 rounded-full border border-border/50 px-3 text-xs font-medium transition-colors hover:bg-accent"
              >
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 border text-xs font-semibold ${config.color}`}>
                  <RoleIcon className="size-3.5" />
                  {config.badge}
                </span>
                <ChevronDown className="size-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 glass-card">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Switch Role Workspace (Demo)
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(roleConfigs).map(([key, item]) => {
                const ItemIcon = item.icon;
                const isActive = key === currentRole;
                return (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => router.push(item.href)}
                    className={`flex items-center justify-between cursor-pointer ${
                      isActive ? "bg-accent font-semibold" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ItemIcon className="size-4 text-primary" />
                      <span>{item.label}</span>
                    </div>
                    {isActive && (
                      <CheckCircle2 className="size-3.5 text-primary" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Center/Right: Clock, Notifications, Theme, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Clock Widget */}
          <div className="hidden md:flex items-center gap-2 rounded-full border border-border/40 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
            <Clock className="size-3.5 text-primary" />
            <span className="font-mono font-medium text-foreground">{timeString}</span>
            <span className="text-[10px] text-muted-foreground">{dateString}</span>
          </div>

          {/* Notifications */}
          <NotificationBell
            userId={profile?.id || profile?.user_id}
            userRole={profile?.role || currentRole}
          />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative size-9 rounded-full border border-border/60 bg-muted/40 p-0 hover:bg-accent"
              >
                <User className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-card">
              <DropdownMenuLabel>
                <p className="text-sm font-semibold">
                  {profile?.full_name || "User Account"}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  Role: {profile?.role || currentRole}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
