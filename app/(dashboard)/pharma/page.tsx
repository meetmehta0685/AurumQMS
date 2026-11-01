"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Pill,
  AlertCircle,
  PackageCheck,
  PackagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

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

  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [status, setStatus] = useState<"pending" | "dispensed" | "cancelled">(
    "dispensed"
  );
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedPatient =
    patients.find((patient) => patient.id === patientId) || null;

  const fetchData = async () => {
    try {
      const [patientsRes, doctorsRes, itemsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, phone")
          .eq("role", "patient")
          .order("full_name", { ascending: true }),
        supabase
          .from("doctors")
          .select("id, profile:profiles!doctors_profile_id_fkey(full_name)")
          .order("created_at", { ascending: true }),
        supabase
          .from("pharmacy_dispenses")
          .select(
            "id, medicine_name, dosage, frequency, duration, quantity, dispense_status, patient:profiles!pharmacy_dispenses_patient_id_fkey(full_name)"
          )
          .order("created_at", { ascending: false }),
      ]);

      if (patientsRes.error) throw patientsRes.error;
      if (doctorsRes.error) throw doctorsRes.error;
      if (itemsRes.error) throw itemsRes.error;

      const mappedDoctors: DoctorProfile[] = (doctorsRes.data || []).map(
        (item: any) => ({
          id: item.id,
          profile: Array.isArray(item.profile)
            ? item.profile[0]
            : item.profile,
        })
      );

      const mappedItems: DispenseItem[] = (itemsRes.data || []).map(
        (item: any) => ({
          id: item.id,
          medicine_name: item.medicine_name,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          quantity: item.quantity,
          dispense_status: item.dispense_status,
          patient: Array.isArray(item.patient)
            ? item.patient[0]
            : item.patient,
        })
      );

      setPatients(patientsRes.data || []);
      setDoctors(mappedDoctors);
      setItems(mappedItems);
    } catch (error: any) {
      console.error("Pharma portal fetch error:", error);
      toast.error(
        error?.message || "Failed to fetch pharmacy data. Check Supabase connection."
      );
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [supabase]);

  const createDispense = async () => {
    if (
      !patientId ||
      !doctorId ||
      !medicineName ||
      !dosage ||
      !frequency ||
      !duration
    )
      return;

    setSaving(true);
    try {
      const { error } = await supabase.from("pharmacy_dispenses").insert({
        patient_id: patientId,
        doctor_id: doctorId,
        medicine_name: medicineName,
        dosage,
        frequency,
        duration,
        quantity: Number(quantity),
        dispense_status: status,
        dispensed_at: status === "dispensed" ? new Date().toISOString() : null,
        notes: notes || null,
      });

      if (error) throw error;

      setPatientId("");
      setDoctorId("");
      setMedicineName("");
      setDosage("");
      setFrequency("");
      setDuration("");
      setQuantity("1");
      setStatus("dispensed");
      setNotes("");
      toast.success("Prescription dispense record saved");
      await fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save pharmacy dispense");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loadingData) {
    return (
      <div className="min-h-[calc(100svh-4.5rem)] bg-background">
        <div className="max-w-7xl mx-auto p-6 flex flex-col gap-6">
          <Skeleton className="h-12 w-64 rounded-xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profile || profile.role !== "pharma") {
    return (
      <div className="min-h-[calc(100svh-4.5rem)] bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card p-6 text-center flex flex-col gap-4">
          <div className="size-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="size-8" />
          </div>
          <CardTitle className="text-xl font-bold">Access Restricted</CardTitle>
          <CardDescription>
            Only authorized pharmacy personnel can access this portal.
          </CardDescription>
          <Button onClick={logout} className="w-full">
            Return to Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100svh-4.5rem)] bg-background pb-12">
      {/* Unified Top Navigation */}

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 flex flex-col gap-8">
        {/* Pharma Hero Banner */}
        <div className="pt-2">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
                Pharmacy Dispensary Workstation
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl">
                Process real-time doctor prescriptions, fulfill patient medication orders, track stock quantities, and maintain audit logs.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4">
              <div className="size-12 rounded-xl bg-warning/20 text-warning flex items-center justify-center">
                <PackageCheck className="size-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dispensary Log</p>
                <p className="font-display text-xl font-bold text-foreground">{items.filter((i) => i.dispense_status === "dispensed").length} Fulfilled</p>
                <span className="text-xs text-warning font-medium">Ready for Pick-up</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form & Log Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Create Dispense Card */}
          <Card className="lg:col-span-6 bg-card border-border">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <PackagePlus className="size-5 text-warning" />
                Record Medication Dispense
              </CardTitle>
              <CardDescription>Log a new prescription fulfillment for a patient</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Select Patient</label>
                  <Select value={patientId} onValueChange={setPatientId}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Choose patient..." />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Prescribing Physician</label>
                  <Select value={doctorId} onValueChange={setDoctorId}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Choose doctor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          Dr. {d.profile?.full_name || "Specialist"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedPatient && (
                <div className="p-3 rounded-xl border border-warning/30 bg-warning/5 text-xs flex flex-col gap-1">
                  <p className="font-semibold text-warning">Patient Details:</p>
                  <p className="text-foreground">{selectedPatient.full_name} • {selectedPatient.email}</p>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Medicine Name & Strength</label>
                <Input
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  placeholder="e.g. Amoxicillin 500mg"
                  className="bg-background"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Dosage</label>
                  <Input
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="1 tablet"
                    className="bg-background"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Frequency</label>
                  <Input
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    placeholder="TDS (3x/day)"
                    className="bg-background"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Duration</label>
                  <Input
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="5 Days"
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Quantity Dispensed</label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="15"
                    className="bg-background"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Fulfillment Status</label>
                  <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Choose status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dispensed">Dispensed</SelectItem>
                      <SelectItem value="pending">Pending Stock</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Pharmacist Notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Take after meals. Storage notes..."
                  className="bg-background min-h-16"
                />
              </div>

              <Button
                onClick={createDispense}
                disabled={saving || !patientId || !doctorId || !medicineName || !dosage || !frequency || !duration}
                className="w-full gap-2 shadow-sm"
              >
                {saving ? "Saving Dispense..." : "Confirm & Save Dispense Record"}
              </Button>
            </CardContent>
          </Card>

          {/* Fulfillment Dispense Log */}
          <Card className="lg:col-span-6 bg-card border-border">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Pill className="size-5 text-warning" />
                Medication Dispense Log
              </CardTitle>
              <CardDescription>Real-time pharmacy fulfillment activity</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No pharmacy dispenses recorded yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {items.map((i) => (
                    <div
                      key={i.id}
                      className="flex items-center justify-between p-4 rounded-2xl border border-border bg-background hover:border-warning/40 transition-[color,background-color,border-color,box-shadow,translate] gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="size-10 rounded-xl bg-warning/15 text-warning flex items-center justify-center shrink-0">
                          <Pill className="size-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {i.medicine_name} • <span className="text-xs text-muted-foreground">{i.dosage} ({i.frequency})</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Patient: {i.patient?.full_name || "Record"} • Qty: {i.quantity} (For {i.duration})
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={`capitalize ${
                          i.dispense_status === "dispensed"
                            ? "border-stay/30 text-stay bg-stay/10"
                            : "border-warning/30 text-warning bg-warning/10"
                        }`}
                      >
                        {i.dispense_status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
