'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { ArrowLeft, FlaskConical, FileText, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface LabOrder {
  id: string;
  patient_id: string;
  doctor_id: string;
  test_name: string;
  status: string;
  instructions: string | null;
  patient: { full_name: string } | null;
  doctor: { profile: { full_name: string } | null } | null;
}

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

export default function LabPortalPage() {
  const { profile, isLoading, logout } = useAuth();
  const supabase = createClient();

  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [testName, setTestName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [savingOrder, setSavingOrder] = useState(false);

  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [reportText, setReportText] = useState('');
  const [reportUrl, setReportUrl] = useState('');
  const [savingReport, setSavingReport] = useState(false);

  const selectedPatient = patients.find((p) => p.id === patientId) || null;

  const fetchData = async () => {
    try {
      const [ordersRes, patientsRes, doctorsRes] = await Promise.all([
        supabase
          .from('lab_test_orders')
          .select(`
            id,
            patient_id,
            doctor_id,
            test_name,
            status,
            instructions,
            patient:profiles!lab_test_orders_patient_id_fkey(full_name),
            doctor:doctors!lab_test_orders_doctor_id_fkey(profile:profiles!doctors_profile_id_fkey(full_name))
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('id, full_name, email, phone')
          .eq('role', 'patient')
          .order('full_name', { ascending: true }),
        supabase
          .from('doctors')
          .select('id, profile:profiles!doctors_profile_id_fkey(full_name)')
          .order('created_at', { ascending: true }),
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (patientsRes.error) throw patientsRes.error;
      if (doctorsRes.error) throw doctorsRes.error;

      const mappedOrders: LabOrder[] = (ordersRes.data || []).map((item: any) => {
        const doctor = Array.isArray(item.doctor) ? item.doctor[0] : item.doctor;
        const doctorProfile = Array.isArray(doctor?.profile) ? doctor.profile[0] : doctor?.profile;
        return {
          id: item.id,
          patient_id: item.patient_id,
          doctor_id: item.doctor_id,
          test_name: item.test_name,
          status: item.status,
          instructions: item.instructions,
          patient: Array.isArray(item.patient) ? item.patient[0] : item.patient,
          doctor: doctor ? { ...doctor, profile: doctorProfile } : null,
        };
      });

      const mappedDoctors: DoctorProfile[] = (doctorsRes.data || []).map((item: any) => ({
        id: item.id,
        profile: Array.isArray(item.profile) ? item.profile[0] : item.profile,
      }));

      setOrders(mappedOrders);
      setPatients(patientsRes.data || []);
      setDoctors(mappedDoctors);
    } catch (error: any) {
      console.error('Lab portal fetch error:', error);
      toast.error(error?.message || 'Failed to fetch lab data. Check Supabase schema/policies.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [supabase]);

  const createOrder = async () => {
    if (!patientId || !doctorId || !testName.trim()) return;

    setSavingOrder(true);
    try {
      const { error } = await supabase.from('lab_test_orders').insert({
        patient_id: patientId,
        doctor_id: doctorId,
        test_name: testName,
        instructions: instructions || null,
        status: 'ordered',
      });

      if (error) throw error;

      setPatientId('');
      setDoctorId('');
      setTestName('');
      setInstructions('');
      toast.success('Lab order created');
      await fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create lab order');
    } finally {
      setSavingOrder(false);
    }
  };

  const uploadReport = async () => {
    if (!selectedOrderId || !reportTitle.trim()) return;

    const order = orders.find((item) => item.id === selectedOrderId);
    if (!order) return;

    setSavingReport(true);
    try {
      const { error } = await supabase.from('lab_reports').insert({
        order_id: selectedOrderId,
        patient_id: order.patient_id,
        doctor_id: order.doctor_id,
        report_title: reportTitle,
        report_text: reportText || null,
        report_url: reportUrl || null,
      });

      if (error) throw error;

      await supabase.from('lab_test_orders').update({ status: 'reported' }).eq('id', selectedOrderId);

      setSelectedOrderId('');
      setReportTitle('');
      setReportText('');
      setReportUrl('');
      toast.success('Lab report uploaded');
      await fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload report');
    } finally {
      setSavingReport(false);
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

  if (!profile || profile.role !== 'lab') {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>Only lab users can access this portal.</CardDescription>
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
              <h1 className="text-2xl font-bold">Laboratory Portal</h1>
              <p className="text-muted-foreground">Upload reports for specific patients and doctors</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout}><LogOut className="w-4 h-4 mr-2" />Logout</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FlaskConical className="w-5 h-5" /> Create Lab Order</CardTitle>
            <CardDescription>Enter patient and doctor details for new test order</CardDescription>
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
              <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
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
            <Input value={testName} onChange={(e) => setTestName(e.target.value)} placeholder="Test name" />
            <Textarea className="md:col-span-2" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Instructions" />
            <Button className="md:col-span-2" onClick={createOrder} disabled={savingOrder}>Create Order</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Upload Report</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
              <SelectTrigger><SelectValue placeholder="Select order" /></SelectTrigger>
              <SelectContent>
                {orders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>{order.patient?.full_name || 'Unknown'} • {order.test_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} placeholder="Report title" />
            <Input value={reportUrl} onChange={(e) => setReportUrl(e.target.value)} placeholder="Report URL (optional)" />
            <Textarea className="md:col-span-2" value={reportText} onChange={(e) => setReportText(e.target.value)} placeholder="Report result/details" />
            <Button className="md:col-span-2" onClick={uploadReport} disabled={savingReport}>Upload Report</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Lab Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-muted-foreground">No lab orders found.</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="p-3 border border-border rounded-lg flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{order.patient?.full_name || 'Unknown'} • {order.test_name}</p>
                      <p className="text-sm text-muted-foreground">Dr. {order.doctor?.profile?.full_name || 'Unknown'}</p>
                    </div>
                    <Badge variant={order.status === 'reported' ? 'default' : 'outline'}>{order.status}</Badge>
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
