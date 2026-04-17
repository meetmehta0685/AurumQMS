"use client";

import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface QueuePatient {
  id: string;
  appointment_time: string;
  status: string;
  token_number: number | null;
  notes: string | null;
  patient_id: string;
  patient: {
    full_name: string;
    email: string;
    phone: string | null;
  } | null;
}

export default function DoctorQueuePage() {
  const { profile, isLoading } = useAuth();
  const supabase = createClient();
  const [queue, setQueue] = useState<QueuePatient[]>([]);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [currentPatient, setCurrentPatient] = useState<QueuePatient | null>(
    null,
  );
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [recordNotes, setRecordNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchQueue = async (docId: string) => {
    const today = new Date().toISOString().split("T")[0];

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(
        `
        id,
        appointment_time,
        status,
        token_number,
        notes,
        patient_id,
        patient:profiles!appointments_patient_id_fkey(full_name, email, phone)
      `,
      )
      .eq("doctor_id", docId)
      .eq("appointment_date", today)
      .in("status", ["pending", "confirmed"])
      .order("token_number", { ascending: true });

    if (error) {
      console.error("Error fetching queue:", error);
      return;
    }

    // Map the appointments to the correct format
    const mappedQueue: QueuePatient[] = (appointments || []).map(
      (apt: any) => ({
        id: apt.id,
        appointment_time: apt.appointment_time,
        status: apt.status,
        token_number: apt.token_number,
        notes: apt.notes,
        patient_id: apt.patient_id,
        patient: Array.isArray(apt.patient) ? apt.patient[0] : apt.patient,
      }),
    );

    setQueue(mappedQueue);
  };

  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!profile?.user_id) return;

      try {
        const { data: doctor } = await supabase
          .from("doctors")
          .select("id")
          .eq("user_id", profile.user_id)
          .single();

        if (!doctor) {
          setLoadingData(false);
          return;
        }

        setDoctorId(doctor.id);
        await fetchQueue(doctor.id);
      } catch (error) {
        console.error("Error fetching doctor data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    if (profile) {
      fetchDoctorData();
    }
  }, [profile, supabase]);

  const callNextPatient = async () => {
    if (!queue.length || !doctorId) return;

    const nextPatient = queue[0];
    setProcessing(true);

    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "confirmed" })
        .eq("id", nextPatient.id);

      if (error) throw error;

      setCurrentPatient(nextPatient);
      toast.success(`Called ${nextPatient.patient?.full_name || "patient"}`);
      await fetchQueue(doctorId);
    } catch (error) {
      console.error("Error calling patient:", error);
      toast.error("Failed to call patient");
    } finally {
      setProcessing(false);
    }
  };

  const completeAppointment = async () => {
    if (!currentPatient || !doctorId) return;

    setProcessing(true);

    try {
      // Update appointment status
      const { error: appointmentError } = await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", currentPatient.id);

      if (appointmentError) throw appointmentError;

      // Create medical record if diagnosis provided
      if (diagnosis.trim()) {
        const { error: recordError } = await supabase
          .from("medical_records")
          .insert({
            patient_id: currentPatient.patient_id,
            doctor_id: doctorId,
            appointment_id: currentPatient.id,
            diagnosis: diagnosis,
            notes: recordNotes || null,
          });

        if (recordError) {
          console.error("Error creating medical record:", recordError);
        }
      }

      toast.success("Appointment completed successfully");
      setCurrentPatient(null);
      setShowCompleteDialog(false);
      setDiagnosis("");
      setRecordNotes("");
      await fetchQueue(doctorId);
    } catch (error) {
      console.error("Error completing appointment:", error);
      toast.error("Failed to complete appointment");
    } finally {
      setProcessing(false);
    }
  };

  const markNoShow = async (appointment: QueuePatient) => {
    if (!doctorId) return;

    setProcessing(true);

    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointment.id);

      if (error) throw error;

      toast.success("Patient marked as no-show");
      if (currentPatient?.id === appointment.id) {
        setCurrentPatient(null);
      }
      await fetchQueue(doctorId);
    } catch (error) {
      console.error("Error marking no-show:", error);
      toast.error("Failed to update status");
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading || loadingData) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/doctor">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Patient Queue
            </h1>
            <p className="text-muted-foreground">
              Manage today&apos;s appointments
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Patient */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Current Patient
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentPatient ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-2xl font-bold">
                          {currentPatient.token_number || "#"}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">
                          {currentPatient.patient?.full_name}
                        </h3>
                        <p className="text-muted-foreground">
                          {currentPatient.patient?.email}
                        </p>
                        {currentPatient.patient?.phone && (
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {currentPatient.patient.phone}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Scheduled: {currentPatient.appointment_time}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowCompleteDialog(true)}
                        className="bg-primary hover:bg-primary/90"
                        disabled={processing}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Complete
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => markNoShow(currentPatient)}
                        disabled={processing}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        No Show
                      </Button>
                    </div>
                  </div>
                  {currentPatient.notes && (
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm font-medium text-yellow-800">
                        Patient Notes:
                      </p>
                      <p className="text-sm text-yellow-700">
                        {currentPatient.notes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">
                    No patient currently being seen
                  </p>
                  <Button
                    onClick={callNextPatient}
                    disabled={queue.length === 0 || processing}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Call Next Patient
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Waiting Queue */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Waiting Queue ({queue.length})</CardTitle>
              <CardDescription>Patients waiting to be seen</CardDescription>
            </CardHeader>
            <CardContent>
              {queue.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-primary/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No patients in queue</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {queue.map((patient, index) => (
                    <div
                      key={patient.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        index === 0
                          ? "bg-chart-4/10 border-chart-4/20"
                          : "bg-muted border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            index === 0
                              ? "bg-chart-4 text-primary-foreground"
                              : "bg-muted-foreground/20 text-foreground"
                          }`}
                        >
                          <span className="font-semibold">
                            {patient.token_number || index + 1}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {patient.patient?.full_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {patient.appointment_time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            patient.status === "confirmed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {patient.status}
                        </Badge>
                        {index === 0 && !currentPatient && (
                          <Button
                            size="sm"
                            onClick={callNextPatient}
                            disabled={processing}
                          >
                            Call
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markNoShow(patient)}
                          disabled={processing}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Complete Appointment Dialog */}
        <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Appointment</DialogTitle>
              <DialogDescription>
                Add diagnosis and notes for {currentPatient?.patient?.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Diagnosis</label>
                <Textarea
                  placeholder="Enter diagnosis..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Textarea
                  placeholder="Additional notes..."
                  value={recordNotes}
                  onChange={(e) => setRecordNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCompleteDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={completeAppointment} disabled={processing}>
                {processing ? "Saving..." : "Complete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
