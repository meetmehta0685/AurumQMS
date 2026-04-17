"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pill } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminPharmaItem {
  id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  dispense_status: string;
  patient: { full_name: string } | null;
}

type AdminPharmaItemRow = Omit<AdminPharmaItem, "patient"> & {
  patient: { full_name: string } | { full_name: string }[] | null;
};

export default function AdminPharmaPage() {
  const { isLoading } = useAuth();
  const supabase = createClient();

  const [items, setItems] = useState<AdminPharmaItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("pharmacy_dispenses")
      .select(
        "id, medicine_name, dosage, frequency, duration, quantity, dispense_status, patient:profiles!pharmacy_dispenses_patient_id_fkey(full_name)",
      )
      .order("created_at", { ascending: false });

    setItems(
      ((data as AdminPharmaItemRow[] | null) || []).map((item) => ({
        ...item,
        patient: Array.isArray(item.patient) ? item.patient[0] : item.patient,
      })),
    );

    setLoadingData(false);
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchItems();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [supabase]);

  const updateStatus = async (id: string, status: string) => {
    const payload: { dispense_status: string; dispensed_at?: string } = {
      dispense_status: status,
    };
    if (status === "dispensed") payload.dispensed_at = new Date().toISOString();

    await supabase.from("pharmacy_dispenses").update(payload).eq("id", id);
    await fetchItems();
  };

  if (isLoading || loadingData) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Pharmacy Oversight</h1>
            <p className="text-muted-foreground">
              Manage medicine dispatch with full transparency
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5" /> All Medicines
            </CardTitle>
            <CardDescription>
              Track pending and dispensed medicines
            </CardDescription>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-muted-foreground">
                No pharmacy entries found.
              </p>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border border-border rounded-lg flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-medium">
                        {item.medicine_name} •{" "}
                        {item.patient?.full_name || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.dosage} • {item.frequency} • {item.duration} • Qty{" "}
                        {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          item.dispense_status === "dispensed"
                            ? "default"
                            : "outline"
                        }
                      >
                        {item.dispense_status}
                      </Badge>
                      <Select
                        value={item.dispense_status}
                        onValueChange={(value) => updateStatus(item.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">pending</SelectItem>
                          <SelectItem value="dispensed">dispensed</SelectItem>
                          <SelectItem value="cancelled">cancelled</SelectItem>
                        </SelectContent>
                      </Select>
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
