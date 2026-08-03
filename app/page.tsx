"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  ArrowRight,
  Bed,
  CheckCircle2,
  ChevronRight,
  ConciergeBell,
  FlaskConical,
  Heart,
  Pill,
  Shield,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const rolesData = [
  {
    id: "patient",
    title: "Patient Portal",
    badge: "Healthcare",
    icon: Heart,
    color: "from-teal-500/20 to-cyan-500/20 border-teal-500/30 text-teal-600 dark:text-teal-400",
    href: "/patient",
    description: "Realtime token queue tracking, appointment booking, digital prescriptions, lab results, and discharge summaries.",
    features: ["Live Queue Token Status", "Doctor Appointments", "Digital Lab Reports", "Medication History"],
  },
  {
    id: "doctor",
    title: "Doctor Workstation",
    badge: "Clinical",
    icon: Stethoscope,
    color: "from-indigo-500/20 to-blue-500/20 border-indigo-500/30 text-indigo-600 dark:text-indigo-400",
    href: "/doctor",
    description: "Streamlined OPD consultation workflow, active queue caller, 1-click lab orders, e-prescribing, and schedule control.",
    features: ["OPD Queue Manager", "Consultation Notes", "Direct E-Prescribe", "Lab Test Orders"],
  },
  {
    id: "admin",
    title: "Admin Command Center",
    badge: "Management",
    icon: Shield,
    color: "from-purple-500/20 to-indigo-500/20 border-purple-500/30 text-purple-600 dark:text-purple-400",
    href: "/admin",
    description: "Executive visibility into hospital throughput, department allocations, doctor rosters, discharge approvals, and operational reports.",
    features: ["Hospital Analytics", "Department Rosters", "Staff Management", "System Audit Logs"],
  },
  {
    id: "lab",
    title: "Laboratory Hub",
    badge: "Diagnostics",
    icon: FlaskConical,
    color: "from-cyan-500/20 to-teal-500/20 border-cyan-500/30 text-cyan-600 dark:text-cyan-400",
    href: "/lab",
    description: "Order processing worklist, specimen tracking, priority test flags, and PDF diagnostic report publishing.",
    features: ["Pending Test Queue", "Specimen Tagging", "PDF Result Upload", "Doctor Verification"],
  },
  {
    id: "pharma",
    title: "Pharmacy Portal",
    badge: "Dispensary",
    icon: Pill,
    color: "from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400",
    href: "/pharma",
    description: "Real-time prescription fulfillment station, stock inventory tracking, medication dosage check-offs, and dispense logs.",
    features: ["Rx Order Queue", "Medication Dispensing", "Low Stock Alerts", "Fulfillment Stats"],
  },
  {
    id: "guest",
    title: "Guest Portal",
    badge: "Hospitality",
    icon: ConciergeBell,
    color: "from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-600 dark:text-rose-400",
    href: "/guest",
    description: "Luxury guest interface for reservation tracking, amenity booking, room service requests, and digital concierge.",
    features: ["Reservation Lookup", "Service Requests", "Room Readiness", "Guest Preferences"],
  },
  {
    id: "staff",
    title: "Property Staff",
    badge: "Hospitality",
    icon: Bed,
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
    href: "/staff",
    description: "Operational housekeeping grid, guest arrival coordination, room maintenance status, and task dispatch board.",
    features: ["Housekeeping Board", "Guest Arrivals", "Room Allocations", "Task Dispatch"],
  },
];

const stats = [
  { label: "Role Workspaces", value: "7 Portals" },
  { label: "Core Workflows", value: "100% Realtime" },
  { label: "System Uptime", value: "99.99%" },
  { label: "Response Speed", value: "< 50ms" },
];

export default function Home() {
  const [selectedRole, setSelectedRole] = useState("patient");
  const activeRoleData = rolesData.find((r) => r.id === selectedRole) || rolesData[0];
  const RoleIcon = activeRoleData.icon;

  return (
    <div className="min-h-screen text-foreground bg-gradient-to-b from-background via-background/95 to-muted/20">
      {/* Navigation Topbar */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20">
              <Activity className="size-5" />
            </div>
            <div>
              <p className="font-display text-xl font-bold tracking-tight">Aurum System</p>
              <p className="text-xs text-muted-foreground font-medium">Healthcare QMS & Hospitality Suite</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="shadow-md shadow-primary/20">
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-10 sm:px-6 lg:py-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-border/50 glass-card p-6 sm:p-10 lg:p-12">
          <div className="absolute -top-24 -right-24 size-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="space-y-6 lg:col-span-7">
              <Badge variant="outline" className="gap-2 px-3 py-1 text-xs font-semibold text-primary border-primary/30 bg-primary/5">
                <Sparkles className="size-3.5 text-primary" />
                Unified Enterprise Platform
              </Badge>

              <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Next-Gen <span className="gradient-text-primary">Quality Management</span> & Hospitality
              </h1>

              <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                Seamlessly orchestrating clinical OPD queues, patient care workflows, lab diagnostics, pharmacy fulfillment, and luxury guest services in one ultra-sleek, role-tailored platform.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild size="lg" className="shadow-lg shadow-primary/25 gap-2">
                  <Link href="/login">
                    Access System <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-border/60">
                  <Link href="/register">Register Role Account</Link>
                </Button>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-4 border-t border-border/40">
                {stats.map((s) => (
                  <div key={s.label} className="space-y-0.5">
                    <p className="font-display text-xl font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Role Preview Card */}
            <div className="lg:col-span-5">
              <Card className="glass-panel border-primary/20 shadow-xl overflow-hidden">
                <CardHeader className="bg-muted/40 pb-4 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Live Role Selector
                    </span>
                    <Badge variant="secondary" className="text-[10px]">Interactive</Badge>
                  </div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2 pt-1">
                    <RoleIcon className="size-5 text-primary" />
                    {activeRoleData.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    {activeRoleData.description}
                  </p>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Key Capabilities</p>
                    <div className="grid grid-cols-2 gap-2">
                      {activeRoleData.features.map((feat) => (
                        <div key={feat} className="flex items-center gap-2 text-xs text-muted-foreground rounded-lg border border-border/40 bg-background/50 p-2">
                          <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button asChild className="w-full gap-2 mt-2">
                    <Link href={activeRoleData.href}>
                      Launch {activeRoleData.title}
                      <ChevronRight className="size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Roles Explorer Section */}
        <section className="space-y-6">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <Badge variant="outline" className="text-xs">Role Workspaces</Badge>
            <h2 className="font-display text-3xl font-bold">Tailored Experience for Every User Role</h2>
            <p className="text-sm text-muted-foreground">
              Select any role below to explore its specialized workspace interface and capabilities.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rolesData.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              return (
                <div
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`group relative cursor-pointer rounded-2xl border p-5 transition-all duration-300 ${
                    isSelected
                      ? `border-primary bg-accent/30 shadow-lg glow-teal scale-[1.02]`
                      : "border-border/60 glass-card hover:border-primary/50 hover:bg-accent/10"
                  }`}
                >
                  <div className="flex items-center justify-between pb-3">
                    <div className={`flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${role.color}`}>
                      <Icon className="size-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {role.badge}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                    {role.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {role.description}
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
                    <span>Explore Portal</span>
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/50 py-8 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            <span className="font-semibold text-foreground">AurumQMS & AurumStay</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
