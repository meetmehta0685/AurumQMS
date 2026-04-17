'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FlaskConical, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface LabOrder {
  id: string;
  test_name: string;
  status: string;
  instructions: string | null;
  created_at: string;
}

interface LabReport {
  id: string;
  report_title: string;
  report_text: string | null;
  report_url: string | null;
  reported_at: string;
  order: { test_name: string } | null;
}

export default function PatientLaboratoryPage() {
  const { profile, isLoading } = useAuth();
  const supabase = createClient();

  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.id) return;

      try {
        const [ordersRes, reportsRes] = await Promise.all([
          supabase
            .from('lab_test_orders')
            .select('id, test_name, status, instructions, created_at')
            .eq('patient_id', profile.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('lab_reports')
            .select('id, report_title, report_text, report_url, reported_at, order:lab_test_orders!lab_reports_order_id_fkey(test_name)')
            .eq('patient_id', profile.id)
            .order('reported_at', { ascending: false }),
        ]);

        setOrders(ordersRes.data || []);
        setReports((reportsRes.data || []).map((report: any) => ({
          ...report,
          order: Array.isArray(report.order) ? report.order[0] : report.order,
        })));
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingData(false);
      }
    };

    if (profile) {
      fetchData();
    }
  }, [profile, supabase]);

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
          <Link href="/patient">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Laboratory Reports</h1>
            <p className="text-muted-foreground">See all your tests and lab reports</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FlaskConical className="w-5 h-5" /> Lab Orders</CardTitle>
            <CardDescription>Tests requested by your doctor</CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-muted-foreground">No lab orders yet.</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="p-3 rounded-lg border border-border flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{order.test_name}</p>
                      <p className="text-sm text-muted-foreground">{order.instructions || 'No instructions'}</p>
                    </div>
                    <Badge variant={order.status === 'reported' ? 'default' : 'outline'}>{order.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Reports</CardTitle>
            <CardDescription>Clinical results uploaded by your doctor/lab</CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="text-muted-foreground">No reports uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div key={report.id} className="p-3 rounded-lg border border-border">
                    <p className="font-medium">{report.report_title}</p>
                    <p className="text-sm text-muted-foreground">Test: {report.order?.test_name || 'N/A'}</p>
                    {report.report_text && (
                      <p className="text-sm mt-2 text-muted-foreground">{report.report_text}</p>
                    )}
                    {report.report_url && (
                      <a href={report.report_url} className="text-sm text-primary underline" target="_blank" rel="noreferrer">Open attached report</a>
                    )}
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
