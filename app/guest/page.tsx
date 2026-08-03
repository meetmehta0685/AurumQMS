"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import {
  Bell,
  CalendarCheck,
  ConciergeBell,
  MapPin,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  Bed,
} from "lucide-react";
import { RoleHeader } from "@/components/layout/RoleHeader";

type RoomType = {
  id: string;
  name: string;
};

type Reservation = {
  id: string;
  reservation_code: string;
  arrival_date: string;
  departure_date: string;
  status: string;
  early_check_in: boolean;
  preference_notes: string | null;
  room_type_id: string | null;
  room_types?: { name: string } | null;
};

type ServiceRequest = {
  id: string;
  request_type: string;
  details: string | null;
  status: string;
  created_at: string;
};

export default function GuestPortalPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [reservationCode, setReservationCode] = useState("");
  const [lastName, setLastName] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [roomTypeId, setRoomTypeId] = useState<string>("");
  const [earlyCheckIn, setEarlyCheckIn] = useState(false);
  const [preferenceNotes, setPreferenceNotes] = useState("");
  const [requestType, setRequestType] = useState("");
  const [requestDetails, setRequestDetails] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const ensureAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
    };

    const loadRoomTypes = async () => {
      const { data, error } = await supabase
        .from("room_types")
        .select("id, name")
        .order("name");
      if (!error && data) {
        setRoomTypes(data);
      }
    };

    ensureAuth();
    loadRoomTypes();
  }, [router, supabase]);

  const loadServiceRequests = async (reservationId: string) => {
    const { data, error } = await supabase
      .from("service_requests")
      .select("id, request_type, details, status, created_at")
      .eq("reservation_id", reservationId)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setServiceRequests(data);
    }
  };

  const handleLookup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reservationCode.trim() || !lastName.trim()) {
      toast.error("Enter reservation code and last name");
      return;
    }

    setIsLoading(true);
    try {
      let query = supabase
        .from("reservations")
        .select(
          "id, reservation_code, arrival_date, departure_date, status, early_check_in, preference_notes, room_type_id, room_types(name)"
        )
        .eq("reservation_code", reservationCode.trim())
        .ilike("last_name", lastName.trim());

      if (arrivalDate) {
        query = query.eq("arrival_date", arrivalDate);
      }

      const { data, error } = await query.maybeSingle();

      if (error || !data) {
        setReservation(null);
        toast.error("Reservation not found for this account");
        return;
      }

      const res: Reservation = {
        id: data.id,
        reservation_code: data.reservation_code,
        arrival_date: data.arrival_date,
        departure_date: data.departure_date,
        status: data.status,
        early_check_in: data.early_check_in,
        preference_notes: data.preference_notes,
        room_type_id: data.room_type_id,
        room_types: Array.isArray(data.room_types)
          ? data.room_types[0]
          : data.room_types,
      };

      setReservation(res);
      setRoomTypeId(res.room_type_id || "");
      setEarlyCheckIn(res.early_check_in);
      setPreferenceNotes(res.preference_notes || "");
      toast.success("Reservation details loaded");
      await loadServiceRequests(res.id);
    } catch (err: any) {
      console.error(err);
      toast.error("Lookup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePreferences = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reservation) return;

    try {
      const { error } = await supabase
        .from("reservations")
        .update({
          room_type_id: roomTypeId || null,
          early_check_in: earlyCheckIn,
          preference_notes: preferenceNotes || null,
        })
        .eq("id", reservation.id);

      if (error) throw error;
      toast.success("Stay preferences updated");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update preferences");
    }
  };

  const handleCreateRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reservation || !requestType) {
      toast.error("Select a service request type");
      return;
    }

    try {
      const { error } = await supabase.from("service_requests").insert({
        reservation_id: reservation.id,
        request_type: requestType,
        details: requestDetails || null,
        status: "open",
      });

      if (error) throw error;
      toast.success("Concierge request sent to property staff");
      setRequestType("");
      setRequestDetails("");
      await loadServiceRequests(reservation.id);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to submit request");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/20 pb-12">
      {/* Unified Top Navigation */}
      <RoleHeader currentRole="guest" />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 space-y-8">
        {/* Luxury Hospitality Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-rose-500/30 glass-card p-6 sm:p-8 glow-rose">
          <div className="absolute -top-16 -right-16 size-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10 gap-1.5">
                  <ConciergeBell className="size-3.5" />
                  Luxury Guest Suite
                </Badge>
                <span className="text-xs text-muted-foreground">• Hospitality Concierge</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground">
                Welcome to Aurum Stay ✨
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl">
                Manage your stay preferences, check reservation status, request housekeeping amenities, and communicate with the concierge.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/50 p-4 backdrop-blur-sm">
              <div className="size-12 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Sparkles className="size-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Guest Services</p>
                <p className="font-display text-lg font-bold text-foreground">24/7 Digital Concierge</p>
                <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Ready at your service</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reservation Lookup Section */}
        <Card className="glass-card border-border/60">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Search className="size-5 text-rose-500" />
              Lookup Reservation
            </CardTitle>
            <CardDescription>Enter your reservation code and registered last name</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleLookup} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Reservation Code</Label>
                <Input
                  value={reservationCode}
                  onChange={(e) => setReservationCode(e.target.value)}
                  placeholder="e.g. RES-1001"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Guest Last Name</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Smith"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Arrival Date (Optional)</Label>
                <Input
                  type="date"
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <Button type="submit" disabled={isLoading} className="sm:col-span-3 gap-2 shadow-lg shadow-rose-500/20">
                {isLoading ? "Searching Reservation..." : "Lookup Reservation File"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Active Reservation Details & Service Request Cards */}
        {reservation && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Stay Preferences Card */}
            <Card className="glass-card border-border/60">
              <CardHeader className="border-b border-border/40 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <CalendarCheck className="size-5 text-rose-500" />
                    Reservation #{reservation.reservation_code}
                  </CardTitle>
                  <Badge variant="outline" className="border-rose-500/30 text-rose-600 bg-rose-500/10 capitalize">
                    {reservation.status}
                  </Badge>
                </div>
                <CardDescription>
                  Arrival: {reservation.arrival_date} • Departure: {reservation.departure_date}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <form onSubmit={handleUpdatePreferences} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Preferred Room Category</Label>
                    <Select value={roomTypeId} onValueChange={setRoomTypeId}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select room type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {roomTypes.map((rt) => (
                          <SelectItem key={rt.id} value={rt.id}>
                            {rt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-border/50 p-3 bg-background/40">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-semibold">Request Early Check-in</Label>
                      <p className="text-[11px] text-muted-foreground">Subject to housekeeping room readiness</p>
                    </div>
                    <Switch checked={earlyCheckIn} onCheckedChange={setEarlyCheckIn} />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Special Preferences / Pillow & Dietary Notes</Label>
                    <Textarea
                      value={preferenceNotes}
                      onChange={(e) => setPreferenceNotes(e.target.value)}
                      placeholder="Extra pillows, high floor room, feather-free bed..."
                      className="bg-background/50 min-h-20"
                    />
                  </div>

                  <Button type="submit" className="w-full gap-2 shadow-lg shadow-rose-500/20">
                    Save Stay Preferences
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Service Requests Panel */}
            <Card className="glass-card border-border/60">
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Bell className="size-5 text-rose-500" />
                  Concierge & Service Requests
                </CardTitle>
                <CardDescription>Request amenities or room service directly to staff</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <form onSubmit={handleCreateRequest} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Request Type</Label>
                    <Select value={requestType} onValueChange={setRequestType}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select service..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Extra Towels">Extra Towels & Linens</SelectItem>
                        <SelectItem value="Housekeeping">Housekeeping Refurbish</SelectItem>
                        <SelectItem value="Luggage Assistance">Luggage Assistance</SelectItem>
                        <SelectItem value="Room Service">In-Room Dining</SelectItem>
                        <SelectItem value="Maintenance">Maintenance Check</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Details / Instructions</Label>
                    <Textarea
                      value={requestDetails}
                      onChange={(e) => setRequestDetails(e.target.value)}
                      placeholder="Specify timing or item details..."
                      className="bg-background/50 min-h-16"
                    />
                  </div>

                  <Button type="submit" className="w-full gap-2 shadow-lg shadow-rose-500/20">
                    Dispatch Request to Staff
                  </Button>
                </form>

                {/* Submitted Requests List */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Request History</p>
                  {serviceRequests.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No active service requests.</p>
                  ) : (
                    <div className="space-y-2">
                      {serviceRequests.map((sr) => (
                        <div key={sr.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/50 text-xs">
                          <div>
                            <p className="font-semibold text-foreground">{sr.request_type}</p>
                            {sr.details && <p className="text-muted-foreground">{sr.details}</p>}
                          </div>
                          <Badge variant="outline" className="capitalize border-rose-500/30 text-rose-600 bg-rose-500/10">
                            {sr.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
