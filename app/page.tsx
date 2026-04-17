import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  ClipboardList,
  ConciergeBell,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
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

const highlights = [
  {
    title: "Guest flow",
    description:
      "Reservation lookup, preferences, and service requests in one place.",
    icon: Bell,
  },
  {
    title: "Staff coordination",
    description:
      "Room allocation, arrivals, and housekeeping status without extra tooling.",
    icon: ClipboardList,
  },
  {
    title: "Operational visibility",
    description:
      "Live summaries for schedules, requests, and readiness across the property.",
    icon: ShieldCheck,
  },
];

const quickStats = [
  { label: "Active portals", value: "3" },
  { label: "Core workflows", value: "12" },
  { label: "Live updates", value: "24/7" },
];

const workflows = [
  {
    title: "Arrival management",
    description:
      "Guide guests from confirmation to check-in with fewer handoffs.",
    icon: CalendarCheck,
  },
  {
    title: "Concierge requests",
    description:
      "Track preferences, amenities, and service notes in a shared queue.",
    icon: Sparkles,
  },
  {
    title: "Property readiness",
    description:
      "Keep staff aligned on occupancy, room state, and service coverage.",
    icon: MapPin,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen text-foreground">
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg border bg-card text-primary">
              <ConciergeBell className="size-5" />
            </div>
            <div>
              <p className="font-display text-xl">AurumStay</p>
              <p className="text-sm text-muted-foreground">
                Hospitality operations platform
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:py-12">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader className="gap-4">
              <Badge variant="secondary" className="w-fit">
                <Sparkles className="size-3" />
                Unified guest and staff workspace
              </Badge>
              <div className="space-y-3">
                <CardTitle className="font-display text-4xl md:text-5xl">
                  Run the stay from one clean interface
                </CardTitle>
                <CardDescription className="max-w-2xl text-base md:text-lg">
                  Your theme already defines the visual system. This landing
                  page now stays inside it and relies on shadcn components for
                  structure instead of custom decorative styling.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="sm:w-auto">
                  <Link href="/guest">
                    Open guest portal
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="sm:w-auto"
                >
                  <Link href="/staff">Open staff portal</Link>
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {quickStats.map((stat) => (
                  <Card key={stat.label}>
                    <CardHeader className="pb-2">
                      <CardDescription>{stat.label}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="font-display text-3xl">{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Star className="size-5 text-primary" />
                Today&apos;s operating snapshot
              </CardTitle>
              <CardDescription>
                A simple example of the platform tone using your existing
                tokens.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {[
                  ["Arrivals scheduled", "18"],
                  ["Rooms ready", "42"],
                  ["Open requests", "7"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-md border px-4 py-3"
                  >
                    <span className="text-sm text-muted-foreground">
                      {label}
                    </span>
                    <Badge variant="outline">{value}</Badge>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Use the guest portal for reservation preferences and service
                  requests.
                </p>
                <p>
                  Use the staff portal for allocation, arrivals, and room status
                  updates.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="size-5 text-primary" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section>
          <Card>
            <CardHeader>
              <Badge variant="outline" className="w-fit">
                <CalendarCheck className="size-3" />
                Core workflows
              </Badge>
              <CardTitle className="font-display text-3xl">
                Built around the day-to-day flow
              </CardTitle>
              <CardDescription>
                The UI now reads as a standard product surface instead of a
                custom-marketing page, while still using your configured global
                look.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {workflows.map((workflow) => {
                const Icon = workflow.icon;

                return (
                  <Card key={workflow.title}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Icon className="size-4 text-primary" />
                        {workflow.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {workflow.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-2xl">
                Access the platform by role
              </CardTitle>
              <CardDescription>
                Public entry points stay compact and consistent with the rest of
                the app.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline" className="sm:w-auto">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild variant="outline" className="sm:w-auto">
                <Link href="/guest">Guest portal</Link>
              </Button>
              <Button asChild variant="outline" className="sm:w-auto">
                <Link href="/staff">Staff portal</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
