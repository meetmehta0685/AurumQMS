"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  ArrowRight,
  BedDouble,
  Check,
  ChevronRight,
  HeartPulse,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { roleMeta, suiteMeta } from "@/components/layout/role-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const roleDetails: Record<
  UserRole,
  { title: string; description: string; features: string[] }
> = {
  patient: {
    title: "Stay ahead of your care",
    description:
      "Appointments, live queue context, records, lab reports, prescriptions, and discharge notes in one focused workspace.",
    features: ["Appointment timeline", "Live queue context", "Health record access", "Care follow-through"],
  },
  doctor: {
    title: "Move from queue to care",
    description:
      "Keep the clinical day visible: call the next patient, document the visit, order diagnostics, and close the loop.",
    features: ["Queue control", "Consultation notes", "Diagnostic orders", "Prescription handoff"],
  },
  admin: {
    title: "See the whole operation",
    description:
      "A clear command view for appointments, departments, providers, diagnostics, pharmacy, and operational reporting.",
    features: ["System overview", "Provider directory", "Department flow", "Operational reports"],
  },
  lab: {
    title: "Make diagnostics legible",
    description:
      "Process lab orders, record verified results, and publish the right report back into the care record.",
    features: ["Order worklist", "Report publishing", "Doctor handoff", "Traceable status"],
  },
  pharma: {
    title: "Keep medication moving",
    description:
      "Fulfill prescriptions with a focused dispense record for patient, dosage, quantity, and completion state.",
    features: ["Prescription queue", "Dispense records", "Dosage context", "Fulfillment history"],
  },
  guest: {
    title: "Make the stay feel easy",
    description:
      "Look up a reservation, share preferences, and send a service request without losing context.",
    features: ["Reservation lookup", "Stay preferences", "Service requests", "Request status"],
  },
  staff: {
    title: "Keep every room in rhythm",
    description:
      "Coordinate arrivals, room readiness, assignments, and service work from a single operational view.",
    features: ["Room readiness", "Arrival coordination", "Room assignment", "Status handoff"],
  },
};

const roleOrder: UserRole[] = [
  "patient",
  "doctor",
  "admin",
  "lab",
  "pharma",
  "guest",
  "staff",
];

const suitePrinciples = [
  {
    suite: "care" as const,
    icon: HeartPulse,
    title: "Care Operations",
    description:
      "Clinical teams and patients share a dependable line from appointment to outcome.",
    points: ["Appointments + queues", "Records + diagnostics", "Pharmacy + discharge"],
  },
  {
    suite: "stay" as const,
    icon: BedDouble,
    title: "Stay Operations",
    description:
      "Guests and property teams stay aligned on rooms, arrivals, and requests.",
    points: ["Reservations + preferences", "Room readiness", "Service requests"],
  },
];

export default function Home() {
  const [selectedRole, setSelectedRole] = useState<UserRole>("patient");
  const selectedMeta = roleMeta[selectedRole];
  const selectedDetails = roleDetails[selectedRole];
  const suite = suiteMeta[selectedMeta.suite];
  const RoleIcon = selectedMeta.icon;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <motion.header
        className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md supports-backdrop-filter:bg-background/75"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
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
                Care + Stay
              </span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto flex max-w-7xl flex-col gap-20 px-4 py-10 sm:px-6 lg:py-16">
        <motion.section
          className="grid items-start gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)] xl:gap-16"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.44, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-col gap-7 pt-2">
            <Badge variant="outline" className="w-fit gap-2 border-care/30 bg-care/10 text-care">
              <Activity />
              AURUM QMS
            </Badge>
            <div className="flex flex-col gap-5">
              <h1 className="max-w-3xl font-display text-5xl leading-[0.98] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
                One operational rail for care and stay.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Keep the next action visible across appointments, queues,
                diagnostics, pharmacy, rooms, and guest service. AURUM QMS
                gives every role the context it needs to move work
                forward.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/login">
                  Open workspace
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/register">Create a role account</Link>
              </Button>
            </div>
            <div className="grid max-w-xl grid-cols-2 gap-x-8 gap-y-5 border-t pt-6 sm:grid-cols-4">
              <div className="flex flex-col gap-1">
                <span className="font-display text-2xl">7</span>
                <span className="text-xs text-muted-foreground">role workspaces</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-display text-2xl">2</span>
                <span className="text-xs text-muted-foreground">operating suites</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-display text-2xl">1</span>
                <span className="text-xs text-muted-foreground">shared status language</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-display text-2xl">24/7</span>
                <span className="text-xs text-muted-foreground">web access</span>
              </div>
            </div>
          </div>

          <Card className="gap-0 overflow-hidden border-border py-0 shadow-sm">
            <CardHeader className="gap-4 border-b bg-surface p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-lg">Choose a workspace</CardTitle>
                  <CardDescription>
                    Every role gets the same clear operational grammar.
                  </CardDescription>
                </div>
                <Badge variant="secondary">Interactive</Badge>
              </div>
              <ToggleGroup
                type="single"
                value={selectedRole}
                onValueChange={(value) => {
                  if (value) setSelectedRole(value as UserRole);
                }}
                variant="outline"
                spacing={1}
                className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4"
                aria-label="Choose a role workspace"
              >
                {roleOrder.map((role) => {
                  const item = roleMeta[role];
                  const Icon = item.icon;
                  return (
                    <ToggleGroupItem
                      key={role}
                      value={role}
                      aria-label={item.label}
                      className="h-auto justify-start gap-2 px-3 py-2.5 text-left"
                    >
                      <Icon />
                      <span className="truncate">{item.shortLabel}</span>
                    </ToggleGroupItem>
                  );
                })}
              </ToggleGroup>
            </CardHeader>
            <CardContent className="p-6">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={selectedRole}
                  className="flex flex-col gap-6"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex items-start gap-3">
                    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-md", suite.classes.soft)}>
                      <RoleIcon />
                    </span>
                    <div className="flex min-w-0 flex-col gap-1">
                      <Badge variant="outline" className={cn("w-fit", suite.classes.border, suite.classes.soft)}>
                        {suite.label}
                      </Badge>
                      <h2 className="text-xl font-semibold tracking-tight">{selectedDetails.title}</h2>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {selectedDetails.description}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {selectedDetails.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="text-care" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full">
                    <Link href={selectedMeta.home}>
                      Explore {selectedMeta.shortLabel} workspace
                      <ChevronRight data-icon="inline-end" />
                    </Link>
                  </Button>
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.section>

        <section className="flex flex-col gap-8">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-sm font-medium text-care">Built around the work</p>
            <h2 className="font-display text-4xl tracking-[-0.02em] sm:text-5xl">
              Clear roles. Shared rhythm.
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Clinical and hospitality teams do different work, but both need
              the same thing: a trustworthy view of what is ready, what is
              waiting, and what happens next.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {suitePrinciples.map((item) => {
              const Icon = item.icon;
              const itemSuite = suiteMeta[item.suite];
              return (
                <Card key={item.suite} className="border-border shadow-sm">
                  <CardHeader>
                    <span className={cn("flex size-10 items-center justify-center rounded-md", itemSuite.classes.soft)}>
                      <Icon />
                    </span>
                    <CardTitle className="pt-2">{item.title}</CardTitle>
                    <CardDescription className="max-w-lg leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid gap-3 text-sm text-muted-foreground">
                      {item.points.map((point) => (
                        <li key={point} className="flex items-center gap-2">
                          <span className={cn("size-1.5 rounded-full", itemSuite.classes.solid)} />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-7 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <Activity className="text-care" />
            <span className="font-medium text-foreground">AURUM QMS</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
