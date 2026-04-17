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

interface PatientDischarge {
  id: string;
  appointment_id: string;
  summary_text: string | null;
  discharge_status: 'draft' | 'discharged';
  discharged_at: string | null;
  appointment: { appointment_date: string } | null;
}

export default function PatientDischargePage() {
  const { profile, isLoading } = useAuth();
  const supabase = createClient();

  const [summaries, setSummaries] = useState<PatientDischarge[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const latestDischarged = summaries.find((item) => item.discharge_status === 'discharged') || null;

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.id) return;

      try {
        const { data } = await supabase
          .from('discharge_summaries')
          .select('id, appointment_id, summary_text, discharge_status, discharged_at, appointment:appointments!discharge_summaries_appointment_id_fkey(appointment_date)')
          .eq('patient_id', profile.id)
          .order('created_at', { ascending: false });

        setSummaries((data || []).map((row: any) => ({
          ...row,
          appointment: Array.isArray(row.appointment) ? row.appointment[0] : row.appointment,
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
            <h1 className="text-2xl font-bold">Discharge Documents</h1>
            <p className="text-muted-foreground">Download your complete discharge summaries</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Discharge Summaries</CardTitle>
            <CardDescription>Includes reports, medicines and doctor notes in one PDF</CardDescription>
          </CardHeader>
          <CardContent>
            {latestDischarged && (
              <div className="mb-4 p-3 border border-primary/30 rounded-lg bg-primary/5 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Latest Ready PDF</p>
                  <p className="text-sm text-muted-foreground">
                    Visit Date: {latestDischarged.appointment?.appointment_date || 'N/A'}
                  </p>
                </div>
                <Button asChild>
                  <a href={`/api/discharge/${latestDischarged.appointment_id}`} target="_blank" rel="noreferrer">
                    <FileDown className="w-4 h-4 mr-2" />
                    Download Latest PDF
                  </a>
                </Button>
              </div>
            )}

            {summaries.length === 0 ? (
              <p className="text-muted-foreground">No discharge summaries available.</p>
            ) : (
              <div className="space-y-3">
                {summaries.map((item) => (
                  <div key={item.id} className="p-3 border border-border rounded-lg flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">Visit Date: {item.appointment?.appointment_date || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">{item.summary_text || 'No summary text available'}</p>
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
