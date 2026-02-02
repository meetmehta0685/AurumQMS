'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Clock, Users, Stethoscope, Heart, User, Bell, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/theme-toggle';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface QueueAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  token_number: number | null;
  doctor: {
    id: string;
    specialization: string;
    profile: {
      full_name: string;
    } | null;
  } | null;
}

interface QueuePosition {
  appointmentId: string;
  tokenNumber: number;
  currentToken: number;
  patientsAhead: number;
  estimatedWaitMinutes: number;
  doctorName: string;
  specialization: string;
}

export default function PatientQueuePage() {
  const { profile, isLoading } = useAuth();
  const supabase = createClient();
  const [loadingData, setLoadingData] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState<QueueAppointment[]>([]);
  const [queuePositions, setQueuePositions] = useState<QueuePosition[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQueueData = async () => {
    if (!profile?.id) return;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Fetch today's confirmed/pending appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          token_number,
          doctor:doctors(
            id,
            specialization,
            profile:profiles!doctors_profile_id_fkey(full_name)
          )
        `)
        .eq('patient_id', profile.id)
        .eq('appointment_date', today)
        .in('status', ['pending', 'confirmed'])
        .order('appointment_time', { ascending: true });

      // Transform the data
      const transformedAppointments = (appointments || []).map((apt: any) => ({
        ...apt,
        doctor: Array.isArray(apt.doctor) ? {
          ...apt.doctor[0],
          profile: Array.isArray(apt.doctor[0]?.profile) ? apt.doctor[0].profile[0] : apt.doctor[0]?.profile
        } : {
          ...apt.doctor,
          profile: Array.isArray(apt.doctor?.profile) ? apt.doctor.profile[0] : apt.doctor?.profile
        },
      }));

      setTodayAppointments(transformedAppointments);

      // Calculate queue positions for each appointment
      const positions: QueuePosition[] = [];
      
      for (const apt of transformedAppointments) {
        if (apt.token_number && apt.doctor?.id) {
          // Get all appointments for this doctor today
          const { data: doctorQueue } = await supabase
            .from('appointments')
            .select('id, token_number, status')
            .eq('doctor_id', apt.doctor.id)
            .eq('appointment_date', today)
            .in('status', ['pending', 'confirmed', 'completed'])
            .order('token_number', { ascending: true });

          if (doctorQueue) {
            // Find current token (last completed or first pending)
            const completedTokens = doctorQueue.filter(a => a.status === 'completed');
            const currentToken = completedTokens.length > 0 
              ? Math.max(...completedTokens.map(a => a.token_number || 0))
              : 0;

            // Count patients ahead
            const patientsAhead = doctorQueue.filter(
              a => (a.token_number || 0) > currentToken && 
                   (a.token_number || 0) < (apt.token_number || 0) &&
                   a.status !== 'completed'
            ).length;

            // Estimate wait time (assuming 15 min per patient average)
            const estimatedWaitMinutes = patientsAhead * 15;

            positions.push({
              appointmentId: apt.id,
              tokenNumber: apt.token_number,
              currentToken: currentToken,
              patientsAhead: patientsAhead,
              estimatedWaitMinutes: estimatedWaitMinutes,
              doctorName: apt.doctor?.profile?.full_name || 'Unknown',
              specialization: apt.doctor?.specialization || '',
            });
          }
        }
      }

      setQueuePositions(positions);
    } catch (error) {
      console.error('Error fetching queue data:', error);
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchQueueData();
    }
  }, [profile, supabase]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (profile && !refreshing) {
        fetchQueueData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [profile, refreshing]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchQueueData();
  };

  if (isLoading || loadingData) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <Skeleton className="h-10 w-48" />
          </div>
        </header>
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/patient" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                  <Heart className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl hidden sm:inline">HealthCare</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={refreshing}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-2 rounded-full">
                <User className="w-4 h-4" />
                <span>{profile?.full_name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Page Title */}
        <div className="mb-6">
          <Link href="/patient" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground">
            Queue Status
          </h1>
          <p className="text-muted-foreground mt-1">Track your position in today's queue</p>
        </div>

        {todayAppointments.length === 0 ? (
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No appointments today</h3>
              <p className="text-muted-foreground mb-6">You don't have any appointments scheduled for today</p>
              <Link href="/patient/appointments">
                <Button className="bg-primary hover:bg-primary/90">
                  Book an Appointment
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {todayAppointments.map((apt) => {
              const position = queuePositions.find(p => p.appointmentId === apt.id);
              
              return (
                <Card key={apt.id} className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-accent border-b border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                          <Stethoscope className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Dr. {apt.doctor?.profile?.full_name}</CardTitle>
                          <CardDescription>{apt.doctor?.specialization}</CardDescription>
                        </div>
                      </div>
                      <Badge 
                        className={`${
                          apt.status === 'confirmed' 
                            ? 'bg-chart-1/10 text-chart-1' 
                            : 'bg-chart-3/10 text-chart-3'
                        }`}
                      >
                        {apt.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {position ? (
                      <div className="space-y-6">
                        {/* Token Display */}
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-2">Your Token Number</p>
                          <div className="inline-flex items-center justify-center w-24 h-24 bg-primary rounded-full shadow-xl">
                            <span className="text-4xl font-bold text-primary-foreground">#{position.tokenNumber}</span>
                          </div>
                        </div>

                        {/* Queue Info Grid */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-chart-4/10 rounded-xl">
                            <p className="text-2xl font-bold text-chart-4">#{position.currentToken}</p>
                            <p className="text-xs text-chart-4/70 mt-1">Current Token</p>
                          </div>
                          <div className="text-center p-4 bg-chart-3/10 rounded-xl">
                            <p className="text-2xl font-bold text-chart-3">{position.patientsAhead}</p>
                            <p className="text-xs text-chart-3/70 mt-1">Patients Ahead</p>
                          </div>
                          <div className="text-center p-4 bg-chart-1/10 rounded-xl">
                            <p className="text-2xl font-bold text-chart-1">~{position.estimatedWaitMinutes}</p>
                            <p className="text-xs text-chart-1/70 mt-1">Minutes Wait</p>
                          </div>
                        </div>

                        {/* Status Message */}
                        {position.patientsAhead === 0 ? (
                          <div className="p-4 bg-chart-1/10 rounded-xl border border-chart-1/20 text-center">
                            <p className="text-chart-1 font-semibold">🎉 You're next! Please proceed to the doctor's cabin.</p>
                          </div>
                        ) : position.patientsAhead <= 2 ? (
                          <div className="p-4 bg-chart-3/10 rounded-xl border border-chart-3/20 text-center">
                            <p className="text-chart-3 font-semibold">⏳ Almost your turn! Please be ready.</p>
                          </div>
                        ) : (
                          <div className="p-4 bg-accent rounded-xl border border-border text-center">
                            <p className="text-accent-foreground">Please wait in the waiting area. We'll call your token soon.</p>
                          </div>
                        )}

                        {/* Appointment Time */}
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">Scheduled for {apt.appointment_time}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">Queue information not available</p>
                        <div className="flex items-center justify-center gap-2 text-muted-foreground mt-2">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">Scheduled for {apt.appointment_time}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {/* Auto-refresh notice */}
            <p className="text-center text-sm text-muted-foreground">
              Queue status refreshes automatically every 30 seconds
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
