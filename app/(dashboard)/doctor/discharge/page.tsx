'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface CompletedAppointment {
  id: string;
  patient_id: string;
  patient: { full_name: string } | null;
  appointment_date: string;
}

interface DischargeSummary {
  id: string;
  appointment_id: string;
  summary_text: string | null;
  discharge_status: 'draft' | 'discharged';
}

export default function DoctorDischargePage() {
  const { profile, isLoading } = useAuth();
  const supabase = createClient();

  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<CompletedAppointment[]>([]);
  const [summaries, setSummaries] = useState<DischargeSummary[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedSummary = useMemo(
    () => summaries.find((item) => item.appointment_id === selectedAppointmentId) || null,
    [summaries, selectedAppointmentId]
  );

  const fetchData = async (docId: string) => {
    const [appointmentsRes, summariesRes] = await Promise.all([
      supabase
        .from('appointments')
        .select('id, patient_id, appointment_date, patient:profiles!appointments_patient_id_fkey(full_name)')
        .eq('doctor_id', docId)
        .eq('status', 'completed')
        .order('appointment_date', { ascending: false }),
      supabase
        .from('discharge_summaries')
        .select('id, appointment_id, summary_text, discharge_status')
        .eq('doctor_id', docId)
        .order('created_at', { ascending: false }),
    ]);

    setAppointments((appointmentsRes.data || []).map((apt: any) => ({
      id: apt.id,
      patient_id: apt.patient_id,
      appointment_date: apt.appointment_date,
      patient: Array.isArray(apt.patient) ? apt.patient[0] : apt.patient,
    })));

    setSummaries(summariesRes.data || []);
  };

  useEffect(() => {
    const init = async () => {
      if (!profile?.user_id) return;

      try {
        const { data: doctor } = await supabase.from('doctors').select('id').eq('user_id', profile.user_id).single();
        if (!doctor) return;

        setDoctorId(doctor.id);
        await fetchData(doctor.id);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingData(false);
      }
    };

    if (profile) {
      init();
    }
  }, [profile, supabase]);

  useEffect(() => {
    setSummaryText(selectedSummary?.summary_text || '');
  }, [selectedSummary?.summary_text]);

  const saveSummary = async (status: 'draft' | 'discharged') => {
    if (!doctorId || !selectedAppointmentId || !summaryText.trim()) return;

    const appointment = appointments.find((item) => item.id === selectedAppointmentId);
    if (!appointment) return;

    setSaving(true);
    try {
      const payload = {
        appointment_id: selectedAppointmentId,
        patient_id: appointment.patient_id,
        doctor_id: doctorId,
        summary_text: summaryText,
        discharge_status: status,
        discharged_at: status === 'discharged' ? new Date().toISOString() : null,
      };

      const { error } = await supabase.from('discharge_summaries').upsert(payload, { onConflict: 'appointment_id' });
      if (error) throw error;

      toast.success(status === 'discharged' ? 'Patient discharged and summary saved' : 'Draft saved');
      await fetchData(doctorId);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save discharge summary');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loadingData) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-5xl mx-auto space-y-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/doctor">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Discharge Summary</h1>
            <p className="text-muted-foreground">Generate final patient discharge document</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Completed Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedAppointmentId} onValueChange={setSelectedAppointmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select patient visit" />
              </SelectTrigger>
              <SelectContent>
                {appointments.map((apt) => (
                  <SelectItem key={apt.id} value={apt.id}>{apt.patient?.full_name || 'Unknown'} • {apt.appointment_date}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Summary Notes</CardTitle>
                <CardDescription>Include diagnosis, follow-up, and care instructions</CardDescription>
              </div>
              {selectedSummary && <Badge variant={selectedSummary.discharge_status === 'discharged' ? 'default' : 'outline'}>{selectedSummary.discharge_status}</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={summaryText}
              onChange={(e) => setSummaryText(e.target.value)}
              placeholder="Write discharge summary..."
              className="min-h-40"
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => saveSummary('draft')} disabled={saving}>Save Draft</Button>
              <Button onClick={() => saveSummary('discharged')} disabled={saving}>Discharge Patient</Button>
              {selectedAppointmentId && (
                <Button variant="outline" asChild>
                  <a href={`/api/discharge/${selectedAppointmentId}`} target="_blank" rel="noreferrer">
                    <FileDown className="w-4 h-4 mr-2" />
                    Download PDF
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
