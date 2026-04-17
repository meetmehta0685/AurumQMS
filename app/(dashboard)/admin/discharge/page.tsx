'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminDischarge {
  id: string;
  appointment_id: string;
  discharge_status: 'draft' | 'discharged';
  patient: { full_name: string } | null;
}

export default function AdminDischargePage() {
  const { isLoading } = useAuth();
  const supabase = createClient();

  const [summaries, setSummaries] = useState<AdminDischarge[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('discharge_summaries')
        .select('id, appointment_id, discharge_status, patient:profiles!discharge_summaries_patient_id_fkey(full_name)')
        .order('created_at', { ascending: false });

      setSummaries((data || []).map((row: any) => ({
        ...row,
        patient: Array.isArray(row.patient) ? row.patient[0] : row.patient,
      })));
      setLoadingData(false);
    };

    fetchData();
  }, [supabase]);

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
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Discharge Registry</h1>
            <p className="text-muted-foreground">Hospital-level view of generated discharge PDFs</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Discharge Summaries</CardTitle>
            <CardDescription>Audit-ready list for transparency and reporting</CardDescription>
          </CardHeader>
          <CardContent>
            {summaries.length === 0 ? (
              <p className="text-muted-foreground">No discharge summaries found.</p>
            ) : (
              <div className="space-y-3">
                {summaries.map((item) => (
                  <div key={item.id} className="p-3 border border-border rounded-lg flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.patient?.full_name || 'Unknown patient'}</p>
                      <p className="text-sm text-muted-foreground">Appointment: {item.appointment_id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.discharge_status === 'discharged' ? 'default' : 'outline'}>{item.discharge_status}</Badge>
                      <Button variant="outline" asChild>
                        <a href={`/api/discharge/${item.appointment_id}`} target="_blank" rel="noreferrer">
                          <FileDown className="w-4 h-4 mr-2" />
                          PDF
                        </a>
                      </Button>
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
