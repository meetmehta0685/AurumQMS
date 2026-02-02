'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Calendar, FileText, Users, LogOut, Clock, User, Stethoscope, Heart, ArrowRight, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/theme-toggle';
import { useEffect, useState } from 'react';
import { NotificationBell } from '@/components/notifications/NotificationBell';

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
  const router = useRouter();
  const supabase = createClient();
  const [stats, setStats] = useState<PatientStats>({ upcomingAppointments: 0, pastAppointments: 0, medicalRecords: 0 });
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!profile?.id) return;

      try {
        const today = new Date().toISOString().split('T')[0];

        // Fetch upcoming appointments
        const { data: upcoming } = await supabase
          .from('appointments')
          .select(`
            id,
            appointment_date,
            appointment_time,
            status,
            token_number,
            doctor:doctors(
              specialization,
              profile:profiles!doctors_profile_id_fkey(full_name)
            )
          `)
          .eq('patient_id', profile.id)
          .gte('appointment_date', today)
          .in('status', ['pending', 'confirmed'])
          .order('appointment_date', { ascending: true })
          .limit(5);

        // Fetch past appointments count
        const { count: pastCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', profile.id)
          .eq('status', 'completed');

        // Fetch medical records count
        const { count: recordsCount } = await supabase
          .from('medical_records')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', profile.id);

        setStats({
          upcomingAppointments: upcoming?.length || 0,
          pastAppointments: pastCount || 0,
          medicalRecords: recordsCount || 0,
        });

        // Map the appointments to the correct format
        const mappedAppointments: UpcomingAppointment[] = (upcoming || []).map((apt: any) => ({
          id: apt.id,
          appointment_date: apt.appointment_date,
          appointment_time: apt.appointment_time,
          status: apt.status,
          token_number: apt.token_number,
          doctor: Array.isArray(apt.doctor) ? {
            ...apt.doctor[0],
            profile: Array.isArray(apt.doctor[0]?.profile) ? apt.doctor[0].profile[0] : apt.doctor[0]?.profile
          } : apt.doctor,
        }));

        setUpcomingAppointments(mappedAppointments);
      } catch (error) {
        console.error('Error fetching patient data:', error);
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
        <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <Skeleton className="h-10 w-48" />
          </div>
        </header>
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-64" />
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
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-destructive rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-destructive-foreground" />
            </div>
            <CardTitle className="text-xl">Profile Not Found</CardTitle>
            <CardDescription className="text-base">
              {error ? error : 'Unable to load your profile. Please try logging in again.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={logout} className="w-full bg-primary hover:bg-primary/90">
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
            <Link href="/patient" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <Heart className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-xl text-foreground">HealthCare</span>
                <p className="text-xs text-muted-foreground">Patient Portal</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <NotificationBell userId={profile.id} userRole="patient" />
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-2 rounded-full">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold text-sm">{profile.full_name?.charAt(0)}</span>
                </div>
                <span className="font-medium">{profile.full_name}</span>
              </div>
              <Button onClick={logout} variant="outline" size="sm" className="gap-2 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors">
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
          <div className="flex items-center gap-2 text-primary mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-sm font-medium">Dashboard Overview</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Welcome back, {profile.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-2">Here&apos;s an overview of your healthcare journey</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
            <CardHeader className="pb-2 relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-muted-foreground">Upcoming</CardTitle>
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold text-primary">
                {loadingData ? '...' : stats.upcomingAppointments}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Scheduled appointments</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-chart-1/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
            <CardHeader className="pb-2 relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-muted-foreground">Completed</CardTitle>
                <div className="w-10 h-10 bg-chart-1 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold text-chart-1">
                {loadingData ? '...' : stats.pastAppointments}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Past appointments</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-chart-2/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
            <CardHeader className="pb-2 relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-muted-foreground">Records</CardTitle>
                <div className="w-10 h-10 bg-chart-2 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold text-chart-2">
                {loadingData ? '...' : stats.medicalRecords}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Medical records</p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments List */}
        {upcomingAppointments.length > 0 && (
          <Card className="mb-8 border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-muted border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
                    <CardDescription>Your scheduled consultations</CardDescription>
                  </div>
                </div>
                <Link href="/patient/appointments">
                  <Button variant="ghost" size="sm" className="gap-1 text-primary hover:text-primary hover:bg-primary/10">
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {upcomingAppointments.map((apt, index) => (
                  <div 
                    key={apt.id} 
                    className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                          <Stethoscope className="w-6 h-6 text-primary-foreground" />
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Dr. {apt.doctor?.profile?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-primary font-medium">{apt.doctor?.specialization}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                            <Calendar className="w-3 h-3" />
                            {apt.appointment_date}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            {apt.appointment_time}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      {apt.token_number && (
                        <div className="px-3 py-1 bg-primary rounded-full text-primary-foreground font-bold text-sm">
                          Token #{apt.token_number}
                        </div>
                      )}
                      <Badge 
                        className={`${
                          apt.status === 'confirmed' 
                            ? 'bg-chart-1/20 text-chart-1 hover:bg-chart-1/20' 
                            : 'bg-chart-3/20 text-chart-3 hover:bg-chart-3/20'
                        }`}
                      >
                        {apt.status === 'confirmed' ? '✓ Confirmed' : apt.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/patient/appointments">
            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden group hover:shadow-2xl transition-all duration-300 cursor-pointer h-full">
              <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors"></div>
              <CardHeader className="relative">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Calendar className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="mt-4 text-xl">Book Appointment</CardTitle>
                <CardDescription className="text-base">Schedule a consultation with a healthcare specialist</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="inline-flex items-center text-sm font-medium text-primary group-hover:text-primary">
                  Browse Doctors
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/patient/records">
            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden group hover:shadow-2xl transition-all duration-300 cursor-pointer h-full">
              <div className="absolute inset-0 bg-chart-2/5 group-hover:bg-chart-2/10 transition-colors"></div>
              <CardHeader className="relative">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 bg-chart-2 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <FileText className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-chart-2 group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="mt-4 text-xl">Medical Records</CardTitle>
                <CardDescription className="text-base">View your health history and prescriptions</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="inline-flex items-center text-sm font-medium text-chart-2 group-hover:text-chart-2">
                  View Records
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/patient/appointments">
            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden group hover:shadow-2xl transition-all duration-300 cursor-pointer h-full">
              <div className="absolute inset-0 bg-chart-1/5 group-hover:bg-chart-1/10 transition-colors"></div>
              <CardHeader className="relative">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 bg-chart-1 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Stethoscope className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-chart-1 group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="mt-4 text-xl">My Appointments</CardTitle>
                <CardDescription className="text-base">Manage your scheduled appointments</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="inline-flex items-center text-sm font-medium text-chart-1 group-hover:text-chart-1">
                  View Appointments
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/patient/queue">
            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden group hover:shadow-2xl transition-all duration-300 cursor-pointer h-full">
              <div className="absolute inset-0 bg-chart-3/5 group-hover:bg-chart-3/10 transition-colors"></div>
              <CardHeader className="relative">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 bg-chart-3 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-chart-3 group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="mt-4 text-xl">Queue Status</CardTitle>
                <CardDescription className="text-base">Check your position in the queue</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="inline-flex items-center text-sm font-medium text-chart-3 group-hover:text-chart-3">
                  Check Queue
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 py-6 border-t border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-2">
          <div className="flex flex-wrap justify-center items-center gap-2 text-sm text-muted-foreground">
            <a href="mailto:support@healthcare.com" className="hover:text-primary transition-colors">
              support@healthcare.com
            </a>
            <span className="text-muted-foreground/50">|</span>
            <a href="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <span className="text-muted-foreground/50">|</span>
            <a href="/terms" className="hover:text-primary transition-colors">
              Terms
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 HealthCare. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
