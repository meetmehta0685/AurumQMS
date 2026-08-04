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
        <div className="max-w-7xl mx-auto p-6 flex flex-col gap-6">
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
        <Card className="w-full max-w-md bg-card p-6 text-center flex flex-col gap-4">
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
    <div className="min-h-screen bg-background pb-12">
      {/* Unified Top Navigation */}

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 flex flex-col gap-8">
        {/* Patient Hero Welcome Banner */}
        <div className="relative overflow-hidden rounded-xl border border-care/30 bg-card p-6 sm:p-8 shadow-sm">
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-care/40 text-care bg-care/10 gap-1.5">
                  <Heart className="size-3.5 fill-care/30" />
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
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4">
              <div className="size-12 rounded-xl bg-care/20 text-care flex items-center justify-center">
                <Activity className="size-6 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Queue System</p>
                <p className="font-display text-lg font-bold text-foreground">Live OPD Status</p>
                <span className="text-xs text-care font-medium">Ready & Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border hover:border-care/40 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Upcoming Consultations
              </CardTitle>
              <div className="size-10 rounded-xl bg-care/15 text-care flex items-center justify-center">
                <Calendar className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-bold text-foreground">
                {loadingData ? "..." : stats.upcomingAppointments}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="size-3 text-care" /> Confirmed appointments scheduled
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-info/40 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Completed Visits
              </CardTitle>
              <div className="size-10 rounded-xl bg-info/15 text-info flex items-center justify-center">
                <Users className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-bold text-foreground">
                {loadingData ? "..." : stats.pastAppointments}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <CheckCircle2 className="size-3 text-info" /> Historical consultation visits
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-care/40 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Health Records
              </CardTitle>
              <div className="size-10 rounded-xl bg-care/15 text-care flex items-center justify-center">
                <FileText className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-bold text-foreground">
                {loadingData ? "..." : stats.medicalRecords}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Sparkles className="size-3 text-care" /> Clinical documents & summaries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Calendar className="size-5 text-care" />
                  Upcoming Consultations
                </CardTitle>
                <CardDescription>Your active doctor appointments and token queue position</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="gap-1.5 text-care">
                <Link href="/patient/appointments">
                  View All <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col gap-4">
              {upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border bg-background hover:border-care/40 transition-all gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-care/15 text-care flex items-center justify-center shrink-0">
                      <Stethoscope className="size-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-base">
                        Dr. {apt.doctor?.profile?.full_name || "Specialist"}
                      </p>
                      <p className="text-xs font-medium text-care">
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
                      <Badge className="bg-care text-care-foreground font-mono font-bold text-xs shadow-sm">
                        Token #{apt.token_number}
                      </Badge>
                    )}
                    <Badge variant="outline" className="border-care/30 text-care bg-care/10 capitalize">
                      {apt.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Action Hub Cards */}
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-xl font-bold">Healthcare Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link href="/patient/appointments" className="group">
              <Card className="bg-card border-border hover:border-care/50 hover:shadow-sm transition-all h-full p-5 flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="size-12 rounded-2xl bg-care/15 text-care flex items-center justify-center transition-transform group-hover:scale-110">
                    <Calendar className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-care transition-colors">
                    Book Appointment
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Schedule OPD consultations with specialists.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-care gap-1">
                  <span>Browse Roster</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/patient/records" className="group">
              <Card className="bg-card border-border hover:border-info/50 hover:shadow-sm transition-all h-full p-5 flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="size-12 rounded-2xl bg-info/15 text-info flex items-center justify-center transition-transform group-hover:scale-110">
                    <FileText className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-info transition-colors">
                    Medical Records
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Access historical consultation notes.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-info gap-1">
                  <span>View History</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/patient/laboratory" className="group">
              <Card className="bg-card border-border hover:border-care/50 hover:shadow-sm transition-all h-full p-5 flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="size-12 rounded-2xl bg-care/15 text-care flex items-center justify-center transition-transform group-hover:scale-110">
                    <FlaskConical className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-care transition-colors">
                    Lab Reports
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Download diagnostic lab test results.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-care gap-1">
                  <span>View Results</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/patient/pharma" className="group">
              <Card className="bg-card border-border hover:border-warning/50 hover:shadow-sm transition-all h-full p-5 flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="size-12 rounded-2xl bg-warning/15 text-warning flex items-center justify-center transition-transform group-hover:scale-110">
                    <Pill className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-warning transition-colors">
                    Prescriptions
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Track medicine fulfillment status.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-warning gap-1">
                  <span>View Medicines</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>

            <Link href="/patient/discharge" className="group">
              <Card className="bg-card border-border hover:border-stay/50 hover:shadow-sm transition-all h-full p-5 flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="size-12 rounded-2xl bg-stay/15 text-stay flex items-center justify-center transition-transform group-hover:scale-110">
                    <FileDown className="size-6" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-stay transition-colors">
                    Discharge Summary
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Download clinical discharge documents.
                  </p>
                </div>
                <div className="pt-4 flex items-center text-xs font-semibold text-stay gap-1">
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
