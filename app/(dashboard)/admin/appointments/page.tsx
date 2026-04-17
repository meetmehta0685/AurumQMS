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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Search,
  Clock,
  User,
  Stethoscope,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { format } from "date-fns";

interface AppointmentWithDetails {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  token_number: number | null;
  notes: string | null;
  patient: {
    full_name: string;
    email: string;
  } | null;
  doctor: {
    specialization: string;
    profile: {
      full_name: string;
    } | null;
  } | null;
}

export default function AdminAppointmentsPage() {
  const { isLoading } = useAuth();
  const supabase = createClient();
  const [loadingData, setLoadingData] = useState(true);
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>(
    [],
  );
  const [filteredAppointments, setFilteredAppointments] = useState<
    AppointmentWithDetails[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          appointment_date,
          appointment_time,
          status,
          token_number,
          notes,
          patient:profiles!appointments_patient_id_fkey(full_name, email),
          doctor:doctors(
            specialization,
            profile:profiles!doctors_profile_id_fkey(full_name)
          )
        `,
        )
        .order("appointment_date", { ascending: false })
        .order("appointment_time", { ascending: true });

      if (error) {
        console.error("Error fetching appointments:", error);
        return;
      }

      // Transform the data to handle Supabase's array format
      const transformedData = (data || []).map((apt: any) => ({
        ...apt,
        patient: Array.isArray(apt.patient) ? apt.patient[0] : apt.patient,
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

      setAppointments(transformedData);
      setFilteredAppointments(transformedData);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [supabase]);

  useEffect(() => {
    let filtered = [...appointments];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.patient?.full_name?.toLowerCase().includes(term) ||
          apt.doctor?.profile?.full_name?.toLowerCase().includes(term) ||
          apt.doctor?.specialization?.toLowerCase().includes(term),
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    // Apply date filter
    if (dateFilter) {
      filtered = filtered.filter((apt) => apt.appointment_date === dateFilter);
    }

    setFilteredAppointments(filtered);
  }, [searchTerm, statusFilter, dateFilter, appointments]);

  const updateAppointmentStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      await fetchAppointments();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-chart-1/10 text-chart-1 hover:bg-chart-1/10">
            Confirmed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-chart-3/10 text-chart-3 hover:bg-chart-3/10">
            Pending
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-chart-4/10 text-chart-4 hover:bg-chart-4/10">
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              All Appointments
            </h1>
            <p className="text-muted-foreground">
              Monitor and manage all hospital appointments
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search patient or doctor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                placeholder="Filter by date"
              />
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setDateFilter("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appointments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Appointments ({filteredAppointments.length})
            </CardTitle>
            <CardDescription>
              Showing {filteredAppointments.length} of {appointments.length}{" "}
              appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No appointments found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-chart-4/10 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-chart-4" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {apt.patient?.full_name || "Unknown"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {apt.patient?.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-chart-1/10 rounded-full flex items-center justify-center">
                              <Stethoscope className="w-4 h-4 text-chart-1" />
                            </div>
                            <div>
                              <p className="font-medium">
                                Dr.{" "}
                                {apt.doctor?.profile?.full_name || "Unknown"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {apt.doctor?.specialization}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {format(
                                  new Date(apt.appointment_date),
                                  "MMM d, yyyy",
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {apt.appointment_time}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {apt.token_number ? (
                            <Badge variant="outline">#{apt.token_number}</Badge>
                          ) : (
                            <span className="text-muted-foreground/50">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(apt.status)}</TableCell>
                        <TableCell className="text-right">
                          <Select
                            value={apt.status}
                            onValueChange={(value) =>
                              updateAppointmentStatus(apt.id, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">
                                Confirmed
                              </SelectItem>
                              <SelectItem value="completed">
                                Completed
                              </SelectItem>
                              <SelectItem value="cancelled">
                                Cancelled
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
