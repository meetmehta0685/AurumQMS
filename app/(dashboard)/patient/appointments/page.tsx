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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Plus,
  Stethoscope,
  X,
  Building2,
  CalendarDays,
  Heart,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Department {
  id: string;
  name: string;
}

interface DoctorOption {
  id: string;
  specialization: string;
  consultation_duration: number;
  is_available: boolean;
  profile: {
    full_name: string;
  };
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  token_number: number | null;
  notes: string | null;
  doctor: {
    specialization: string;
    profile: {
      full_name: string;
    };
  };
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function PatientAppointmentsPage() {
  const { profile, isLoading } = useAuth();
  const supabase = createClient();
  const [loadingData, setLoadingData] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [booking, setBooking] = useState(false);

  // Booking form state
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [appointmentNotes, setAppointmentNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const fetchAppointments = async () => {
    if (!profile?.id) return;

    try {
      const { data } = await supabase
        .from("appointments")
        .select(
          `
          id,
          appointment_date,
          appointment_time,
          status,
          token_number,
          notes,
          doctor:doctors(
            specialization,
            profile:profiles!doctors_profile_id_fkey(full_name)
          )
        `,
        )
        .eq("patient_id", profile.id)
        .order("appointment_date", { ascending: false })
        .order("appointment_time", { ascending: false });

      // Transform the data to handle Supabase's array format for nested relations
      const transformedData = (data || []).map((apt: any) => ({
        ...apt,
        doctor: Array.isArray(apt.doctor)
          ? {
              ...apt.doctor[0],
              profile: Array.isArray(apt.doctor[0]?.profile)
                ? apt.doctor[0].profile[0]
                : apt.doctor[0]?.profile,
            }
          : {
              ...apt.doctor,
              profile: Array.isArray(apt.doctor?.profile)
                ? apt.doctor.profile[0]
                : apt.doctor?.profile,
            },
      }));

      setAppointments(transformedData as Appointment[]);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.id) return;

      try {
        // Fetch departments
        const { data: deptData } = await supabase
          .from("departments")
          .select("id, name")
          .order("name");

        setDepartments(deptData || []);
        await fetchAppointments();
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    if (profile) {
      fetchData();
    }
  }, [profile, supabase]);

  // Fetch doctors when department changes
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!selectedDepartment) {
        setDoctors([]);
        return;
      }

      const { data } = await supabase
        .from("doctors")
        .select(
          `
          id,
          specialization,
          consultation_duration,
          is_available,
          profile:profiles!doctors_profile_id_fkey(full_name)
        `,
        )
        .eq("department_id", selectedDepartment)
        .eq("is_available", true);

      // Transform the data to handle Supabase's array format for nested relations
      const transformedDoctors = (data || []).map((doc: any) => ({
        ...doc,
        profile: Array.isArray(doc.profile) ? doc.profile[0] : doc.profile,
      }));

      setDoctors(transformedDoctors as DoctorOption[]);
    };

