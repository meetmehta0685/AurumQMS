'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Users, Building2, Calendar, BarChart3, LogOut, Stethoscope, Clock, TrendingUp, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/theme-toggle';
import { useEffect, useState } from 'react';
import { NotificationBell } from '@/components/notifications/NotificationBell';

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
  const router = useRouter();
  const supabase = createClient();
  const [stats, setStats] = useState<AdminStats>({
    totalDoctors: 0,
    totalPatients: 0,
    totalDepartments: 0,
    todayAppointments: 0,
    completedToday: 0,
    pendingToday: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];

        // Fetch counts in parallel
        const [doctorsRes, patientsRes, departmentsRes, appointmentsRes] = await Promise.all([
          supabase.from('doctors').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
          supabase.from('departments').select('*', { count: 'exact', head: true }),
          supabase
            .from('appointments')
            .select(`
              id,
              appointment_date,
              appointment_time,
              status,
              patient:profiles!appointments_patient_id_fkey(full_name),
              doctor:doctors(
                specialization,
                profile:profiles!doctors_profile_id_fkey(full_name)
              )
            `)
            .eq('appointment_date', today)
            .order('appointment_time', { ascending: true }),
        ]);

        const appointments = appointmentsRes.data || [];
        const completedToday = appointments.filter(a => a.status === 'completed').length;
        const pendingToday = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length;

        setStats({
          totalDoctors: doctorsRes.count || 0,
          totalPatients: patientsRes.count || 0,
          totalDepartments: departmentsRes.count || 0,
          todayAppointments: appointments.length,
          completedToday,
          pendingToday,
        });

        // Map the appointments to the correct format
        const mappedAppointments: RecentAppointment[] = appointments.slice(0, 5).map((apt: any) => ({
          id: apt.id,
          appointment_date: apt.appointment_date,
          appointment_time: apt.appointment_time,
          status: apt.status,
          patient: Array.isArray(apt.patient) ? apt.patient[0] : apt.patient,
          doctor: Array.isArray(apt.doctor) ? {
            ...apt.doctor[0],
            profile: Array.isArray(apt.doctor[0]?.profile) ? apt.doctor[0].profile[0] : apt.doctor[0]?.profile
          } : apt.doctor,
        }));

        setRecentAppointments(mappedAppointments);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchAdminData();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          <Skeleton className="h-12 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              {error ? error : 'Unable to load your profile. Please try logging in again.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={logout} className="w-full">
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-card/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Hospital Admin</h1>
              <p className="text-muted-foreground text-sm">{profile.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell userRole="admin" userId={profile.id} />
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-2 rounded-full">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-semibold text-sm">{profile.full_name?.charAt(0)}</span>
              </div>
              <span className="font-medium">{profile.full_name}</span>
            </div>
            <Button onClick={logout} variant="outline" size="icon" className="rounded-xl border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-chart-4" />
                Total Doctors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-4">{loadingData ? '...' : stats.totalDoctors}</div>
              <p className="text-sm text-muted-foreground mt-1">Active doctors</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-chart-1" />
                Total Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-1">{loadingData ? '...' : stats.totalPatients}</div>
              <p className="text-sm text-muted-foreground mt-1">Registered users</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-chart-3" />
                Departments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-3">{loadingData ? '...' : stats.totalDepartments}</div>
              <p className="text-sm text-muted-foreground mt-1">Available departments</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-chart-2" />
                Today's Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-2">{loadingData ? '...' : stats.todayAppointments}</div>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-xs">{stats.completedToday} done</Badge>
                <Badge variant="secondary" className="text-xs">{stats.pendingToday} pending</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Appointments */}
        {recentAppointments.length > 0 && (
          <Card className="mb-8 border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Today's Activity
              </CardTitle>
              <CardDescription>Latest appointments for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-chart-2/10 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-chart-2" />
                      </div>
                      <div>
                        <p className="font-medium">{apt.patient?.full_name || 'Unknown Patient'}</p>
                        <p className="text-sm text-muted-foreground">
                          Dr. {apt.doctor?.profile?.full_name} - {apt.doctor?.specialization}
                        </p>
                        <p className="text-sm text-muted-foreground/50">{apt.appointment_time}</p>
                      </div>
                    </div>
                    <Badge variant={
                      apt.status === 'completed' ? 'default' :
                      apt.status === 'confirmed' ? 'secondary' :
                      apt.status === 'cancelled' ? 'destructive' : 'outline'
                    }>
                      {apt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 cursor-pointer group">
            <Link href="/admin/doctors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="group-hover:text-chart-4 transition-colors">Manage Doctors</CardTitle>
                    <CardDescription>Add, edit, or remove doctors from the system</CardDescription>
                  </div>
                  <div className="w-12 h-12 bg-chart-4/10 rounded-xl flex items-center justify-center group-hover:bg-chart-4/20 transition-colors">
                    <Users className="w-6 h-6 text-chart-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-chart-4 hover:bg-chart-4/90" asChild>
                  <span>Manage Doctors</span>
                </Button>
              </CardContent>
            </Link>
          </Card>

          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 cursor-pointer group">
            <Link href="/admin/departments">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="group-hover:text-chart-1 transition-colors">Manage Departments</CardTitle>
                    <CardDescription>Create and organize hospital departments</CardDescription>
                  </div>
                  <div className="w-12 h-12 bg-chart-1/10 rounded-xl flex items-center justify-center group-hover:bg-chart-1/20 transition-colors">
                    <Building2 className="w-6 h-6 text-chart-1" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-chart-1 hover:bg-chart-1/90" asChild>
                  <span>Manage Departments</span>
                </Button>
              </CardContent>
            </Link>
          </Card>

          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 cursor-pointer group">
            <Link href="/admin/appointments">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="group-hover:text-chart-3 transition-colors">View Appointments</CardTitle>
                    <CardDescription>Monitor all appointments across the hospital</CardDescription>
                  </div>
                  <div className="w-12 h-12 bg-chart-3/10 rounded-xl flex items-center justify-center group-hover:bg-chart-3/20 transition-colors">
                    <Calendar className="w-6 h-6 text-chart-3" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-chart-3 hover:bg-chart-3/90" asChild>
                  <span>View Appointments</span>
                </Button>
              </CardContent>
            </Link>
          </Card>

          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 cursor-pointer group">
            <Link href="/admin/reports">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="group-hover:text-chart-2 transition-colors">Reports & Analytics</CardTitle>
                    <CardDescription>Generate system reports and view analytics</CardDescription>
                  </div>
                  <div className="w-12 h-12 bg-chart-2/10 rounded-xl flex items-center justify-center group-hover:bg-chart-2/20 transition-colors">
                    <BarChart3 className="w-6 h-6 text-chart-2" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-chart-2 hover:bg-chart-2/90" asChild>
                  <span>View Reports</span>
                </Button>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
