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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

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
      <div className="min-h-[calc(100svh-4.5rem)] bg-background">
        <div className="max-w-7xl mx-auto p-6 flex flex-col gap-6">
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
      <div className="min-h-[calc(100svh-4.5rem)] bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card p-6 text-center flex flex-col gap-4">
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
    <div className="min-h-[calc(100svh-4.5rem)] bg-background pb-12">
      {/* Unified Top Navigation */}

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 flex flex-col gap-8">
        {/* Doctor Hero Welcome Banner */}
        <div className="pt-2">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
                Dr. {profile.full_name}
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl">
                Manage your live OPD consultation queue, call upcoming tokens, issue digital e-prescriptions, and order diagnostic lab tests.
              </p>
            </div>

            <Button asChild size="lg" className="shadow-sm gap-2 shrink-0">
              <Link href="/doctor/queue">
                <Activity className="size-4" />
                Launch Live Queue Workstation
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border hover:border-info/40 transition-[color,background-color,border-color,box-shadow,translate]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Today&apos;s Appointments
              </CardTitle>
              <div className="size-10 rounded-xl bg-info/15 text-info flex items-center justify-center">
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

          <Card className="bg-card border-border hover:border-warning/40 transition-[color,background-color,border-color,box-shadow,translate]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Patients in Waiting Queue
              </CardTitle>
              <div className="size-10 rounded-xl bg-warning/15 text-warning flex items-center justify-center">
                <Users className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-bold text-warning">
                {loadingData ? "..." : stats.patientsInQueue}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Active waiting token queue</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-stay/40 transition-[color,background-color,border-color,box-shadow,translate]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Completed Consultations
              </CardTitle>
              <div className="size-10 rounded-xl bg-stay/15 text-stay flex items-center justify-center">
                <CheckCircle className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-bold text-stay">
                {loadingData ? "..." : stats.completedToday}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Finished OPD sessions today</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Queue List */}
        {upcomingAppointments.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Users className="size-5 text-info" />
                  Active OPD Queue Roster
                </CardTitle>
                <CardDescription>Patients currently waiting for consultation</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="gap-1.5 text-info">
                <Link href="/doctor/queue">
                  Open Queue Console <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col gap-3">
              {upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-border bg-background hover:border-info/40 transition-[color,background-color,border-color,box-shadow,translate]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="size-10 rounded-xl bg-info/15 text-info font-mono font-bold text-sm flex items-center justify-center">
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

                  <Badge variant="outline" className="capitalize border-info/30 text-info bg-info/10">
                    {apt.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Doctor Actions */}
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-xl font-bold">Clinical Workspace Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link href="/doctor/queue" className="group">
              <Card className="bg-card border-border hover:border-info/50 hover:shadow-sm transition-[color,background-color,border-color,box-shadow,translate] h-full p-5 flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="size-12 rounded-2xl bg-info/15 text-info flex items-center justify-center transition-transform">
                    <Stethoscope className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-info transition-colors">
                    Token Queue
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Call patients & record consultation notes.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-info gap-1">
                  <span>Open Console</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/doctor/schedule" className="group">
              <Card className="bg-card border-border hover:border-info/50 hover:shadow-sm transition-[color,background-color,border-color,box-shadow,translate] h-full p-5 flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="size-12 rounded-2xl bg-info/15 text-info flex items-center justify-center transition-transform">
                    <Calendar className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-info transition-colors">
                    My Schedule
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Set consultation timings & availability slots.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-info gap-1">
                  <span>Manage Slots</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/doctor/laboratory" className="group">
              <Card className="bg-card border-border hover:border-care/50 hover:shadow-sm transition-[color,background-color,border-color,box-shadow,translate] h-full p-5 flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="size-12 rounded-2xl bg-care/15 text-care flex items-center justify-center transition-transform">
                    <FlaskConical className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-care transition-colors">
                    Order Lab Tests
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Order bloodwork & review diagnostic results.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-care gap-1">
                  <span>Order Tests</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/doctor/pharma" className="group">
              <Card className="bg-card border-border hover:border-warning/50 hover:shadow-sm transition-[color,background-color,border-color,box-shadow,translate] h-full p-5 flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="size-12 rounded-2xl bg-warning/15 text-warning flex items-center justify-center transition-transform">
                    <Pill className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-warning transition-colors">
                    Pharmacy Orders
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Issue prescriptions & verify medication stock.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-warning gap-1">
                  <span>E-Prescribe</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/doctor/discharge" className="group">
              <Card className="bg-card border-border hover:border-stay/50 hover:shadow-sm transition-[color,background-color,border-color,box-shadow,translate] h-full p-5 flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="size-12 rounded-2xl bg-stay/15 text-stay flex items-center justify-center transition-transform">
                    <FileDown className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-stay transition-colors">
                    Discharge Summary
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Authorize discharge notes & PDF summary.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-stay gap-1">
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
