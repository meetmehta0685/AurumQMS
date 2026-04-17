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
  ArrowLeft,
  BarChart3,
  Users,
  Calendar,
  Stethoscope,
  TrendingUp,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

interface ReportStats {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  pendingAppointments: number;
  totalDoctors: number;
  totalPatients: number;
  totalDepartments: number;
  todayAppointments: number;
  thisWeekAppointments: number;
  thisMonthAppointments: number;
}

interface DepartmentStats {
  name: string;
  doctorCount: number;
  appointmentCount: number;
}

interface DoctorStats {
  name: string;
  specialization: string;
  appointmentCount: number;
  completedCount: number;
}

export default function AdminReportsPage() {
  const { isLoading } = useAuth();
  const supabase = createClient();
  const [loadingData, setLoadingData] = useState(true);
  const [stats, setStats] = useState<ReportStats>({
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    pendingAppointments: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalDepartments: 0,
    todayAppointments: 0,
    thisWeekAppointments: 0,
    thisMonthAppointments: 0,
  });
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [doctorStats, setDoctorStats] = useState<DoctorStats[]>([]);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];

        // Calculate week start (Monday) and month start
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1);
        const weekStartStr = weekStart.toISOString().split("T")[0];

        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthStartStr = monthStart.toISOString().split("T")[0];

        // Fetch all data in parallel
        const [
          appointmentsRes,
          completedRes,
          cancelledRes,
          pendingRes,
          doctorsRes,
          patientsRes,
          departmentsRes,
          todayRes,
          weekRes,
          monthRes,
        ] = await Promise.all([
          supabase
            .from("appointments")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .eq("status", "completed"),
          supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .eq("status", "cancelled"),
          supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase.from("doctors").select("*", { count: "exact", head: true }),
          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("role", "patient"),
          supabase
            .from("departments")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .eq("appointment_date", todayStr),
          supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .gte("appointment_date", weekStartStr),
          supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .gte("appointment_date", monthStartStr),
        ]);

        setStats({
          totalAppointments: appointmentsRes.count || 0,
          completedAppointments: completedRes.count || 0,
          cancelledAppointments: cancelledRes.count || 0,
          pendingAppointments: pendingRes.count || 0,
          totalDoctors: doctorsRes.count || 0,
          totalPatients: patientsRes.count || 0,
          totalDepartments: departmentsRes.count || 0,
          todayAppointments: todayRes.count || 0,
          thisWeekAppointments: weekRes.count || 0,
          thisMonthAppointments: monthRes.count || 0,
        });

        // Fetch department stats
        const { data: departments } = await supabase
          .from("departments")
          .select("id, name");

        if (departments) {
          const deptStatsPromises = departments.map(async (dept) => {
            const [doctorCountRes, appointmentCountRes] = await Promise.all([
              supabase
                .from("doctors")
                .select("*", { count: "exact", head: true })
                .eq("department_id", dept.id),
              supabase
                .from("appointments")
                .select("*, doctor:doctors!inner(department_id)", {
                  count: "exact",
                  head: true,
                })
                .eq("doctor.department_id", dept.id),
            ]);

            return {
              name: dept.name,
              doctorCount: doctorCountRes.count || 0,
              appointmentCount: appointmentCountRes.count || 0,
            };
          });

          const deptStats = await Promise.all(deptStatsPromises);
          setDepartmentStats(
            deptStats.sort((a, b) => b.appointmentCount - a.appointmentCount),
          );
        }

        // Fetch top doctors
        const { data: doctors } = await supabase.from("doctors").select(`
            id,
            specialization,
            profile:profiles!doctors_profile_id_fkey(full_name)
          `);

        if (doctors) {
          const doctorStatsPromises = doctors.map(async (doc: any) => {
            const [totalRes, completedRes] = await Promise.all([
              supabase
                .from("appointments")
                .select("*", { count: "exact", head: true })
                .eq("doctor_id", doc.id),
              supabase
                .from("appointments")
                .select("*", { count: "exact", head: true })
                .eq("doctor_id", doc.id)
                .eq("status", "completed"),
            ]);

            const profile = Array.isArray(doc.profile)
              ? doc.profile[0]
              : doc.profile;

            return {
              name: profile?.full_name || "Unknown",
              specialization: doc.specialization,
              appointmentCount: totalRes.count || 0,
              completedCount: completedRes.count || 0,
            };
          });

          const docStats = await Promise.all(doctorStatsPromises);
          setDoctorStats(
            docStats
              .sort((a, b) => b.appointmentCount - a.appointmentCount)
              .slice(0, 5),
          );
        }
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchReportData();
  }, [supabase]);

  if (isLoading || loadingData) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          <Skeleton className="h-10 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const completionRate =
    stats.totalAppointments > 0
      ? Math.round(
          (stats.completedAppointments / stats.totalAppointments) * 100,
        )
      : 0;

  const cancellationRate =
    stats.totalAppointments > 0
      ? Math.round(
          (stats.cancelledAppointments / stats.totalAppointments) * 100,
        )
      : 0;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Reports & Analytics
            </h1>
            <p className="text-muted-foreground">
              Hospital performance insights and statistics
            </p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-chart-4" />
                Total Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-4">
                {stats.totalAppointments}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-chart-1" />
                Total Doctors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-1">
                {stats.totalDoctors}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-chart-2" />
                Total Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-2">
                {stats.totalPatients}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-chart-3" />
                Departments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-3">
                {stats.totalDepartments}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-chart-3" />
                Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.todayAppointments}
              </div>
              <p className="text-sm text-muted-foreground">appointments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-chart-4" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.thisWeekAppointments}
              </div>
              <p className="text-sm text-muted-foreground">appointments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-chart-2" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.thisMonthAppointments}
              </div>
              <p className="text-sm text-muted-foreground">appointments</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-chart-1" />
                Completion Rate
              </CardTitle>
              <CardDescription>
                Appointments successfully completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-chart-1">
                  {completionRate}%
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-chart-1 transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {stats.completedAppointments} of {stats.totalAppointments}{" "}
                    appointments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-destructive" />
                Cancellation Rate
              </CardTitle>
              <CardDescription>
                Appointments cancelled by patients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-destructive">
                  {cancellationRate}%
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-destructive transition-all duration-500"
                      style={{ width: `${cancellationRate}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {stats.cancelledAppointments} of {stats.totalAppointments}{" "}
                    appointments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Department Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Department Performance
              </CardTitle>
              <CardDescription>Appointments by department</CardDescription>
            </CardHeader>
            <CardContent>
              {departmentStats.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No department data available
                </p>
              ) : (
                <div className="space-y-4">
                  {departmentStats.map((dept, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{dept.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {dept.doctorCount} doctors
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {dept.appointmentCount} appointments
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Doctors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                Top Doctors
              </CardTitle>
              <CardDescription>By number of appointments</CardDescription>
            </CardHeader>
            <CardContent>
              {doctorStats.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No doctor data available
                </p>
              ) : (
                <div className="space-y-4">
                  {doctorStats.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-chart-4/10 rounded-full flex items-center justify-center text-chart-4 font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">Dr. {doc.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.specialization}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{doc.appointmentCount}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.completedCount} completed
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
