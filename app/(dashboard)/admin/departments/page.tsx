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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { ArrowLeft, Plus, Building2, Edit, Trash2, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  doctor_count?: number;
}

export default function AdminDepartmentsPage() {
  const { isLoading } = useAuth();
  const supabase = createClient();
  const [loadingData, setLoadingData] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const fetchDepartments = async () => {
    try {
      const { data: depts } = await supabase
        .from("departments")
        .select("*")
        .order("name");

      if (depts) {
        // Get doctor counts for each department
        const deptsWithCounts = await Promise.all(
          depts.map(async (dept) => {
            const { count } = await supabase
              .from("doctors")
              .select("*", { count: "exact", head: true })
              .eq("department_id", dept.id);
            return { ...dept, doctor_count: count || 0 };
          }),
        );
        setDepartments(deptsWithCounts);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [supabase]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditingDepartment(null);
  };

  const addDepartment = async () => {
    if (!name.trim()) {
      toast.error("Department name is required");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.from("departments").insert({
        name: name.trim(),
        description: description.trim() || null,
      });

      if (error) throw error;

      toast.success("Department added successfully");
      setShowAddDialog(false);
      resetForm();
      await fetchDepartments();
    } catch (error: any) {
      console.error("Error adding department:", error);
      toast.error(error.message || "Failed to add department");
    } finally {
      setSaving(false);
    }
  };

  const updateDepartment = async () => {
    if (!editingDepartment || !name.trim()) {
      toast.error("Department name is required");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("departments")
        .update({
          name: name.trim(),
          description: description.trim() || null,
        })
        .eq("id", editingDepartment.id);

      if (error) throw error;

      toast.success("Department updated successfully");
      setShowEditDialog(false);
      resetForm();
      await fetchDepartments();
    } catch (error: any) {
      console.error("Error updating department:", error);
      toast.error(error.message || "Failed to update department");
    } finally {
      setSaving(false);
    }
  };

  const deleteDepartment = async (dept: Department) => {
    if (dept.doctor_count && dept.doctor_count > 0) {
      toast.error("Cannot delete department with assigned doctors");
      return;
    }

    if (!confirm(`Are you sure you want to delete "${dept.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("id", dept.id);

      if (error) throw error;

      toast.success("Department deleted successfully");
      await fetchDepartments();
    } catch (error: any) {
      console.error("Error deleting department:", error);
      toast.error(error.message || "Failed to delete department");
    }
  };

  const openEditDialog = (dept: Department) => {
    setEditingDepartment(dept);
    setName(dept.name);
    setDescription(dept.description || "");
    setShowEditDialog(true);
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Manage Departments
              </h1>
              <p className="text-muted-foreground">
                Add and manage hospital departments
              </p>
            </div>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Department</DialogTitle>
                <DialogDescription>
                  Create a new hospital department
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Department Name *</Label>
                  <Input
                    placeholder="e.g., Cardiology"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Brief description of the department..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={addDepartment} disabled={saving}>
                  {saving ? "Adding..." : "Add Department"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Departments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              All Departments
            </CardTitle>
            <CardDescription>
              {departments.length} department
              {departments.length !== 1 ? "s" : ""} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {departments.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No departments yet</p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Department
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Doctors</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {dept.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          <Users className="w-3 h-3" />
                          {dept.doctor_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(dept)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deleteDepartment(dept)}
                            disabled={Boolean(
                              dept.doctor_count && dept.doctor_count > 0,
                            )}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Department</DialogTitle>
              <DialogDescription>
                Update department information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Department Name *</Label>
                <Input
                  placeholder="e.g., Cardiology"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Brief description of the department..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
              <Button onClick={updateDepartment} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
