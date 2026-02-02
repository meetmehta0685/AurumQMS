'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Stethoscope, Calendar, Settings, LogOut, Clock, Users, CheckCircle, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/theme-toggle';
import { useEffect, useState } from 'react';
import type { Appointment, Token } from '@/types';
import { NotificationBell } from '@/components/notifications/NotificationBell';

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
  const router = useRouter();
  const supabase = createClient();
  const [stats, setStats] = useState<DoctorStats>({ todayAppointments: 0, patientsInQueue: 0, completedToday: 0 });
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!profile?.user_id) return;

      try {
        // Get doctor record
        const { data: doctor } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', profile.user_id)
          .single();

        if (!doctor) {
          setLoadingData(false);
          return;
        }

        setDoctorId(doctor.id);
        const today = new Date().toISOString().split('T')[0];

        // Fetch today's appointments
        const { data: appointments } = await supabase
          .from('appointments')
          .select(`
            id,
            appointment_time,
            status,
            token_number,
            patient:profiles!appointments_patient_id_fkey(full_name)
          `)
          .eq('doctor_id', doctor.id)
          .eq('appointment_date', today)
          .order('appointment_time', { ascending: true });

        if (appointments) {
          const todayAppts = appointments.length;
          const completed = appointments.filter(a => a.status === 'completed').length;
          const waiting = appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length;

          setStats({
            todayAppointments: todayAppts,
            patientsInQueue: waiting,
            completedToday: completed,
          });

          // Map the appointments to the correct format
          const mappedAppointments: UpcomingAppointment[] = appointments.slice(0, 5).map((apt: any) => ({
            id: apt.id,
            appointment_time: apt.appointment_time,
            status: apt.status,
            token_number: apt.token_number,
            patient: Array.isArray(apt.patient) ? apt.patient[0] : apt.patient,
          }));

          setUpcomingAppointments(mappedAppointments);
        }
      } catch (error) {
        console.error('Error fetching doctor data:', error);
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
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          <Skeleton className="h-12 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
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
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/doctor" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <Heart className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-xl text-foreground">HealthCare</span>
                <p className="text-xs text-muted-foreground">Doctor Portal</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <NotificationBell userId={profile.user_id} userRole="doctor" />
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-2 rounded-full">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold text-sm">{profile.full_name?.charAt(0)}</span>
                </div>
                <span className="font-medium">Dr. {profile.full_name}</span>
              </div>
              <Button onClick={logout} variant="outline" size="sm" className="gap-2 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Welcome, Dr. {profile.full_name}!</h1>
          <p className="text-muted-foreground mt-1">Here's your schedule for today</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Today's Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{loadingData ? '...' : stats.todayAppointments}</div>
              <p className="text-sm text-muted-foreground mt-1">Scheduled for today</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-chart-4" />
                Patients in Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-4">{loadingData ? '...' : stats.patientsInQueue}</div>
              <p className="text-sm text-muted-foreground mt-1">Waiting to be called</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-chart-2" />
                Completed Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-2">{loadingData ? '...' : stats.completedToday}</div>
              <p className="text-sm text-muted-foreground mt-1">Appointments finished</p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <Card className="mb-8 border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Today's Queue</CardTitle>
              <CardDescription>Patients scheduled for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-chart-1/10 rounded-full flex items-center justify-center">
                        <span className="text-chart-1 font-semibold">
                          {apt.token_number || '#'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{apt.patient?.full_name || 'Unknown Patient'}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {apt.appointment_time}
                        </p>
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

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 cursor-pointer group">
            <Link href="/doctor/queue">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="group-hover:text-primary transition-colors">Token Queue</CardTitle>
                    <CardDescription>Manage your patient queue and token system</CardDescription>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Stethoscope className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                  <span>Go to Queue</span>
                </Button>
              </CardContent>
            </Link>
          </Card>

          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 cursor-pointer group">
            <Link href="/doctor/schedule">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="group-hover:text-chart-4 transition-colors">My Schedule</CardTitle>
                    <CardDescription>Manage your availability and time slots</CardDescription>
                  </div>
                  <div className="w-12 h-12 bg-chart-4/10 rounded-xl flex items-center justify-center group-hover:bg-chart-4/20 transition-colors">
                    <Calendar className="w-6 h-6 text-chart-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-chart-4 hover:bg-chart-4/90" asChild>
                  <span>View Schedule</span>
                </Button>
              </CardContent>
            </Link>
          </Card>

          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 cursor-pointer group">
            <Link href="/doctor/queue">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="group-hover:text-chart-3 transition-colors">Appointments</CardTitle>
                    <CardDescription>View your daily appointment list</CardDescription>
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
            <Link href="/doctor/schedule">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="group-hover:text-chart-2 transition-colors">Settings</CardTitle>
                    <CardDescription>Configure your consultation preferences</CardDescription>
                  </div>
                  <div className="w-12 h-12 bg-chart-2/10 rounded-xl flex items-center justify-center group-hover:bg-chart-2/20 transition-colors">
                    <Settings className="w-6 h-6 text-chart-2" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-chart-2 hover:bg-chart-2/90" asChild>
                  <span>Configure</span>
                </Button>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