    fetchDoctors();
  }, [selectedDepartment, supabase]);

  // Fetch available slots when doctor and date are selected
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDoctor || !selectedDate) {
        setAvailableSlots([]);
        return;
      }

      setLoadingSlots(true);

      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const dayOfWeek = selectedDate.getDay();

        // Get doctor's availability for this day
        const { data: availability, error: availabilityError } = await supabase
          .from("doctor_availability")
          .select("start_time, end_time, is_blocked")
          .eq("doctor_id", selectedDoctor)
          .eq("day_of_week", dayOfWeek)
          .maybeSingle();

        // If no availability set for this day, show a helpful message
        if (availabilityError || !availability) {
          console.log("No availability found for this day");
          setAvailableSlots([]);
          setLoadingSlots(false);
          return;
        }

        if (availability.is_blocked) {
          setAvailableSlots([]);
          setLoadingSlots(false);
          return;
        }

        // Get doctor's consultation duration
        const doctor = doctors.find((d) => d.id === selectedDoctor);
        const duration = doctor?.consultation_duration || 15;

        // Get existing appointments for this date
        const { data: existingAppointments } = await supabase
          .from("appointments")
          .select("appointment_time")
          .eq("doctor_id", selectedDoctor)
          .eq("appointment_date", dateStr)
          .in("status", ["pending", "confirmed"]);

        // Normalize time format to HH:mm (remove seconds if present)
        const bookedTimes = new Set(
          existingAppointments?.map((a) =>
            a.appointment_time.substring(0, 5),
          ) || [],
        );

        // Generate time slots
        const slots: TimeSlot[] = [];
        const startParts = availability.start_time.split(":");
        const endParts = availability.end_time.split(":");
        let currentMinutes =
          parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
        const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

        // Check if selected date is today to filter out past slots
        const now = new Date();
        const isToday = selectedDate.toDateString() === now.toDateString();
        const currentTimeMinutes = isToday
          ? now.getHours() * 60 + now.getMinutes()
          : 0;

        while (currentMinutes + duration <= endMinutes) {
          const hours = Math.floor(currentMinutes / 60);
          const mins = currentMinutes % 60;
          const timeStr = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;

          // Mark slot as unavailable if it's in the past (for today) or already booked
          const isPastSlot = isToday && currentMinutes <= currentTimeMinutes;

          slots.push({
            time: timeStr,
            available: !bookedTimes.has(timeStr) && !isPastSlot,
          });

          currentMinutes += duration;
        }

        setAvailableSlots(slots);
      } catch (error) {
        console.error("Error fetching slots:", error);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDoctor, selectedDate, doctors, supabase]);

  const bookAppointment = async () => {
    if (!profile?.id || !selectedDoctor || !selectedDate || !selectedTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setBooking(true);

    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");

      // Get the next token number for this doctor and date
      const { data: existingTokens } = await supabase
        .from("appointments")
        .select("token_number")
        .eq("doctor_id", selectedDoctor)
        .eq("appointment_date", dateStr)
        .order("token_number", { ascending: false })
        .limit(1);

      const nextToken = (existingTokens?.[0]?.token_number || 0) + 1;

      const { error } = await supabase.from("appointments").insert({
        patient_id: profile.id,
        doctor_id: selectedDoctor,
        appointment_date: dateStr,
        appointment_time: selectedTime,
        status: "pending",
        token_number: nextToken,
        notes: appointmentNotes || null,
      });

      if (error) throw error;

      toast.success(`Appointment booked! Your token number is ${nextToken}`);
      setShowBookDialog(false);
      resetBookingForm();
      await fetchAppointments();
    } catch (error: any) {
      console.error("Error booking appointment:", error);
      toast.error(error.message || "Failed to book appointment");
    } finally {
      setBooking(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointmentId);

      if (error) throw error;

      toast.success("Appointment cancelled");
      await fetchAppointments();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error("Failed to cancel appointment");
    }
  };

  const resetBookingForm = () => {
    setSelectedDepartment("");
    setSelectedDoctor("");
    setSelectedDate(undefined);
    setSelectedTime("");
    setAppointmentNotes("");
    setAvailableSlots([]);
  };

  const upcomingAppointments = appointments.filter(
    (a) => a.status === "pending" || a.status === "confirmed",
  );
  const pastAppointments = appointments.filter(
    (a) => a.status === "completed" || a.status === "cancelled",
  );

  if (isLoading || loadingData) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header Skeleton */}
        <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/patient"
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                  <Heart className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl hidden sm:inline">
                  HealthCare
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-2 rounded-full">
                <User className="w-4 h-4" />
                <span>{profile?.full_name}</span>
              </div>
              <Dialog
                open={showBookDialog}
                onOpenChange={(open) => {
                  setShowBookDialog(open);
                  if (open) {
                    resetBookingForm();
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 shadow-lg transition-all hover:shadow-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    Book Appointment
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="pb-4 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                        <CalendarDays className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <DialogTitle className="text-xl">
                          Book an Appointment
                        </DialogTitle>
                        <DialogDescription>
                          Select your preferred department, doctor, and time
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>
                  <div className="space-y-5 py-4">
                    {/* Department Selection */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        Department
                      </Label>
                      <Select
                        value={selectedDepartment}
                        onValueChange={setSelectedDepartment}
                      >
                        <SelectTrigger className="h-12 border-2 border-border focus:border-primary transition-colors">
                          <SelectValue placeholder="Choose a department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem
                              key={dept.id}
                              value={dept.id}
                              className="py-3"
                            >
                              <span className="font-medium">{dept.name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Doctor Selection */}
                    {selectedDepartment && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-chart-1" />
                          Doctor
                        </Label>
                        <Select
                          value={selectedDoctor}
                          onValueChange={setSelectedDoctor}
                        >
                          <SelectTrigger className="h-12 border-2 border-border focus:border-primary transition-colors">
                            <SelectValue placeholder="Select a doctor" />
                          </SelectTrigger>
                          <SelectContent>
                            {doctors.length === 0 ? (
                              <SelectItem value="none" disabled>
                                No doctors available in this department
                              </SelectItem>
                            ) : (
                              doctors.map((doc) => (
                                <SelectItem
                                  key={doc.id}
                                  value={doc.id}
                                  className="py-3"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-chart-1/20 rounded-full flex items-center justify-center">
                                      <User className="w-4 h-4 text-chart-1" />
                                    </div>
                                    <div>
                                      <p className="font-medium">
                                        Dr. {doc.profile?.full_name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {doc.specialization}
                                      </p>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Date Selection */}
                    {selectedDoctor && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-primary" />
                          Select Date
                        </Label>
                        <div className="border-2 border-border rounded-xl p-3 bg-card">
                          <CalendarPicker
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              return date < today || date.getDay() === 0;
                            }}
                            className="mx-auto"
                          />
                        </div>
                      </div>
                    )}

                    {/* Time Slots */}
                    {selectedDate && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <Clock className="w-4 h-4 text-chart-2" />
                          Available Time Slots
                        </Label>
                        {loadingSlots ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        ) : availableSlots.length === 0 ? (
                          <div className="text-center py-8 bg-muted rounded-xl">
                            <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">
                              No slots available for this date
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Try selecting another date
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-2">
                            {availableSlots.map((slot) => (
                              <Button
                                key={slot.time}
                                variant={
                                  selectedTime === slot.time
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                disabled={!slot.available}
                                onClick={() => setSelectedTime(slot.time)}
                                className={`h-10 text-sm font-medium transition-all ${
                                  selectedTime === slot.time
                                    ? "bg-primary border-0 shadow-md"
                                    : slot.available
                                      ? "hover:border-primary/50 hover:bg-primary/10"
                                      : "opacity-40 cursor-not-allowed"
                                }`}
                              >
                                {slot.time}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {selectedTime && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label className="text-sm font-semibold">
                          Additional Notes (Optional)
                        </Label>
                        <Textarea
                          placeholder="Any specific concerns or notes for the doctor..."
                          value={appointmentNotes}
                          onChange={(e) => setAppointmentNotes(e.target.value)}
                          className="min-h-[100px] border-2 border-border focus:border-primary transition-colors resize-none"
                        />
                      </div>
                    )}
                  </div>
                  <DialogFooter className="border-t pt-4 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowBookDialog(false)}
                      className="flex-1 sm:flex-none"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={bookAppointment}
                      disabled={
                        !selectedDoctor ||
                        !selectedDate ||
                        !selectedTime ||
                        booking
                      }
                      className="flex-1 sm:flex-none bg-primary hover:bg-primary/90"
                    >
                      {booking ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Booking...
                        </>
                      ) : (
                        "Confirm Booking"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Page Title */}
        <div className="mb-6">
          <Link
            href="/patient"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground">
            My Appointments
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your healthcare appointments
          </p>
        </div>

        {/* Appointments Tabs */}
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-card/70 backdrop-blur-sm p-1.5 rounded-xl shadow-sm border border-border h-14">
            <TabsTrigger
              value="upcoming"
              className="flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg h-full transition-all font-medium"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Upcoming ({upcomingAppointments.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg h-full transition-all font-medium"
            >
              <Clock className="w-4 h-4" />
              <span>Past ({pastAppointments.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-muted border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      Upcoming Appointments
                    </CardTitle>
                    <CardDescription>
                      Your scheduled consultations
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {upcomingAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <CalendarDays className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No appointments yet
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                      Book your first appointment with one of our healthcare
                      specialists
                    </p>
                    <Button
                      onClick={() => setShowBookDialog(true)}
                      className="bg-primary hover:bg-primary/90 shadow-lg"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Book Your First Appointment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingAppointments.map((apt, index) => (
                      <div
                        key={apt.id}
                        className="group flex items-center justify-between p-5 bg-card rounded-2xl border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                              {apt.token_number ? (
                                <span className="text-primary-foreground font-bold text-lg">
                                  #{apt.token_number}
                                </span>
                              ) : (
                                <Stethoscope className="w-7 h-7 text-primary-foreground" />
                              )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-chart-1 rounded-full border-2 border-card flex items-center justify-center">
                              <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-lg">
                              Dr. {apt.doctor?.profile?.full_name || "Unknown"}
                            </p>
                            <p className="text-primary font-medium text-sm">
                              {apt.doctor?.specialization}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm text-muted-foreground flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-full">
                                <CalendarDays className="w-3.5 h-3.5" />
                                {apt.appointment_date}
                              </span>
                              <span className="text-sm text-muted-foreground flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-full">
                                <Clock className="w-3.5 h-3.5" />
                                {apt.appointment_time}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            className={`px-3 py-1.5 rounded-full font-medium ${
                              apt.status === "confirmed"
                                ? "bg-chart-1/20 text-chart-1 hover:bg-chart-1/20"
                                : "bg-chart-3/20 text-chart-3 hover:bg-chart-3/20"
                            }`}
                          >
                            {apt.status === "confirmed"
                              ? "✓ Confirmed"
                              : apt.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                            onClick={() => cancelAppointment(apt.id)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="past">
            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-muted border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted-foreground rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Past Appointments</CardTitle>
                    <CardDescription>Your appointment history</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {pastAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No history yet
                    </h3>
                    <p className="text-muted-foreground">
                      Your completed appointments will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastAppointments.map((apt, index) => (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between p-5 bg-card rounded-2xl border border-border transition-all duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center">
                            <Stethoscope className="w-7 h-7 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold text-muted-foreground text-lg">
                              Dr. {apt.doctor?.profile?.full_name || "Unknown"}
                            </p>
                            <p className="text-muted-foreground font-medium text-sm">
                              {apt.doctor?.specialization}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5" />
                                {apt.appointment_date}
                              </span>
                              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {apt.appointment_time}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          className={`px-3 py-1.5 rounded-full font-medium ${
                            apt.status === "completed"
                              ? "bg-primary/20 text-primary hover:bg-primary/20"
                              : "bg-destructive/20 text-destructive hover:bg-destructive/20"
                          }`}
                        >
                          {apt.status === "completed"
                            ? "✓ Completed"
                            : apt.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-border bg-card/50">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-2">
          <div className="flex flex-wrap justify-center items-center gap-2 text-sm text-muted-foreground">
            <a
              href="mailto:support@healthcare.com"
              className="hover:text-primary transition-colors"
            >
              support@healthcare.com
            </a>
            <span className="text-muted-foreground/50">|</span>
            <a href="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <span className="text-muted-foreground/50">|</span>
            <a href="/terms" className="hover:text-primary transition-colors">
              Terms
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 HealthCare. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
