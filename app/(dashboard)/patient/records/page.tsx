'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { ArrowLeft, FileText, Stethoscope, Calendar, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

interface MedicalRecord {
  id: string;
  diagnosis: string;
  notes: string | null;
  created_at: string;
  doctor: {
    specialization: string;
    profile: {
      full_name: string;
    } | null;
  } | null;
  appointment: {
    appointment_date: string;
    appointment_time: string;
  } | null;
}

interface Prescription {
  id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string | null;
}

export default function PatientRecordsPage() {
  const { profile, isLoading } = useAuth();
  const supabase = createClient();
  const [loadingData, setLoadingData] = useState(true);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

  useEffect(() => {
    const fetchRecords = async () => {
      if (!profile?.id) return;

      try {
        const { data } = await supabase
          .from('medical_records')
          .select(`
            id,
            diagnosis,
            notes,
            created_at,
            doctor:doctors(
              specialization,
              profile:profiles!doctors_profile_id_fkey(full_name)
            ),
            appointment:appointments(
              appointment_date,
              appointment_time
            )
          `)
          .eq('patient_id', profile.id)
          .order('created_at', { ascending: false });

        // Map the records to the correct format
        const mappedRecords: MedicalRecord[] = (data || []).map((rec: any) => ({
          id: rec.id,
          diagnosis: rec.diagnosis,
          notes: rec.notes,
          created_at: rec.created_at,
          doctor: Array.isArray(rec.doctor) ? {
            ...rec.doctor[0],
            profile: Array.isArray(rec.doctor[0]?.profile) ? rec.doctor[0].profile[0] : rec.doctor[0]?.profile
          } : rec.doctor,
          appointment: Array.isArray(rec.appointment) ? rec.appointment[0] : rec.appointment,
        }));

        setRecords(mappedRecords);
      } catch (error) {
        console.error('Error fetching records:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (profile) {
      fetchRecords();
    }
  }, [profile, supabase]);

  const viewRecordDetails = async (record: MedicalRecord) => {
    setSelectedRecord(record);
    setLoadingPrescriptions(true);

    try {
      const { data } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('medical_record_id', record.id);

      setPrescriptions(data || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  if (isLoading || loadingData) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/patient">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Medical Records</h1>
            <p className="text-muted-foreground">View your health history</p>
          </div>
        </div>

        {/* Records List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Medical History</CardTitle>
            <CardDescription>Records from all your appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground mb-2">No medical records yet</p>
                <p className="text-sm text-muted-foreground/70">
                  Your medical records will appear here after your appointments
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 bg-muted rounded-lg border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-chart-2/10 rounded-full flex items-center justify-center mt-1">
                          <FileText className="w-5 h-5 text-chart-2" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">
                            {record.diagnosis}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Stethoscope className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Dr. {record.doctor?.profile?.full_name || 'Unknown'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {record.doctor?.specialization}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {record.appointment?.appointment_date} at{' '}
                              {record.appointment?.appointment_time}
                            </span>
                          </div>
                          {record.notes && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {record.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewRecordDetails(record)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Record Details Dialog */}
        <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Medical Record Details</DialogTitle>
              <DialogDescription>
                {selectedRecord?.appointment?.appointment_date} at{' '}
                {selectedRecord?.appointment?.appointment_time}
              </DialogDescription>
            </DialogHeader>
            {selectedRecord && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Doctor</h4>
                  <p className="mt-1">
                    Dr. {selectedRecord.doctor?.profile?.full_name} -{' '}
                    {selectedRecord.doctor?.specialization}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Diagnosis</h4>
                  <p className="mt-1 p-3 bg-muted rounded-lg">
                    {selectedRecord.diagnosis}
                  </p>
                </div>

                {selectedRecord.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
                    <p className="mt-1 p-3 bg-muted rounded-lg text-sm">
                      {selectedRecord.notes}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Prescriptions</h4>
                  {loadingPrescriptions ? (
                    <p className="text-muted-foreground">Loading...</p>
                  ) : prescriptions.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No prescriptions for this visit</p>
                  ) : (
                    <div className="space-y-2">
                      {prescriptions.map((rx) => (
                        <div key={rx.id} className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                          <p className="font-medium text-primary">{rx.medicine_name}</p>
                          <div className="text-sm text-primary/80 mt-1">
                            <p>Dosage: {rx.dosage}</p>
                            <p>Frequency: {rx.frequency}</p>
                            <p>Duration: {rx.duration}</p>
                            {rx.notes && <p className="mt-1 text-primary/70">Note: {rx.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
