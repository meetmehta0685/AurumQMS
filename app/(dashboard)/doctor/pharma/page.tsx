'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pill } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface DoctorAppointment {
  id: string;
  patient_id: string;
  patient: { full_name: string } | null;
}

interface PatientProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
}

interface DispenseItem {
  id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  dispense_status: string;
  patient: { full_name: string } | null;
}

export default function DoctorPharmaPage() {
  const { profile, isLoading } = useAuth();
  const supabase = createClient();

  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [dispenses, setDispenses] = useState<DispenseItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  const [appointmentId, setAppointmentId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');

  const selectedPatient = patients.find((item) => item.id === patientId) || null;

  const fetchData = async (docId: string) => {
    const today = new Date().toISOString().split('T')[0];

    const [appointmentsRes, dispensesRes, patientsRes] = await Promise.all([
      supabase
        .from('appointments')
        .select('id, patient_id, patient:profiles!appointments_patient_id_fkey(full_name)')
        .eq('doctor_id', docId)
        .eq('appointment_date', today)
        .order('appointment_time', { ascending: true }),
      supabase
        .from('pharmacy_dispenses')
        .select('id, medicine_name, dosage, frequency, duration, quantity, dispense_status, patient:profiles!pharmacy_dispenses_patient_id_fkey(full_name)')
        .eq('doctor_id', docId)
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .eq('role', 'patient')
        .order('full_name', { ascending: true }),
    ]);

    setAppointments((appointmentsRes.data || []).map((apt: any) => ({
      id: apt.id,
      patient_id: apt.patient_id,
      patient: Array.isArray(apt.patient) ? apt.patient[0] : apt.patient,
    })));

    setDispenses((dispensesRes.data || []).map((item: any) => ({
      id: item.id,
      medicine_name: item.medicine_name,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      quantity: item.quantity,
      dispense_status: item.dispense_status,
      patient: Array.isArray(item.patient) ? item.patient[0] : item.patient,
    })));
    setPatients(patientsRes.data || []);
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

  const addDispense = async () => {
    if (!doctorId || !patientId || !medicineName || !dosage || !frequency || !duration) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('pharmacy_dispenses').insert({
        patient_id: patientId,
        doctor_id: doctorId,
        medicine_name: medicineName,
        dosage,
        frequency,
        duration,
        quantity: Number(quantity),
        notes: notes || null,
      });

      if (error) throw error;

      setAppointmentId('');
      setPatientId('');
      setMedicineName('');
      setDosage('');
      setFrequency('');
      setDuration('');
      setQuantity('1');
      setNotes('');
      toast.success('Medicine added to pharmacy list');
      await fetchData(doctorId);
    } catch (error) {
      console.error(error);
      toast.error('Failed to add medicine');
    } finally {
      setSaving(false);
    }
  };

  const markDispensed = async (id: string) => {
    if (!doctorId) return;

    const { error } = await supabase
      .from('pharmacy_dispenses')
      .update({ dispense_status: 'dispensed', dispensed_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update medicine status');
      return;
    }

    toast.success('Marked as dispensed');
    await fetchData(doctorId);
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
            <h1 className="text-2xl font-bold">Pharmacy</h1>
            <p className="text-muted-foreground">Manage medicines and dispense tracking</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Pill className="w-5 h-5" /> Add Medicine</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>{patient.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={appointmentId || 'none'} onValueChange={(value) => setAppointmentId(value === 'none' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Link appointment (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No appointment</SelectItem>
                {appointments.map((apt) => (
                  <SelectItem key={apt.id} value={apt.id}>{apt.patient?.full_name || 'Unknown patient'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPatient && (
              <div className="md:col-span-2 p-3 rounded-lg border border-border bg-muted/40">
                <p className="font-medium">Patient Details</p>
                <p className="text-sm text-muted-foreground">Name: {selectedPatient.full_name}</p>
                <p className="text-sm text-muted-foreground">Email: {selectedPatient.email}</p>
                <p className="text-sm text-muted-foreground">Phone: {selectedPatient.phone || 'N/A'}</p>
              </div>
            )}
            <Input placeholder="Medicine name" value={medicineName} onChange={(e) => setMedicineName(e.target.value)} />
            <Input placeholder="Dosage" value={dosage} onChange={(e) => setDosage(e.target.value)} />
            <Input placeholder="Frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
            <Input placeholder="Duration" value={duration} onChange={(e) => setDuration(e.target.value)} />
            <Input type="number" min={1} placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            <Textarea className="md:col-span-2" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Button className="md:col-span-2" onClick={addDispense} disabled={saving}>Add to Pharmacy</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dispense List</CardTitle>
            <CardDescription>Track what has been dispensed to patients</CardDescription>
          </CardHeader>
          <CardContent>
            {dispenses.length === 0 ? (
              <p className="text-muted-foreground">No medicine entries yet.</p>
            ) : (
              <div className="space-y-3">
                {dispenses.map((item) => (
                  <div key={item.id} className="p-3 border border-border rounded-lg flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{item.patient?.full_name || 'Unknown'} • {item.medicine_name}</p>
                      <p className="text-sm text-muted-foreground">{item.dosage} • {item.frequency} • {item.duration} • Qty {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.dispense_status === 'dispensed' ? 'default' : 'outline'}>{item.dispense_status}</Badge>
                      {item.dispense_status !== 'dispensed' && (
                        <Button variant="outline" size="sm" onClick={() => markDispensed(item.id)}>Mark Dispensed</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
