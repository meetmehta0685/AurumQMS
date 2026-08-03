"use client";

import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Stethoscope,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  FlaskConical,
  Pill,
  FileDown,
  Activity,
  ArrowRight,
  User,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { RoleHeader } from "@/components/layout/RoleHeader";

interface DoctorStats {
  todayAppointments: number;
  patientsInQueue: number;
  completedToday: number;
}

interface UpcomingAppointment {
  id: string;
  appointment_time: string;
  status: string;
  token_number: number | null;
  patient: {
    full_name: string;
  } | null;
}

export default function DoctorDashboard() {
  const { profile, isLoading, error, logout } = useAuth();
  const supabase = createClient();
  const [stats, setStats] = useState<DoctorStats>({
    todayAppointments: 0,
    patientsInQueue: 0,
    completedToday: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    UpcomingAppointment[]
  >([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!profile?.user_id) return;

      try {
        const { data: doctor } = await supabase
          .from("doctors")
          .select("id")
          .eq("user_id", profile.user_id)
          .single();

        if (!doctor) {
          setLoadingData(false);
          return;
        }

        const today = new Date().toISOString().split("T")[0];

        const { data: appointments } = await supabase
          .from("appointments")
          .select(
            `
            id,
            appointment_time,
            status,
            token_number,
            patient:profiles!appointments_patient_id_fkey(full_name)
          `,
          )
          .eq("doctor_id", doctor.id)
          .eq("appointment_date", today)
          .order("appointment_time", { ascending: true });

        if (appointments) {
          const todayAppts = appointments.length;
          const completed = appointments.filter(
            (a) => a.status === "completed",
          ).length;
          const waiting = appointments.filter(
            (a) => a.status === "confirmed" || a.status === "pending",
          ).length;

          setStats({
            todayAppointments: todayAppts,
            patientsInQueue: waiting,
            completedToday: completed,
          });

          const mappedAppointments: UpcomingAppointment[] = appointments
            .slice(0, 5)
            .map((apt: any) => ({
              id: apt.id,
              appointment_time: apt.appointment_time,
              status: apt.status,
              token_number: apt.token_number,
              patient: Array.isArray(apt.patient)
                ? apt.patient[0]
                : apt.patient,
            }));

          setUpcomingAppointments(mappedAppointments);
        }
      } catch (error) {
        console.error("Error fetching doctor data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    if (profile) {
      fetchDoctorData();
    }
  }, [profile, supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <RoleHeader currentRole="doctor" />
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-64 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card p-6 text-center space-y-4">
          <div className="size-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto">
            <User className="size-8" />
          </div>
          <CardTitle className="text-xl font-bold">Profile Not Found</CardTitle>
          <CardDescription>
            {error || "Unable to load doctor workstation profile."}
          </CardDescription>
          <Button onClick={logout} className="w-full">
            Return to Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/20 pb-12">
      {/* Unified Top Navigation */}
      <RoleHeader currentRole="doctor" />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 space-y-8">
        {/* Doctor Hero Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 glass-card p-6 sm:p-8 glow-indigo">
          <div className="absolute -top-16 -right-16 size-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-indigo-500/40 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 gap-1.5">
                  <Stethoscope className="size-3.5" />
                  Clinical Workstation
                </Badge>
                <span className="text-xs text-muted-foreground">• Live OPD Session</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground">
                Dr. {profile.full_name} 🩺
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl">
                Manage your live OPD consultation queue, call upcoming tokens, issue digital e-prescriptions, and order diagnostic lab tests.
              </p>
            </div>

            <Button asChild size="lg" className="shadow-lg shadow-indigo-500/20 gap-2 shrink-0">
              <Link href="/doctor/queue">
                <Activity className="size-4" />
                Launch Live Queue Workstation
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card border-border/60 hover:border-indigo-500/40 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Today&apos;s Appointments
              </CardTitle>
              <div className="size-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Calendar className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-bold text-foreground">
                {loadingData ? "..." : stats.todayAppointments}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Scheduled OPD consultations</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/60 hover:border-amber-500/40 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Patients in Waiting Queue
              </CardTitle>
              <div className="size-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Users className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-bold text-amber-600 dark:text-amber-400">
                {loadingData ? "..." : stats.patientsInQueue}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Active waiting token queue</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/60 hover:border-emerald-500/40 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Completed Consultations
              </CardTitle>
              <div className="size-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {loadingData ? "..." : stats.completedToday}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Finished OPD sessions today</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Queue List */}
        {upcomingAppointments.length > 0 && (
          <Card className="glass-card border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/40">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Users className="size-5 text-indigo-500" />
                  Active OPD Queue Roster
                </CardTitle>
                <CardDescription>Patients currently waiting for consultation</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="gap-1.5 text-indigo-600 dark:text-indigo-400">
                <Link href="/doctor/queue">
                  Open Queue Console <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              {upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-background/50 hover:border-indigo-500/40 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="size-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-sm flex items-center justify-center">
                      #{apt.token_number || "-"}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {apt.patient?.full_name || "Patient Record"}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" /> Slot: {apt.appointment_time}
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline" className="capitalize border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10">
                    {apt.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Doctor Actions */}
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold">Clinical Workspace Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link href="/doctor/queue" className="group">
              <Card className="glass-card border-border/60 hover:border-indigo-500/50 hover:shadow-lg transition-all h-full p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="size-12 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-transform group-hover:scale-110">
                    <Stethoscope className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Token Queue
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Call patients & record consultation notes.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 gap-1">
                  <span>Open Console</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/doctor/schedule" className="group">
              <Card className="glass-card border-border/60 hover:border-purple-500/50 hover:shadow-lg transition-all h-full p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="size-12 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center transition-transform group-hover:scale-110">
                    <Calendar className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    My Schedule
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Set consultation timings & availability slots.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-purple-600 dark:text-purple-400 gap-1">
                  <span>Manage Slots</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/doctor/laboratory" className="group">
              <Card className="glass-card border-border/60 hover:border-cyan-500/50 hover:shadow-lg transition-all h-full p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="size-12 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center transition-transform group-hover:scale-110">
                    <FlaskConical className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    Order Lab Tests
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Order bloodwork & review diagnostic results.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-cyan-600 dark:text-cyan-400 gap-1">
                  <span>Order Tests</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/doctor/pharma" className="group">
              <Card className="glass-card border-border/60 hover:border-amber-500/50 hover:shadow-lg transition-all h-full p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="size-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-transform group-hover:scale-110">
                    <Pill className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Pharmacy Orders
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Issue prescriptions & verify medication stock.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-amber-600 dark:text-amber-400 gap-1">
                  <span>E-Prescribe</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/doctor/discharge" className="group">
              <Card className="glass-card border-border/60 hover:border-rose-500/50 hover:shadow-lg transition-all h-full p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="size-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-transform group-hover:scale-110">
                    <FileDown className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    Discharge Summary
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Authorize discharge notes & PDF summary.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-rose-600 dark:text-rose-400 gap-1">
                  <span>Authorize Discharge</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
