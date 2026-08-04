"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  FlaskConical,
  Plus,
  Upload,
  AlertCircle,
  FileCheck,
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

  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [testName, setTestName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [savingOrder, setSavingOrder] = useState(false);

  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [reportText, setReportText] = useState("");
  const [reportUrl, setReportUrl] = useState("");
  const [savingReport, setSavingReport] = useState(false);

  const selectedPatient = patients.find((p) => p.id === patientId) || null;

  const fetchData = async () => {
    try {
      const [ordersRes, patientsRes, doctorsRes] = await Promise.all([
        supabase
          .from("lab_test_orders")
          .select(
            `
            id,
            patient_id,
            doctor_id,
            test_name,
            status,
            instructions,
            patient:profiles!lab_test_orders_patient_id_fkey(full_name),
            doctor:doctors!lab_test_orders_doctor_id_fkey(profile:profiles!doctors_profile_id_fkey(full_name))
          `
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("id, full_name, email, phone")
          .eq("role", "patient")
          .order("full_name", { ascending: true }),
        supabase
          .from("doctors")
          .select("id, profile:profiles!doctors_profile_id_fkey(full_name)")
          .order("created_at", { ascending: true }),
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (patientsRes.error) throw patientsRes.error;
      if (doctorsRes.error) throw doctorsRes.error;

      const mappedOrders: LabOrder[] = (ordersRes.data || []).map(
        (item: any) => {
          const doctor = Array.isArray(item.doctor)
            ? item.doctor[0]
            : item.doctor;
          const doctorProfile = Array.isArray(doctor?.profile)
            ? doctor.profile[0]
            : doctor?.profile;
          return {
            id: item.id,
            patient_id: item.patient_id,
            doctor_id: item.doctor_id,
            test_name: item.test_name,
            status: item.status,
            instructions: item.instructions,
            patient: Array.isArray(item.patient)
              ? item.patient[0]
              : item.patient,
            doctor: doctor ? { ...doctor, profile: doctorProfile } : null,
          };
        }
      );

      const mappedDoctors: DoctorProfile[] = (doctorsRes.data || []).map(
        (item: any) => ({
          id: item.id,
          profile: Array.isArray(item.profile)
            ? item.profile[0]
            : item.profile,
        })
      );

      setOrders(mappedOrders);
      setPatients(patientsRes.data || []);
      setDoctors(mappedDoctors);
    } catch (error: any) {
      console.error("Lab portal fetch error:", error);
      toast.error(
        error?.message || "Failed to fetch lab data. Check Supabase connection."
      );
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
      const { error } = await supabase.from("lab_test_orders").insert({
        patient_id: patientId,
        doctor_id: doctorId,
        test_name: testName,
        instructions: instructions || null,
        status: "ordered",
      });

      if (error) throw error;

      setPatientId("");
      setDoctorId("");
      setTestName("");
      setInstructions("");
      toast.success("New lab test order registered");
      await fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create lab order");
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
      const { error } = await supabase.from("lab_reports").insert({
        order_id: selectedOrderId,
        patient_id: order.patient_id,
        doctor_id: order.doctor_id,
        report_title: reportTitle,
        report_text: reportText || null,
        report_url: reportUrl || null,
      });

      if (error) throw error;

      await supabase
        .from("lab_test_orders")
        .update({ status: "reported" })
        .eq("id", selectedOrderId);

      setSelectedOrderId("");
      setReportTitle("");
      setReportText("");
      setReportUrl("");
      toast.success("Lab diagnostic report published");
      await fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload report");
    } finally {
      setSavingReport(false);
    }
  };

  if (isLoading || loadingData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-6 flex flex-col gap-6">
          <Skeleton className="h-12 w-64 rounded-xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profile || profile.role !== "lab") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card p-6 text-center flex flex-col gap-4">
          <div className="size-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="size-8" />
          </div>
          <CardTitle className="text-xl font-bold">Access Restricted</CardTitle>
          <CardDescription>
            Only authorized laboratory technicians can access this portal.
          </CardDescription>
          <Button onClick={logout} className="w-full">
            Return to Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Unified Top Navigation */}

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 flex flex-col gap-8">
        {/* Lab Hero Banner */}
        <div className="relative overflow-hidden rounded-xl border border-care/30 bg-card p-6 sm:p-8 shadow-sm">
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-care/40 text-care bg-care/10 gap-1.5">
                  <FlaskConical className="size-3.5" />
                  Diagnostic Workstation
                </Badge>
                <span className="text-xs text-muted-foreground">• Live Worklist</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground">
                Laboratory Diagnostics Portal 🧪
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl">
                Process specimen test orders, track diagnostic progress, and publish verified test results to patient health records.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4">
              <div className="size-12 rounded-xl bg-care/20 text-care flex items-center justify-center">
                <FileCheck className="size-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Orders</p>
                <p className="font-display text-xl font-bold text-foreground">{orders.length} Records</p>
                <span className="text-xs text-care font-medium">Ready for Processing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Forms Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Order Card */}
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Plus className="size-5 text-care" />
                Register New Lab Order
              </CardTitle>
              <CardDescription>Initiate specimen testing for a patient</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Select Patient</label>
                <Select value={patientId} onValueChange={setPatientId}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Choose patient record..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name} ({p.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Ordering Doctor</label>
                <Select value={doctorId} onValueChange={setDoctorId}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Choose physician..." />
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

              {selectedPatient && (
                <div className="p-3 rounded-xl border border-care/30 bg-care/5 text-xs flex flex-col gap-1">
                  <p className="font-semibold text-care">Patient File Selected:</p>
                  <p className="text-foreground">{selectedPatient.full_name} • {selectedPatient.email}</p>
                  <p className="text-muted-foreground">Phone: {selectedPatient.phone || "N/A"}</p>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Test Name / Panel</label>
                <Input
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="e.g. Complete Blood Count (CBC) / Lipid Profile"
                  className="bg-background"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Special Instructions / Fasting Notes</label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Fasting 12 hours required, fasting blood sugar..."
                  className="bg-background min-h-20"
                />
              </div>

              <Button
                onClick={createOrder}
                disabled={savingOrder || !patientId || !doctorId || !testName.trim()}
                className="w-full gap-2 shadow-sm"
              >
                {savingOrder ? "Registering Order..." : "Create Specimen Order"}
              </Button>
            </CardContent>
          </Card>

          {/* Upload Report Card */}
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Upload className="size-5 text-care" />
                Publish Diagnostic Test Result
              </CardTitle>
              <CardDescription>Upload report results for pending orders</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Select Active Order</label>
                <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Choose order to report..." />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.patient?.full_name || "Patient"} • {o.test_name} ({o.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Report Title</label>
                <Input
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g. Diagnostic Report - Normal Range"
                  className="bg-background"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">PDF Document URL (Optional)</label>
                <Input
                  value={reportUrl}
                  onChange={(e) => setReportUrl(e.target.value)}
                  placeholder="https://storage.aurum.com/reports/123.pdf"
                  className="bg-background"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Result Details & Clinical Observations</label>
                <Textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Hemoglobin: 14.2 g/dL, WBC: 6,800 /mcL, Platelets: 250,000 /mcL..."
                  className="bg-background min-h-20"
                />
              </div>

              <Button
                onClick={uploadReport}
                disabled={savingReport || !selectedOrderId || !reportTitle.trim()}
                className="w-full gap-2 shadow-sm"
              >
                {savingReport ? "Publishing Report..." : "Publish Diagnostic Report"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders Table List */}
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <FlaskConical className="size-5 text-care" />
              Laboratory Order Worklist
            </CardTitle>
            <CardDescription>Real-time status tracking for all test requests</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No lab orders found in system.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border bg-background hover:border-care/40 transition-all gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-xl bg-care/15 text-care flex items-center justify-center shrink-0">
                        <FlaskConical className="size-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {o.patient?.full_name || "Patient Record"} • <span className="text-care">{o.test_name}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ordering Doctor: Dr. {o.doctor?.profile?.full_name || "Specialist"}
                        </p>
                        {o.instructions && (
                          <p className="text-xs text-muted-foreground/80 italic mt-0.5">Notes: {o.instructions}</p>
                        )}
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={`capitalize self-start sm:self-auto ${
                        o.status === "reported"
                          ? "border-stay/30 text-stay bg-stay/10"
                          : "border-warning/30 text-warning bg-warning/10"
                      }`}
                    >
                      {o.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
