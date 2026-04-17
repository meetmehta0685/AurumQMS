"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FlaskConical } from "lucide-react";
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

interface AdminLabOrder {
  id: string;
  test_name: string;
  status: string;
  patient: { full_name: string } | null;
  doctor: { profile: { full_name: string } | null } | null;
}

type AdminLabOrderRow = {
  id: string;
  test_name: string;
  status: string;
  patient: { full_name: string } | { full_name: string }[] | null;
  doctor:
    | { profile: { full_name: string } | { full_name: string }[] | null }
    | { profile: { full_name: string } | { full_name: string }[] | null }[]
    | null;
};

export default function AdminLaboratoryPage() {
  const { isLoading } = useAuth();
  const supabase = createClient();

  const [orders, setOrders] = useState<AdminLabOrder[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("lab_test_orders")
      .select(
        "id, test_name, status, patient:profiles!lab_test_orders_patient_id_fkey(full_name), doctor:doctors!lab_test_orders_doctor_id_fkey(profile:profiles!doctors_profile_id_fkey(full_name))",
      )
      .order("created_at", { ascending: false });

    const mapped: AdminLabOrder[] = (
      (data as AdminLabOrderRow[] | null) || []
    ).map((item) => {
      const doctor = Array.isArray(item.doctor) ? item.doctor[0] : item.doctor;
      const profile = Array.isArray(doctor?.profile)
        ? doctor.profile[0]
        : doctor?.profile;

      return {
        id: item.id,
        test_name: item.test_name,
        status: item.status,
        patient: Array.isArray(item.patient) ? item.patient[0] : item.patient,
        doctor: doctor ? { ...doctor, profile: profile ?? null } : null,
      };
    });

    setOrders(mapped);
    setLoadingData(false);
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchOrders();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [supabase]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("lab_test_orders").update({ status }).eq("id", id);
    await fetchOrders();
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
            <h1 className="text-2xl font-bold">Laboratory Oversight</h1>
            <p className="text-muted-foreground">
              Hospital-wide lab monitoring and transparency
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5" /> All Lab Orders
            </CardTitle>
            <CardDescription>
              Track and manage test statuses across departments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-muted-foreground">No lab orders found.</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3 border border-border rounded-lg flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-medium">{order.test_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Patient: {order.patient?.full_name || "Unknown"} •
                        Doctor: Dr.{" "}
                        {order.doctor?.profile?.full_name || "Unknown"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          order.status === "reported" ? "default" : "outline"
                        }
                      >
                        {order.status}
                      </Badge>
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ordered">ordered</SelectItem>
                          <SelectItem value="sample_collected">
                            sample_collected
                          </SelectItem>
                          <SelectItem value="processing">processing</SelectItem>
                          <SelectItem value="reported">reported</SelectItem>
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
