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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
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
  Stethoscope,
  Edit,
  Trash2,
  Building2,
  UserCheck,
  UserX,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Department {
  id: string;
  name: string;
}

interface DoctorWithDetails {
  id: string;
  user_id: string;
  profile_id: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_duration: number;
  max_patients_per_slot: number;
  is_available: boolean;
  bio: string | null;
  department: {
    id: string;
    name: string;
  };
  profile: {
    full_name: string;
    email: string;
    phone: string | null;
  };
}

interface PendingDoctor {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
}

export default function AdminDoctorsPage() {
  const { isLoading } = useAuth();
  const supabase = createClient();
  const [loadingData, setLoadingData] = useState(true);
  const [doctors, setDoctors] = useState<DoctorWithDetails[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [pendingDoctors, setPendingDoctors] = useState<PendingDoctor[]>([]);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedPending, setSelectedPending] = useState<PendingDoctor | null>(
    null,
  );
  const [editingDoctor, setEditingDoctor] = useState<DoctorWithDetails | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  // Form state
  const [departmentId, setDepartmentId] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [qualification, setQualification] = useState("");
  const [experienceYears, setExperienceYears] = useState("0");
  const [consultationDuration, setConsultationDuration] = useState("15");
  const [maxPatientsPerSlot, setMaxPatientsPerSlot] = useState("1");
  const [bio, setBio] = useState("");

  const fetchData = async () => {
    try {
      // Fetch departments
      const { data: deptData } = await supabase
        .from("departments")
        .select("id, name")
        .order("name");

      setDepartments(deptData || []);

      // Fetch doctors with details
      const { data: doctorData, error: doctorError } = await supabase
        .from("doctors")
        .select(
          `
          id,
          user_id,
          profile_id,
          specialization,
          qualification,
          experience_years,
          consultation_duration,
          max_patients_per_slot,
          is_available,
          bio,
          department:departments(id, name),
          profile:profiles!doctors_profile_id_fkey(full_name, email, phone)
        `,
        )
        .order("created_at", { ascending: false });

      if (doctorError) {
        console.error("Error fetching doctors:", doctorError);
      }

      // Transform the data to match our interface (handle array vs object from Supabase)
      const transformedDoctors = (doctorData || []).map((doc: any) => ({
        ...doc,
        department: Array.isArray(doc.department)
          ? doc.department[0]
          : doc.department,
        profile: Array.isArray(doc.profile) ? doc.profile[0] : doc.profile,
      }));

      setDoctors(transformedDoctors as DoctorWithDetails[]);

      // Get list of user_ids that are already doctors
      const existingDoctorUserIds = transformedDoctors.map(
        (d: any) => d.user_id,
      );

      // Fetch profiles with role='doctor' that don't have a doctor record yet
      let pendingQuery = supabase
        .from("profiles")
        .select("id, user_id, full_name, email")
        .eq("role", "doctor");

      // Only filter if there are existing doctors
      if (existingDoctorUserIds.length > 0) {
        pendingQuery = pendingQuery.not(
          "user_id",
          "in",
          `(${existingDoctorUserIds.join(",")})`,
        );
      }

      const { data: pendingData, error: pendingError } = await pendingQuery;

      if (pendingError) {
        console.error("Error fetching pending doctors:", pendingError);
      }

      setPendingDoctors(pendingData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [supabase]);

  const resetForm = () => {
    setDepartmentId("");
    setSpecialization("");
    setQualification("");
    setExperienceYears("0");
    setConsultationDuration("15");
    setMaxPatientsPerSlot("1");
    setBio("");
    setSelectedPending(null);
    setEditingDoctor(null);
  };

  const approveDoctor = async () => {
    if (
      !selectedPending ||
      !departmentId ||
      !specialization ||
      !qualification
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);

    try {
      const { data: newDoctor, error } = await supabase
        .from("doctors")
        .insert({
          user_id: selectedPending.user_id,
          profile_id: selectedPending.id,
          department_id: departmentId,
          specialization,
          qualification,
          experience_years: parseInt(experienceYears),
          consultation_duration: parseInt(consultationDuration),
          max_patients_per_slot: parseInt(maxPatientsPerSlot),
          bio: bio || null,
          is_available: true,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Create default availability for weekdays (Monday-Friday, 9 AM - 5 PM)
      if (newDoctor) {
        const defaultAvailability = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
          doctor_id: newDoctor.id,
          day_of_week: dayOfWeek,
          start_time: "09:00",
          end_time: "17:00",
          is_blocked: false,
        }));

        await supabase.from("doctor_availability").insert(defaultAvailability);
      }

      toast.success(
        `${selectedPending.full_name} has been approved as a doctor`,
      );
      setShowApproveDialog(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      console.error("Error approving doctor:", error);
      toast.error(error.message || "Failed to approve doctor");
    } finally {
      setSaving(false);
    }
  };

  const updateDoctor = async () => {
    if (!editingDoctor || !departmentId || !specialization || !qualification) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("doctors")
        .update({
          department_id: departmentId,
          specialization,
          qualification,
          experience_years: parseInt(experienceYears),
          consultation_duration: parseInt(consultationDuration),
          max_patients_per_slot: parseInt(maxPatientsPerSlot),
          bio: bio || null,
        })
        .eq("id", editingDoctor.id);

      if (error) throw error;

      toast.success("Doctor updated successfully");
      setShowEditDialog(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      console.error("Error updating doctor:", error);
      toast.error(error.message || "Failed to update doctor");
    } finally {
      setSaving(false);
    }
  };

  const toggleDoctorAvailability = async (doctor: DoctorWithDetails) => {
    try {
      const { error } = await supabase
        .from("doctors")
        .update({ is_available: !doctor.is_available })
        .eq("id", doctor.id);

      if (error) throw error;

      toast.success(
        doctor.is_available
          ? "Doctor marked as unavailable"
          : "Doctor marked as available",
      );
      await fetchData();
    } catch (error: any) {
      console.error("Error toggling availability:", error);
      toast.error("Failed to update availability");
    }
  };

  const deleteDoctor = async (doctor: DoctorWithDetails) => {
    if (
      !confirm(
        `Are you sure you want to remove ${doctor.profile?.full_name} as a doctor?`,
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("doctors")
        .delete()
        .eq("id", doctor.id);

      if (error) throw error;

      toast.success("Doctor removed successfully");
      await fetchData();
    } catch (error: any) {
      console.error("Error deleting doctor:", error);
      toast.error(error.message || "Failed to remove doctor");
    }
  };

  const initializeAvailability = async (doctor: DoctorWithDetails) => {
    try {
      // Check if doctor already has availability
      const { data: existing } = await supabase
        .from("doctor_availability")
        .select("id")
        .eq("doctor_id", doctor.id)
        .limit(1);

      if (existing && existing.length > 0) {
        toast.info("Doctor already has availability configured");
        return;
      }

      // Create default availability for weekdays (Monday-Friday, 9 AM - 5 PM)
      const defaultAvailability = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
        doctor_id: doctor.id,
        day_of_week: dayOfWeek,
        start_time: "09:00",
        end_time: "17:00",
        is_blocked: false,
      }));

      const { error } = await supabase
        .from("doctor_availability")
        .insert(defaultAvailability);

      if (error) throw error;

      toast.success(
        `Default availability created for Dr. ${doctor.profile?.full_name}`,
      );
    } catch (error: any) {
      console.error("Error initializing availability:", error);
      toast.error(error.message || "Failed to initialize availability");
    }
  };

  const openApproveDialog = (pending: PendingDoctor) => {
    resetForm();
    setSelectedPending(pending);
    setShowApproveDialog(true);
  };

  const openEditDialog = (doctor: DoctorWithDetails) => {
    setEditingDoctor(doctor);
    setDepartmentId(doctor.department?.id || "");
    setSpecialization(doctor.specialization);
    setQualification(doctor.qualification);
    setExperienceYears(doctor.experience_years.toString());
    setConsultationDuration(doctor.consultation_duration.toString());
    setMaxPatientsPerSlot(doctor.max_patients_per_slot.toString());
    setBio(doctor.bio || "");
    setShowEditDialog(true);
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
              Manage Doctors
            </h1>
            <p className="text-muted-foreground">
              Approve and manage doctor profiles
            </p>
          </div>
        </div>

        {/* Pending Approvals */}
        {pendingDoctors.length > 0 && (
          <Card className="mb-6 border-chart-3/50 bg-chart-3/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-chart-3">
                <UserCheck className="w-5 h-5" />
                Pending Approvals ({pendingDoctors.length})
              </CardTitle>
              <CardDescription className="text-chart-3/80">
                These users registered as doctors and need approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingDoctors.map((pending) => (
                  <div
                    key={pending.id}
                    className="flex items-center justify-between p-3 bg-card rounded-lg border border-chart-3/30"
                  >
                    <div>
                      <p className="font-medium">{pending.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {pending.email}
                      </p>
                    </div>
                    <Button onClick={() => openApproveDialog(pending)}>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Doctors Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              All Doctors
            </CardTitle>
            <CardDescription>
              {doctors.length} doctor{doctors.length !== 1 ? "s" : ""} in the
              system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {doctors.length === 0 ? (
              <div className="text-center py-8">
                <Stethoscope className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No doctors in the system yet
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctors.map((doctor) => (
                      <TableRow key={doctor.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {doctor.profile?.full_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {doctor.profile?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <Building2 className="w-3 h-3" />
                            {doctor.department?.name || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>{doctor.specialization}</TableCell>
                        <TableCell>{doctor.experience_years} years</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              doctor.is_available ? "default" : "secondary"
                            }
                          >
                            {doctor.is_available ? "Available" : "Unavailable"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => initializeAvailability(doctor)}
                              title="Initialize Schedule (Mon-Fri 9-5)"
                            >
                              <Clock className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleDoctorAvailability(doctor)}
                              title={
                                doctor.is_available
                                  ? "Mark Unavailable"
                                  : "Mark Available"
                              }
                            >
                              {doctor.is_available ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditDialog(doctor)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => deleteDoctor(doctor)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approve Doctor Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Approve Doctor</DialogTitle>
              <DialogDescription>
                Set up profile for {selectedPending?.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label>Department *</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Specialization *</Label>
                <Input
                  placeholder="e.g., Cardiologist"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Qualification *</Label>
                <Input
                  placeholder="e.g., MBBS, MD"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Experience (years)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Consultation Duration</Label>
                  <Select
                    value={consultationDuration}
                    onValueChange={setConsultationDuration}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 min</SelectItem>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="20">20 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">60 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Max Patients per Slot</Label>
                <Select
                  value={maxPatientsPerSlot}
                  onValueChange={setMaxPatientsPerSlot}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Bio (Optional)</Label>
                <Textarea
                  placeholder="Brief bio about the doctor..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowApproveDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={approveDoctor} disabled={saving}>
                {saving ? "Approving..." : "Approve Doctor"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Doctor Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Doctor</DialogTitle>
              <DialogDescription>
                Update profile for {editingDoctor?.profile?.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label>Department *</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Specialization *</Label>
                <Input
                  placeholder="e.g., Cardiologist"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Qualification *</Label>
                <Input
                  placeholder="e.g., MBBS, MD"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Experience (years)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Consultation Duration</Label>
                  <Select
                    value={consultationDuration}
                    onValueChange={setConsultationDuration}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 min</SelectItem>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="20">20 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">60 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Max Patients per Slot</Label>
                <Select
                  value={maxPatientsPerSlot}
                  onValueChange={setMaxPatientsPerSlot}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Bio (Optional)</Label>
                <Textarea
                  placeholder="Brief bio about the doctor..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={updateDoctor} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
