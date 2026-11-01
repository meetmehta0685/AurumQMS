"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, BedDouble, Check, HeartPulse } from "lucide-react";

import { BrandMark } from "@/components/layout/BrandMark";
import { ThemeToggle } from "@/components/theme-toggle";
import { roleMeta, suiteMeta } from "@/components/layout/role-config";
import { Button } from "@/components/ui/button";
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
      <header className="sticky top-0 z-40 border-b border-transparent bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <BrandMark compact />
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-24 px-4 pt-14 pb-24 sm:px-6 lg:gap-32 lg:pt-24">
        <section className="flex flex-col items-center text-center">
          <h1
            className="t-rise max-w-4xl text-5xl leading-[1.02] font-semibold tracking-[-0.035em] sm:text-6xl lg:text-7xl"
            style={{ "--t-i": 0 } as React.CSSProperties}
          >
            One operational rail for{" "}
            <span className="text-care">care</span> and{" "}
            <span className="text-stay">stay</span>.
          </h1>
          <p
            className="t-rise mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
            style={{ "--t-i": 1 } as React.CSSProperties}
          >
            Appointments, queues, diagnostics, pharmacy, rooms, and guest
            service in one role-aware workspace. Every role sees its next
            action, and every status reads the same way.
          </p>
          <div
            className="t-rise mt-9 flex flex-wrap justify-center gap-3"
            style={{ "--t-i": 2 } as React.CSSProperties}
          >
            <Button asChild size="lg">
              <Link href="/login">
                Open workspace
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/register">Create an account</Link>
            </Button>
          </div>
        </section>

        <section
          className="t-rise -mt-8 flex flex-col gap-5 lg:-mt-14"
          style={{ "--t-i": 3 } as React.CSSProperties}
          aria-labelledby="workspace-picker"
        >
          <h2 id="workspace-picker" className="sr-only">
            Choose a workspace
          </h2>
          <div
            role="radiogroup"
            aria-label="Choose a role workspace"
            className="mx-auto flex w-full max-w-max gap-1 overflow-x-auto rounded-full bg-secondary p-1 [scrollbar-width:none]"
          >
            {roleOrder.map((role) => {
              const item = roleMeta[role];
              const Icon = item.icon;
              const active = role === selectedRole;
              return (
                <button
                  key={role}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelectedRole(role)}
                  className={cn(
                    "relative flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium outline-none transition-colors duration-(--duration-quick) focus-visible:ring-[3px] focus-visible:ring-ring/35",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="role-pill"
                      className="absolute inset-0 rounded-full bg-card shadow-xs"
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                  <Icon className={cn("relative size-4", active && suiteMeta[item.suite].classes.text)} />
                  <span className="relative">{item.shortLabel}</span>
                </button>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-md">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={selectedRole}
                className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:p-14"
                initial={{ opacity: 0, filter: "blur(2px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(2px)" }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
              >
                <div className="flex flex-col justify-between gap-8">
                  <div className="flex flex-col gap-4">
                    <span className={cn("gloss flex size-11 items-center justify-center rounded-xl", suite.classes.solid)} style={{ "--gloss-tint": `var(--${selectedMeta.suite})` } as React.CSSProperties}>
                      <RoleIcon className="size-5" />
                    </span>
                    <h3 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                      {selectedDetails.title}
                    </h3>
                    <p className="max-w-md text-base leading-relaxed text-muted-foreground">
                      {selectedDetails.description}
                    </p>
                  </div>
                  <Button asChild variant="outline" className="w-fit">
                    <Link href={selectedMeta.home}>
                      Open the {selectedMeta.shortLabel.toLowerCase()} workspace
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>

                <ul className="flex flex-col gap-2 self-center">
                  {selectedDetails.features.map((feature, index) => (
                    <li
                      key={feature}
                      className="t-rise flex items-center gap-3 rounded-2xl border border-border/80 bg-background px-4 py-3.5"
                      style={{ "--t-i": index } as React.CSSProperties}
                    >
                      <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", suite.classes.soft)}>
                        <Check className="size-3.5" strokeWidth={3} />
                      </span>
                      <span className="text-[15px] font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div className="flex flex-col gap-4">
            <h2 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              Clear roles. Shared rhythm.
            </h2>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              Clinical and hospitality teams do different work, but both need
              the same thing: a trustworthy view of what is ready, what is
              waiting, and what happens next.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {suitePrinciples.map((item) => {
              const Icon = item.icon;
              const itemSuite = suiteMeta[item.suite];
              const roles = roleOrder.filter((role) => roleMeta[role].suite === item.suite);
              return (
                <div
                  key={item.suite}
                  className="flex flex-col gap-5 rounded-2xl border border-border/80 bg-card p-6 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className={cn("flex size-9 items-center justify-center rounded-lg", itemSuite.classes.soft)}>
                      <Icon className="size-[18px]" />
                    </span>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                  <ul className="flex flex-col gap-2.5 text-sm">
                    {item.points.map((point) => (
                      <li key={point} className="flex items-center gap-2.5">
                        <span className={cn("size-1.5 rounded-full", itemSuite.classes.solid)} />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto flex flex-wrap gap-1.5 border-t border-border/70 pt-4">
                    {roles.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setSelectedRole(role);
                          document.getElementById("workspace-picker")?.parentElement?.scrollIntoView({ block: "center" });
                        }}
                        className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors duration-(--duration-quick) hover:border-input hover:text-foreground"
                      >
                        {roleMeta[role].shortLabel}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <BrandMark />
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
