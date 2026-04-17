'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pill } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface DispenseItem {
  id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  dispense_status: string;
  dispensed_at: string | null;
  notes: string | null;
}

export default function PatientPharmaPage() {
  const { profile, isLoading } = useAuth();
  const supabase = createClient();

  const [items, setItems] = useState<DispenseItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      if (!profile?.id) return;

      try {
        const { data } = await supabase
          .from('pharmacy_dispenses')
          .select('id, medicine_name, dosage, frequency, duration, quantity, dispense_status, dispensed_at, notes')
          .eq('patient_id', profile.id)
          .order('created_at', { ascending: false });

        setItems(data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingData(false);
      }
    };

    if (profile) {
      fetchItems();
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
            <h1 className="text-2xl font-bold">Pharmacy</h1>
            <p className="text-muted-foreground">Medicines prescribed and dispensed for you</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Pill className="w-5 h-5" /> My Medicines</CardTitle>
            <CardDescription>Transparent view of prescribed and dispensed medicines</CardDescription>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-muted-foreground">No pharmacy records found.</p>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg border border-border flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{item.medicine_name}</p>
                      <p className="text-sm text-muted-foreground">{item.dosage} • {item.frequency} • {item.duration} • Qty {item.quantity}</p>
                      {item.notes && <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>}
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
