'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { ArrowLeft, LogOut, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface PatientProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
}

interface DoctorProfile {
  id: string;
  profile: { full_name: string } | null;
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

export default function PharmaPortalPage() {
  const { profile, isLoading, logout } = useAuth();
  const supabase = createClient();

  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [items, setItems] = useState<DispenseItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [status, setStatus] = useState<'pending' | 'dispensed' | 'cancelled'>('dispensed');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedPatient = patients.find((patient) => patient.id === patientId) || null;

  const fetchData = async () => {
    try {
      const [patientsRes, doctorsRes, itemsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, email, phone')
          .eq('role', 'patient')
          .order('full_name', { ascending: true }),
        supabase
          .from('doctors')
          .select('id, profile:profiles!doctors_profile_id_fkey(full_name)')
          .order('created_at', { ascending: true }),
        supabase
          .from('pharmacy_dispenses')
          .select('id, medicine_name, dosage, frequency, duration, quantity, dispense_status, patient:profiles!pharmacy_dispenses_patient_id_fkey(full_name)')
          .order('created_at', { ascending: false }),
      ]);

      if (patientsRes.error) throw patientsRes.error;
      if (doctorsRes.error) throw doctorsRes.error;
      if (itemsRes.error) throw itemsRes.error;

      const mappedDoctors: DoctorProfile[] = (doctorsRes.data || []).map((item: any) => ({
        id: item.id,
        profile: Array.isArray(item.profile) ? item.profile[0] : item.profile,
      }));

      const mappedItems: DispenseItem[] = (itemsRes.data || []).map((item: any) => ({
        id: item.id,
        medicine_name: item.medicine_name,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        quantity: item.quantity,
        dispense_status: item.dispense_status,
        patient: Array.isArray(item.patient) ? item.patient[0] : item.patient,
      }));

      setPatients(patientsRes.data || []);
      setDoctors(mappedDoctors);
      setItems(mappedItems);
    } catch (error: any) {
      console.error('Pharma portal fetch error:', error);
      toast.error(error?.message || 'Failed to fetch pharmacy data. Check Supabase schema/policies.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [supabase]);

  const createDispense = async () => {
    if (!patientId || !doctorId || !medicineName || !dosage || !frequency || !duration) return;

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
        dispense_status: status,
        dispensed_at: status === 'dispensed' ? new Date().toISOString() : null,
        notes: notes || null,
      });

      if (error) throw error;

      setPatientId('');
      setDoctorId('');
      setMedicineName('');
      setDosage('');
      setFrequency('');
      setDuration('');
      setQuantity('1');
      setStatus('dispensed');
      setNotes('');
      toast.success('Pharmacy dispense saved');
      await fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save pharmacy dispense');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loadingData) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  if (!profile || profile.role !== 'pharma') {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>Only pharmacy users can access this portal.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={logout} className="w-full">Return to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Pharmacy Portal</h1>
              <p className="text-muted-foreground">Record medicines dispensed to patients</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout}><LogOut className="w-4 h-4 mr-2" />Logout</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Pill className="w-5 h-5" /> Record Dispense</CardTitle>
            <CardDescription>Enter patient details and medicine dispatch information</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>{patient.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={doctorId} onValueChange={setDoctorId}>
              <SelectTrigger><SelectValue placeholder="Select prescribing doctor" /></SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>Dr. {doctor.profile?.full_name || 'Unknown'}</SelectItem>
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
            <Input value={medicineName} onChange={(e) => setMedicineName(e.target.value)} placeholder="Medicine name" />
            <Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="Dosage" />
            <Input value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="Frequency" />
            <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Duration" />
            <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantity" />
            <Select value={status} onValueChange={(value: 'pending' | 'dispensed' | 'cancelled') => setStatus(value)}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">pending</SelectItem>
                <SelectItem value="dispensed">dispensed</SelectItem>
                <SelectItem value="cancelled">cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Textarea className="md:col-span-2" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" />
            <Button className="md:col-span-2" onClick={createDispense} disabled={saving}>Save Dispense</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Dispenses</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-muted-foreground">No pharmacy dispenses found.</p>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="p-3 border border-border rounded-lg flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.patient?.full_name || 'Unknown'} • {item.medicine_name}</p>
                      <p className="text-sm text-muted-foreground">{item.dosage} • {item.frequency} • {item.duration} • Qty {item.quantity}</p>
                    </div>
                    <Badge variant={item.dispense_status === 'dispensed' ? 'default' : 'outline'}>{item.dispense_status}</Badge>
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
