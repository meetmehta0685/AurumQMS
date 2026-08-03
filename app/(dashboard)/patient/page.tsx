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
  Calendar,
  FileText,
  Users,
  LogOut,
  Clock,
  User,
  Stethoscope,
  Heart,
  ArrowRight,
  Activity,
  FlaskConical,
  Pill,
  FileDown,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { RoleHeader } from "@/components/layout/RoleHeader";

interface PatientStats {
  upcomingAppointments: number;
  pastAppointments: number;
  medicalRecords: number;
}

interface UpcomingAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  token_number: number | null;
  doctor: {
    profile: {
      full_name: string;
    } | null;
    specialization: string;
  } | null;
}

export default function PatientDashboard() {
  const { profile, isLoading, error, logout } = useAuth();
  const supabase = createClient();
  const [stats, setStats] = useState<PatientStats>({
    upcomingAppointments: 0,
    pastAppointments: 0,
    medicalRecords: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    UpcomingAppointment[]
  >([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!profile?.id) return;

      try {
        const today = new Date().toISOString().split("T")[0];

        // Fetch upcoming appointments
        const { data: upcoming } = await supabase
          .from("appointments")
          .select(
            `
            id,
            appointment_date,
            appointment_time,
            status,
            token_number,
            doctor:doctors(
              specialization,
              profile:profiles!doctors_profile_id_fkey(full_name)
            )
          `,
          )
          .eq("patient_id", profile.id)
          .gte("appointment_date", today)
          .in("status", ["pending", "confirmed"])
          .order("appointment_date", { ascending: true })
          .limit(5);

        // Fetch past appointments count
        const { count: pastCount } = await supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("patient_id", profile.id)
          .eq("status", "completed");

        // Fetch medical records count
        const { count: recordsCount } = await supabase
          .from("medical_records")
          .select("*", { count: "exact", head: true })
          .eq("patient_id", profile.id);

        setStats({
          upcomingAppointments: upcoming?.length || 0,
          pastAppointments: pastCount || 0,
          medicalRecords: recordsCount || 0,
        });

        // Map appointments
        const mappedAppointments: UpcomingAppointment[] = (upcoming || []).map(
          (apt: any) => ({
            id: apt.id,
            appointment_date: apt.appointment_date,
            appointment_time: apt.appointment_time,
            status: apt.status,
            token_number: apt.token_number,
            doctor: Array.isArray(apt.doctor)
              ? {
                  ...apt.doctor[0],
                  profile: Array.isArray(apt.doctor[0]?.profile)
                    ? apt.doctor[0].profile[0]
                    : apt.doctor[0]?.profile,
                }
              : apt.doctor,
          }),
        );

        setUpcomingAppointments(mappedAppointments);
      } catch (error) {
        console.error("Error fetching patient data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    if (profile) {
      fetchPatientData();
    }
  }, [profile, supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <RoleHeader currentRole="patient" />
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-64 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
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
            {error || "Unable to load profile details."}
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
      <RoleHeader currentRole="patient" />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 space-y-8">
        {/* Patient Hero Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-teal-500/30 glass-card p-6 sm:p-8 glow-teal">
          <div className="absolute -top-16 -right-16 size-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-teal-500/40 text-teal-600 dark:text-teal-400 bg-teal-500/10 gap-1.5">
                  <Heart className="size-3.5 fill-teal-500/30" />
                  Patient Portal
                </Badge>
                <span className="text-xs text-muted-foreground">• Active Care Session</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground">
                Hello, {profile.full_name?.split(" ")[0]} 👋
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl">
                Track your live queue tokens, view upcoming specialist consultations, access digital lab reports, and manage your prescriptions.
              </p>
            </div>

            {/* Quick Token Badge */}
            <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-background/50 p-4 backdrop-blur-sm">
              <div className="size-12 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Activity className="size-6 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Queue System</p>
                <p className="font-display text-lg font-bold text-foreground">Live OPD Status</p>
                <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">Ready & Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card border-border/60 hover:border-teal-500/40 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Upcoming Consultations
              </CardTitle>
              <div className="size-10 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Calendar className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-bold text-foreground">
                {loadingData ? "..." : stats.upcomingAppointments}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="size-3 text-teal-500" /> Confirmed appointments scheduled
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/60 hover:border-indigo-500/40 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Completed Visits
              </CardTitle>
              <div className="size-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Users className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-bold text-foreground">
                {loadingData ? "..." : stats.pastAppointments}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <CheckCircle2 className="size-3 text-indigo-500" /> Historical consultation visits
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/60 hover:border-cyan-500/40 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Health Records
              </CardTitle>
              <div className="size-10 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <FileText className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-bold text-foreground">
                {loadingData ? "..." : stats.medicalRecords}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Sparkles className="size-3 text-cyan-500" /> Clinical documents & summaries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <Card className="glass-card border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/40">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Calendar className="size-5 text-teal-500" />
                  Upcoming Consultations
                </CardTitle>
                <CardDescription>Your active doctor appointments and token queue position</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="gap-1.5 text-teal-600 dark:text-teal-400">
                <Link href="/patient/appointments">
                  View All <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border/50 bg-background/50 hover:border-teal-500/40 transition-all gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <Stethoscope className="size-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-base">
                        Dr. {apt.doctor?.profile?.full_name || "Specialist"}
                      </p>
                      <p className="text-xs font-medium text-teal-600 dark:text-teal-400">
                        {apt.doctor?.specialization}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" /> {apt.appointment_date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" /> {apt.appointment_time}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    {apt.token_number && (
                      <div className="px-3 py-1 rounded-full bg-teal-500 text-teal-950 font-mono font-bold text-xs shadow-sm">
                        Token #{apt.token_number}
                      </div>
                    )}
                    <Badge variant="outline" className="border-teal-500/30 text-teal-600 dark:text-teal-400 bg-teal-500/10 capitalize">
                      {apt.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Action Hub Cards */}
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold">Healthcare Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link href="/patient/appointments" className="group">
              <Card className="glass-card border-border/60 hover:border-teal-500/50 hover:shadow-lg transition-all h-full p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="size-12 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center transition-transform group-hover:scale-110">
                    <Calendar className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    Book Appointment
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Schedule OPD consultations with specialists.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-teal-600 dark:text-teal-400 gap-1">
                  <span>Browse Roster</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/patient/records" className="group">
              <Card className="glass-card border-border/60 hover:border-indigo-500/50 hover:shadow-lg transition-all h-full p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="size-12 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-transform group-hover:scale-110">
                    <FileText className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Medical Records
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Access historical consultation notes.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 gap-1">
                  <span>View History</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/patient/laboratory" className="group">
              <Card className="glass-card border-border/60 hover:border-cyan-500/50 hover:shadow-lg transition-all h-full p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="size-12 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center transition-transform group-hover:scale-110">
                    <FlaskConical className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    Lab Reports
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Download diagnostic lab test results.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-cyan-600 dark:text-cyan-400 gap-1">
                  <span>View Results</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/patient/pharma" className="group">
              <Card className="glass-card border-border/60 hover:border-amber-500/50 hover:shadow-lg transition-all h-full p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="size-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-transform group-hover:scale-110">
                    <Pill className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Prescriptions
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Track medicine fulfillment status.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-amber-600 dark:text-amber-400 gap-1">
                  <span>View Medicines</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/patient/discharge" className="group">
              <Card className="glass-card border-border/60 hover:border-rose-500/50 hover:shadow-lg transition-all h-full p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="size-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-transform group-hover:scale-110">
                    <FileDown className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    Discharge Summary
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Download clinical discharge documents.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-rose-600 dark:text-rose-400 gap-1">
                  <span>Download PDF</span>
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
