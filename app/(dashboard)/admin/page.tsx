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
  Users,
  Building2,
  Calendar,
  Stethoscope,
  Clock,
  TrendingUp,
  Shield,
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

interface AdminStats {
  totalDoctors: number;
  totalPatients: number;
  totalDepartments: number;
  todayAppointments: number;
  completedToday: number;
  pendingToday: number;
}

interface RecentAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  patient: {
    full_name: string;
  } | null;
  doctor: {
    profile: {
      full_name: string;
    } | null;
    specialization: string;
  } | null;
}

export default function AdminDashboard() {
  const { profile, isLoading, error, logout } = useAuth();
  const supabase = createClient();
  const [stats, setStats] = useState<AdminStats>({
    totalDoctors: 0,
    totalPatients: 0,
    totalDepartments: 0,
    todayAppointments: 0,
    completedToday: 0,
    pendingToday: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<
    RecentAppointment[]
  >([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];

        const [doctorsRes, patientsRes, departmentsRes, appointmentsRes] =
          await Promise.all([
            supabase
              .from("doctors")
              .select("*", { count: "exact", head: true }),
            supabase
              .from("profiles")
              .select("*", { count: "exact", head: true })
              .eq("role", "patient"),
            supabase
              .from("departments")
              .select("*", { count: "exact", head: true }),
            supabase
              .from("appointments")
              .select(
                `
              id,
              appointment_date,
              appointment_time,
              status,
              patient:profiles!appointments_patient_id_fkey(full_name),
              doctor:doctors(
                specialization,
                profile:profiles!doctors_profile_id_fkey(full_name)
              )
            `,
              )
              .eq("appointment_date", today)
              .order("appointment_time", { ascending: true }),
          ]);

        const appointments = appointmentsRes.data || [];
        const completedToday = appointments.filter(
          (a) => a.status === "completed",
        ).length;
        const pendingToday = appointments.filter(
          (a) => a.status === "pending" || a.status === "confirmed",
        ).length;

        setStats({
          totalDoctors: doctorsRes.count || 0,
          totalPatients: patientsRes.count || 0,
          totalDepartments: departmentsRes.count || 0,
          todayAppointments: appointments.length,
          completedToday,
          pendingToday,
        });

        const mappedAppointments: RecentAppointment[] = appointments
          .slice(0, 5)
          .map((apt: any) => ({
            id: apt.id,
            appointment_date: apt.appointment_date,
            appointment_time: apt.appointment_time,
            status: apt.status,
            patient: Array.isArray(apt.patient) ? apt.patient[0] : apt.patient,
            doctor: Array.isArray(apt.doctor)
              ? {
                  ...apt.doctor[0],
                  profile: Array.isArray(apt.doctor[0]?.profile)
                    ? apt.doctor[0].profile[0]
                    : apt.doctor[0]?.profile,
                }
              : apt.doctor,
          }));

        setRecentAppointments(mappedAppointments);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchAdminData();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <RoleHeader currentRole="admin" />
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-64 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
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
            {error || "Unable to load admin profile."}
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
      <RoleHeader currentRole="admin" />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 space-y-8">
        {/* Admin Command Center Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 glass-card p-6 sm:p-8 glow-indigo">
          <div className="absolute -top-16 -right-16 size-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-purple-500/40 text-purple-600 dark:text-purple-400 bg-purple-500/10 gap-1.5">
                  <Shield className="size-3.5" />
                  Command Center
                </Badge>
                <span className="text-xs text-muted-foreground">• Hospital Operations</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground">
                Admin Control Room ⚡
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl">
                Real-time oversight across medical departments, doctor schedules, OPD queue throughput, diagnostic labs, and pharmacy dispensaries.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/50 p-4 backdrop-blur-sm">
              <div className="size-12 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Activity className="size-6 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">System Operational</p>
                <p className="font-display text-lg font-bold text-foreground">100% Online</p>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">All Services Running</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="glass-card border-border/60 hover:border-purple-500/40 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Total Doctors
              </CardTitle>
              <div className="size-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Stethoscope className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-bold text-foreground">
                {loadingData ? "..." : stats.totalDoctors}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Active registered physicians</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/60 hover:border-teal-500/40 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Total Patients
              </CardTitle>
              <div className="size-10 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Users className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-bold text-foreground">
                {loadingData ? "..." : stats.totalPatients}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Registered patient accounts</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/60 hover:border-indigo-500/40 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Departments
              </CardTitle>
              <div className="size-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Building2 className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-bold text-foreground">
                {loadingData ? "..." : stats.totalDepartments}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Active hospital specialties</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/60 hover:border-amber-500/40 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Today&apos;s OPD Volume
              </CardTitle>
              <div className="size-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Calendar className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-bold text-foreground">
                {loadingData ? "..." : stats.todayAppointments}
              </div>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
                  {stats.completedToday} done
                </Badge>
                <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 bg-amber-500/10">
                  {stats.pendingToday} pending
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Activity */}
        {recentAppointments.length > 0 && (
          <Card className="glass-card border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/40">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="size-5 text-purple-500" />
                  Live OPD Activity Timeline
                </CardTitle>
                <CardDescription>Recent patient check-ins and appointments</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="gap-1.5 text-purple-600 dark:text-purple-400">
                <Link href="/admin/appointments">
                  View Full Registry <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              {recentAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-background/50 hover:border-purple-500/40 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="size-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <Clock className="size-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {apt.patient?.full_name || "Patient Record"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Dr. {apt.doctor?.profile?.full_name || "Specialist"} • {apt.doctor?.specialization}
                      </p>
                      <p className="text-[11px] text-muted-foreground/70">{apt.appointment_time}</p>
                    </div>
                  </div>

                  <Badge variant="outline" className="capitalize border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10">
                    {apt.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Admin Management Grid */}
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold">Hospital Operations Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Link href="/admin/doctors" className="group">
              <Card className="glass-card border-border/60 hover:border-purple-500/50 hover:shadow-lg transition-all h-full p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="size-12 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center transition-transform group-hover:scale-110">
                    <Users className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Doctors
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Manage medical rosters & credentials.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-purple-600 dark:text-purple-400 gap-1">
                  <span>Manage Roster</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/admin/departments" className="group">
              <Card className="glass-card border-border/60 hover:border-indigo-500/50 hover:shadow-lg transition-all h-full p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="size-12 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-transform group-hover:scale-110">
                    <Building2 className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Departments
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Configure clinical specialties & beds.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 gap-1">
                  <span>View Units</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/admin/appointments" className="group">
              <Card className="glass-card border-border/60 hover:border-teal-500/50 hover:shadow-lg transition-all h-full p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="size-12 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center transition-transform group-hover:scale-110">
                    <Calendar className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    Appointments
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Hospital-wide OPD schedule logs.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-teal-600 dark:text-teal-400 gap-1">
                  <span>View Schedule</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/admin/laboratory" className="group">
              <Card className="glass-card border-border/60 hover:border-cyan-500/50 hover:shadow-lg transition-all h-full p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="size-12 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center transition-transform group-hover:scale-110">
                    <FlaskConical className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    Laboratory
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Monitor diagnostic test orders.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-cyan-600 dark:text-cyan-400 gap-1">
                  <span>Audit Diagnostics</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/admin/pharma" className="group">
              <Card className="glass-card border-border/60 hover:border-amber-500/50 hover:shadow-lg transition-all h-full p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="size-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-transform group-hover:scale-110">
                    <Pill className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Pharmacy
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Dispensary stock & fulfillment logs.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-amber-600 dark:text-amber-400 gap-1">
                  <span>Track Dispensary</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/admin/discharge" className="group">
              <Card className="glass-card border-border/60 hover:border-rose-500/50 hover:shadow-lg transition-all h-full p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="size-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-transform group-hover:scale-110">
                    <FileDown className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    Discharge
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Audit patient discharge records.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-rose-600 dark:text-rose-400 gap-1">
                  <span>Audit Records</span>
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
