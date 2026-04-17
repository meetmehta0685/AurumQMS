'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FlaskConical, FileText } from 'lucide-react';
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

interface LabOrder {
  id: string;
  patient_id: string;
  test_name: string;
  instructions: string | null;
  status: string;
  created_at: string;
  patient: { full_name: string } | null;
}

export default function DoctorLaboratoryPage() {
  const { profile, isLoading } = useAuth();
  const supabase = createClient();

  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);

  const [appointmentId, setAppointmentId] = useState('');
  const [testName, setTestName] = useState('');
  const [instructions, setInstructions] = useState('');

  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [reportText, setReportText] = useState('');

  const fetchData = async (docId: string) => {
    const today = new Date().toISOString().split('T')[0];

    const [appointmentsRes, ordersRes] = await Promise.all([
      supabase
        .from('appointments')
        .select('id, patient_id, patient:profiles!appointments_patient_id_fkey(full_name)')
        .eq('doctor_id', docId)
        .eq('appointment_date', today)
        .order('appointment_time', { ascending: true }),
      supabase
        .from('lab_test_orders')
        .select('id, patient_id, test_name, instructions, status, created_at, patient:profiles!lab_test_orders_patient_id_fkey(full_name)')
        .eq('doctor_id', docId)
        .order('created_at', { ascending: false }),
    ]);

    const mappedAppointments: DoctorAppointment[] = (appointmentsRes.data || []).map((apt: any) => ({
      id: apt.id,
      patient_id: apt.patient_id,
      patient: Array.isArray(apt.patient) ? apt.patient[0] : apt.patient,
    }));

    const mappedOrders: LabOrder[] = (ordersRes.data || []).map((order: any) => ({
      id: order.id,
      patient_id: order.patient_id,
      test_name: order.test_name,
      instructions: order.instructions,
      status: order.status,
      created_at: order.created_at,
      patient: Array.isArray(order.patient) ? order.patient[0] : order.patient,
    }));

    setAppointments(mappedAppointments);
    setOrders(mappedOrders);
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

  const createOrder = async () => {
    if (!doctorId || !appointmentId || !testName.trim()) return;

    const appointment = appointments.find((item) => item.id === appointmentId);
    if (!appointment?.patient_id) return;

    setSubmittingOrder(true);
    try {
      const { error } = await supabase.from('lab_test_orders').insert({
        appointment_id: appointmentId,
        patient_id: appointment.patient_id,
        doctor_id: doctorId,
        test_name: testName,
        instructions: instructions || null,
      });

      if (error) throw error;

      setAppointmentId('');
      setTestName('');
      setInstructions('');
      toast.success('Lab test order created');
      await fetchData(doctorId);
    } catch (error) {
      console.error(error);
      toast.error('Failed to create lab test order');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const createReport = async () => {
    if (!doctorId || !selectedOrderId || !reportTitle.trim()) return;

    const order = orders.find((item) => item.id === selectedOrderId);
    if (!order) return;

    setSubmittingReport(true);
    try {
      const { error: reportError } = await supabase.from('lab_reports').insert({
        order_id: selectedOrderId,
        patient_id: order.patient_id,
        doctor_id: doctorId,
        report_title: reportTitle,
        report_text: reportText || null,
      });

      if (reportError) throw reportError;

      await supabase.from('lab_test_orders').update({ status: 'reported' }).eq('id', selectedOrderId);

      setSelectedOrderId('');
      setReportTitle('');
      setReportText('');
      toast.success('Lab report added');
      await fetchData(doctorId);
    } catch (error) {
      console.error(error);
      toast.error('Failed to add lab report');
    } finally {
      setSubmittingReport(false);
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
            <h1 className="text-2xl font-bold">Laboratory</h1>
            <p className="text-muted-foreground">Create lab orders and upload reports</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FlaskConical className="w-5 h-5" /> Create Lab Test Order</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={appointmentId || 'none'} onValueChange={(value) => setAppointmentId(value === 'none' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select today's appointment" />
              </SelectTrigger>
              <SelectContent>
                {appointments.map((apt) => (
                  <SelectItem key={apt.id} value={apt.id}>{apt.patient?.full_name || 'Unknown patient'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={testName} onChange={(e) => setTestName(e.target.value)} placeholder="Test name (e.g. CBC, LFT)" />
            <Textarea className="md:col-span-2" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Instructions" />
            <Button className="md:col-span-2" onClick={createOrder} disabled={submittingOrder}>Create Order</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Add Lab Report</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
              <SelectTrigger>
                <SelectValue placeholder="Select lab order" />
              </SelectTrigger>
              <SelectContent>
                {orders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>{order.patient?.full_name} • {order.test_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} placeholder="Report title" />
            <Textarea className="md:col-span-2" value={reportText} onChange={(e) => setReportText(e.target.value)} placeholder="Report details" />
            <Button className="md:col-span-2" onClick={createReport} disabled={submittingReport}>Save Report</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Lab Orders</CardTitle>
            <CardDescription>Latest laboratory activities</CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-muted-foreground">No lab orders yet.</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="p-3 rounded-lg border border-border flex items-center justify-between">
                    <div>
                      <p className="font-medium">{order.patient?.full_name || 'Unknown'} • {order.test_name}</p>
                      <p className="text-sm text-muted-foreground">{order.instructions || 'No instructions'}</p>
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
