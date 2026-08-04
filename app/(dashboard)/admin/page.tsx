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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

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
        <div className="max-w-7xl mx-auto p-6 flex flex-col gap-6">
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
        <Card className="w-full max-w-md bg-card p-6 text-center flex flex-col gap-4">
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
    <div className="min-h-screen bg-background pb-12">
      {/* Unified Top Navigation */}

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 flex flex-col gap-8">
        {/* Admin Command Center Banner */}
        <div className="relative overflow-hidden rounded-xl border border-info/30 bg-card p-6 sm:p-8 shadow-sm">
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-info/40 text-info bg-info/10 gap-1.5">
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

            <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4">
              <div className="size-12 rounded-xl bg-info/20 text-info flex items-center justify-center">
                <Activity className="size-6 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">System Operational</p>
                <p className="font-display text-lg font-bold text-foreground">100% Online</p>
                <span className="text-xs text-info font-medium">All Services Running</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-border hover:border-info/40 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Total Doctors
              </CardTitle>
              <div className="size-10 rounded-xl bg-info/15 text-info flex items-center justify-center">
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

          <Card className="bg-card border-border hover:border-care/40 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Total Patients
              </CardTitle>
              <div className="size-10 rounded-xl bg-care/15 text-care flex items-center justify-center">
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

          <Card className="bg-card border-border hover:border-info/40 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Departments
              </CardTitle>
              <div className="size-10 rounded-xl bg-info/15 text-info flex items-center justify-center">
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

          <Card className="bg-card border-border hover:border-warning/40 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Today&apos;s OPD Volume
              </CardTitle>
              <div className="size-10 rounded-xl bg-warning/15 text-warning flex items-center justify-center">
                <Calendar className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-bold text-foreground">
                {loadingData ? "..." : stats.todayAppointments}
              </div>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] border-stay/30 text-stay bg-stay/10">
                  {stats.completedToday} done
                </Badge>
                <Badge variant="outline" className="text-[10px] border-warning/30 text-warning bg-warning/10">
                  {stats.pendingToday} pending
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Activity */}
        {recentAppointments.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="size-5 text-info" />
                  Live OPD Activity Timeline
                </CardTitle>
                <CardDescription>Recent patient check-ins and appointments</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="gap-1.5 text-info">
                <Link href="/admin/appointments">
                  View Full Registry <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col gap-3">
              {recentAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-border bg-background hover:border-info/40 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="size-10 rounded-xl bg-info/15 text-info flex items-center justify-center">
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

                  <Badge variant="outline" className="capitalize border-info/30 text-info bg-info/10">
                    {apt.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Admin Management Grid */}
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-xl font-bold">Hospital Operations Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Link href="/admin/doctors" className="group">
              <Card className="bg-card border-border hover:border-info/50 hover:shadow-sm transition-all h-full p-5 flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="size-12 rounded-2xl bg-info/15 text-info flex items-center justify-center transition-transform group-hover:scale-110">
                    <Users className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-info transition-colors">
                    Doctors
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Manage medical rosters & credentials.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-info gap-1">
                  <span>Manage Roster</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/admin/departments" className="group">
              <Card className="bg-card border-border hover:border-info/50 hover:shadow-sm transition-all h-full p-5 flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="size-12 rounded-2xl bg-info/15 text-info flex items-center justify-center transition-transform group-hover:scale-110">
                    <Building2 className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-info transition-colors">
                    Departments
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Configure clinical specialties & beds.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-info gap-1">
                  <span>View Units</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/admin/appointments" className="group">
              <Card className="bg-card border-border hover:border-care/50 hover:shadow-sm transition-all h-full p-5 flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="size-12 rounded-2xl bg-care/15 text-care flex items-center justify-center transition-transform group-hover:scale-110">
                    <Calendar className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-care transition-colors">
                    Appointments
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Hospital-wide OPD schedule logs.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-care gap-1">
                  <span>View Schedule</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/admin/laboratory" className="group">
              <Card className="bg-card border-border hover:border-care/50 hover:shadow-sm transition-all h-full p-5 flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="size-12 rounded-2xl bg-care/15 text-care flex items-center justify-center transition-transform group-hover:scale-110">
                    <FlaskConical className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-care transition-colors">
                    Laboratory
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Monitor diagnostic test orders.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-care gap-1">
                  <span>Audit Diagnostics</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/admin/pharma" className="group">
              <Card className="bg-card border-border hover:border-warning/50 hover:shadow-sm transition-all h-full p-5 flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="size-12 rounded-2xl bg-warning/15 text-warning flex items-center justify-center transition-transform group-hover:scale-110">
                    <Pill className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-warning transition-colors">
                    Pharmacy
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Dispensary stock & fulfillment logs.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-warning gap-1">
                  <span>Track Dispensary</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/admin/discharge" className="group">
              <Card className="bg-card border-border hover:border-stay/50 hover:shadow-sm transition-all h-full p-5 flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="size-12 rounded-2xl bg-stay/15 text-stay flex items-center justify-center transition-transform group-hover:scale-110">
                    <FileDown className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-stay transition-colors">
                    Discharge
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Audit patient discharge records.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-stay gap-1">
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
