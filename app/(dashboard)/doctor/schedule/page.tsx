'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { ArrowLeft, Clock, Save, Plus, Trash2, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface DoctorAvailability {
  id?: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_blocked: boolean;
  reason: string | null;
}

interface DoctorSettings {
  consultation_duration: number;
  max_patients_per_slot: number;
  is_available: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function DoctorSchedulePage() {
  const { profile, isLoading } = useAuth();
  const supabase = createClient();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<DoctorAvailability[]>([]);
  const [settings, setSettings] = useState<DoctorSettings>({
    consultation_duration: 15,
    max_patients_per_slot: 1,
    is_available: true,
  });

  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!profile?.user_id) return;

      try {
        const { data: doctor } = await supabase
          .from('doctors')
          .select('id, consultation_duration, max_patients_per_slot, is_available')
          .eq('user_id', profile.user_id)
          .single();

        if (!doctor) {
          setLoadingData(false);
          return;
        }

        setDoctorId(doctor.id);
        setSettings({
          consultation_duration: doctor.consultation_duration,
          max_patients_per_slot: doctor.max_patients_per_slot,
          is_available: doctor.is_available,
        });

        // Fetch availability
        const { data: availabilityData } = await supabase
          .from('doctor_availability')
          .select('*')
          .eq('doctor_id', doctor.id)
          .order('day_of_week', { ascending: true });

        if (availabilityData) {
          setAvailability(availabilityData);
        }
      } catch (error) {
        console.error('Error fetching doctor data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (profile) {
      fetchDoctorData();
    }
  }, [profile, supabase]);

  const addAvailabilitySlot = () => {
    if (!doctorId) return;

    // Find a day that doesn't have availability yet
    const existingDays = availability.map(a => a.day_of_week);
    const availableDay = DAYS_OF_WEEK.find(d => !existingDays.includes(d.value));

    if (!availableDay) {
      toast.error('All days already have availability set');
      return;
    }

    setAvailability([
      ...availability,
      {
        doctor_id: doctorId,
        day_of_week: availableDay.value,
        start_time: '09:00',
        end_time: '17:00',
        is_blocked: false,
        reason: null,
      },
    ]);
  };

  const updateAvailabilitySlot = (index: number, field: string, value: any) => {
    const updated = [...availability];
    updated[index] = { ...updated[index], [field]: value };
    setAvailability(updated);
  };

  const removeAvailabilitySlot = async (index: number) => {
    const slot = availability[index];

    if (slot.id) {
      // Delete from database
      const { error } = await supabase
        .from('doctor_availability')
        .delete()
        .eq('id', slot.id);

      if (error) {
        toast.error('Failed to delete slot');
        return;
      }
    }

    setAvailability(availability.filter((_, i) => i !== index));
    toast.success('Slot removed');
  };

  const saveSettings = async () => {
    if (!doctorId) return;

    setSaving(true);

    try {
      // Update doctor settings
      const { error: settingsError } = await supabase
        .from('doctors')
        .update({
          consultation_duration: settings.consultation_duration,
          max_patients_per_slot: settings.max_patients_per_slot,
          is_available: settings.is_available,
        })
        .eq('id', doctorId);

      if (settingsError) throw settingsError;

      // Save availability
      for (const slot of availability) {
        if (slot.id) {
          // Update existing
          const { error } = await supabase
            .from('doctor_availability')
            .update({
              day_of_week: slot.day_of_week,
              start_time: slot.start_time,
              end_time: slot.end_time,
              is_blocked: slot.is_blocked,
              reason: slot.reason,
            })
            .eq('id', slot.id);

          if (error) throw error;
        } else {
          // Insert new
          const { data, error } = await supabase
            .from('doctor_availability')
            .insert({
              doctor_id: doctorId,
              day_of_week: slot.day_of_week,
              start_time: slot.start_time,
              end_time: slot.end_time,
              is_blocked: slot.is_blocked,
              reason: slot.reason,
            })
            .select()
            .single();

          if (error) throw error;

          // Update local state with new ID
          const slotIndex = availability.findIndex(a => a === slot);
          if (slotIndex !== -1 && data) {
            const updated = [...availability];
            updated[slotIndex] = data;
            setAvailability(updated);
          }
        }
      }

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
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

  if (!doctorId) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Doctor profile not found. Please contact administrator.</p>
              <Link href="/doctor">
                <Button className="mt-4">Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
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
            <Link href="/doctor">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Schedule</h1>
              <p className="text-muted-foreground">Configure your availability</p>
            </div>
          </div>
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Consultation Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Consultation Settings
            </CardTitle>
            <CardDescription>Configure your consultation preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Available for Appointments</Label>
                <p className="text-sm text-muted-foreground">Toggle to accept new appointments</p>
              </div>
              <Switch
                checked={settings.is_available}
                onCheckedChange={(checked) => setSettings({ ...settings, is_available: checked })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Consultation Duration (minutes)</Label>
                <Select
                  value={settings.consultation_duration.toString()}
                  onValueChange={(value) =>
                    setSettings({ ...settings, consultation_duration: parseInt(value) })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Max Patients per Slot</Label>
                <Select
                  value={settings.max_patients_per_slot.toString()}
                  onValueChange={(value) =>
                    setSettings({ ...settings, max_patients_per_slot: parseInt(value) })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 patient</SelectItem>
                    <SelectItem value="2">2 patients</SelectItem>
                    <SelectItem value="3">3 patients</SelectItem>
                    <SelectItem value="4">4 patients</SelectItem>
                    <SelectItem value="5">5 patients</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Availability */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Weekly Availability
                </CardTitle>
                <CardDescription>Set your working hours for each day</CardDescription>
              </div>
              <Button onClick={addAvailabilitySlot} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Day
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {availability.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No availability set</p>
                <Button onClick={addAvailabilitySlot}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Availability
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {availability.map((slot, index) => (
                  <div
                    key={slot.id || index}
                    className={`p-4 rounded-lg border ${
                      slot.is_blocked ? 'bg-destructive/10 border-destructive/20' : 'bg-muted border-border'
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                      <div>
                        <Label>Day</Label>
                        <Select
                          value={slot.day_of_week.toString()}
                          onValueChange={(value) =>
                            updateAvailabilitySlot(index, 'day_of_week', parseInt(value))
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS_OF_WEEK.map((day) => (
                              <SelectItem key={day.value} value={day.value.toString()}>
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={slot.start_time}
                          onChange={(e) =>
                            updateAvailabilitySlot(index, 'start_time', e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={slot.end_time}
                          onChange={(e) =>
                            updateAvailabilitySlot(index, 'end_time', e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={slot.is_blocked}
                          onCheckedChange={(checked) =>
                            updateAvailabilitySlot(index, 'is_blocked', checked)
                          }
                        />
                        <Label className="text-sm">Blocked</Label>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAvailabilitySlot(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {slot.is_blocked && (
                      <div className="mt-3">
                        <Label>Reason (Optional)</Label>
                        <Input
                          placeholder="e.g., Personal leave, Conference"
                          value={slot.reason || ''}
                          onChange={(e) =>
                            updateAvailabilitySlot(index, 'reason', e.target.value || null)
                          }
                          className="mt-1"
                        />
                      </div>
                    )}
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
