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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import {
  Bed,
  BedDouble,
  ClipboardList,
  ConciergeBell,
  Layers,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
} from "lucide-react";
import { RoleHeader } from "@/components/layout/RoleHeader";

type RoomType = {
  id: string;
  name: string;
};

type RoomRow = {
  id: string;
  room_number: string;
  floor: number;
  status: string;
  room_types?: { name: string } | null;
};

type Arrival = {
  id: string;
  reservation_code: string;
  last_name: string;
  arrival_date: string;
  room_types?: { name: string } | null;
};

type Profile = {
  id: string;
  role: string;
};

export default function StaffPortalPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [inventory, setInventory] = useState({
    ready: 0,
    cleaning: 0,
    maintenance: 0,
  });
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [guestName, setGuestName] = useState("");
  const [reservationCode, setReservationCode] = useState("");
  const [roomTypeId, setRoomTypeId] = useState<string>("");
  const [floor, setFloor] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const loadDashboard = async () => {
    const roomsResponse = await supabase.from("rooms").select("id, status");
    if (!roomsResponse.error && roomsResponse.data) {
      const counts = roomsResponse.data.reduce(
        (acc, room) => {
          if (room.status === "ready") acc.ready += 1;
          if (room.status === "cleaning") acc.cleaning += 1;
          if (room.status === "maintenance") acc.maintenance += 1;
          return acc;
        },
        { ready: 0, cleaning: 0, maintenance: 0 }
      );
      setInventory(counts);
    }

    const { data: arrivalsData } = await supabase
      .from("reservations")
      .select("id, reservation_code, last_name, arrival_date, room_types(name)")
      .eq("arrival_date", today)
      .order("reservation_code");
    const normalizedArrivals: Arrival[] = (arrivalsData || []).map(
      (arrival: any) => ({
        ...arrival,
        room_types: Array.isArray(arrival.room_types)
          ? arrival.room_types[0] ?? null
          : arrival.room_types,
      })
    );
    setArrivals(normalizedArrivals);

    const { data: roomData } = await supabase
      .from("rooms")
      .select("id, room_number, floor, status, room_types(name)")
      .order("room_number");
    const normalizedRooms: RoomRow[] = (roomData || []).map((room: any) => ({
      ...room,
      room_types: Array.isArray(room.room_types)
        ? room.room_types[0] ?? null
        : room.room_types,
    }));
    setRooms(normalizedRooms);
  };

  useEffect(() => {
    const ensureAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (profileData) {
        setProfile(profileData);
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
    loadDashboard();
  }, [router, supabase]);

  const handleUpdateStatus = async (roomId: string, nextStatus: string) => {
    try {
      const { error } = await supabase
        .from("rooms")
        .update({ status: nextStatus })
        .eq("id", roomId);

      if (error) throw error;
      toast.success(`Room status set to ${nextStatus}`);
      await loadDashboard();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const handleCreateAssignment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!guestName.trim() || !reservationCode.trim()) {
      toast.error("Guest name and reservation code are required");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        guest_name: guestName.trim(),
        reservation_code: reservationCode.trim(),
        room_type_id: roomTypeId || null,
        floor: floor ? Number(floor) : null,
        notes: notes || null,
        status: "pending",
        staff_id: profile?.id || null,
      };

      const { error } = await supabase
        .from("room_assignments")
        .insert(payload);

      if (error) throw error;

      toast.success("Room allocation saved");
      setGuestName("");
      setReservationCode("");
      setRoomTypeId("");
      setFloor("");
      setNotes("");
      await loadDashboard();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save room allocation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/20 pb-12">
      {/* Unified Top Navigation */}
      <RoleHeader currentRole="staff" />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 space-y-8">
        {/* Staff Operations Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 glass-card p-6 sm:p-8 glow-teal">
          <div className="absolute -top-16 -right-16 size-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 gap-1.5">
                  <Bed className="size-3.5" />
                  Property Operations
                </Badge>
                <span className="text-xs text-muted-foreground">• Housekeeping & Allocation</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground">
                Staff Operations Portal 🛎️
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl">
                Monitor real-time room readiness, allocate check-in arrivals, update housekeeping statuses, and dispatch staff tasks.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/50 p-4 backdrop-blur-sm">
              <div className="size-12 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rooms Ready</p>
                <p className="font-display text-xl font-bold text-foreground">{inventory.ready} Units</p>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{inventory.cleaning} cleaning in progress</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card border-border/60 hover:border-emerald-500/40 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Rooms Ready
              </CardTitle>
              <div className="size-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {inventory.ready}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Available for check-in</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/60 hover:border-amber-500/40 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Cleaning in Progress
              </CardTitle>
              <div className="size-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-bold text-amber-600 dark:text-amber-400">
                {inventory.cleaning}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Housekeeping active</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/60 hover:border-rose-500/40 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Maintenance Required
              </CardTitle>
              <div className="size-10 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <AlertTriangle className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-bold text-rose-600 dark:text-rose-400">
                {inventory.maintenance}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Engineering maintenance</p>
            </CardContent>
          </Card>
        </div>

        {/* Room Assignment Form & Arrivals List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Allocation Form */}
          <Card className="lg:col-span-5 glass-card border-border/60">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Layers className="size-5 text-emerald-500" />
                Allocate Guest Room
              </CardTitle>
              <CardDescription>Assign room allocation for arriving guests</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Guest Full Name</Label>
                  <Input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. John Smith"
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Reservation Code</Label>
                  <Input
                    value={reservationCode}
                    onChange={(e) => setReservationCode(e.target.value)}
                    placeholder="e.g. RES-1001"
                    className="bg-background/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Room Type</Label>
                    <Select value={roomTypeId} onValueChange={setRoomTypeId}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Category..." />
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

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Floor Level</Label>
                    <Input
                      type="number"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      placeholder="3"
                      className="bg-background/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Special Allocation Notes</Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Near elevator, ocean view preference..."
                    className="bg-background/50"
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full gap-2 shadow-lg shadow-emerald-500/20">
                  {isLoading ? "Saving Allocation..." : "Confirm Room Allocation"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Today's Arrivals List */}
          <Card className="lg:col-span-7 glass-card border-border/60">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="size-5 text-emerald-500" />
                Today&apos;s Guest Arrivals Timeline ({arrivals.length})
              </CardTitle>
              <CardDescription>Scheduled check-ins for {today}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {arrivals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No guest arrivals scheduled today.</p>
              ) : (
                <div className="space-y-3">
                  {arrivals.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-background/50 hover:border-emerald-500/40 transition-all"
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {a.last_name} • <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400">#{a.reservation_code}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Room Category: {a.room_types?.name || "Standard Room"}
                        </p>
                      </div>

                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
                        Arrival Today
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Room Inventory & Status Grid */}
        <Card className="glass-card border-border/60">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Building className="size-5 text-emerald-500" />
              Property Room Inventory & Housekeeping Controls
            </CardTitle>
            <CardDescription>Update live room status for all floors</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {rooms.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No room records configured.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-4 rounded-2xl border border-border/50 bg-background/50 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-lg text-foreground">
                        Room {room.room_number}
                      </span>
                      <Badge
                        variant="outline"
                        className={`capitalize text-[10px] ${
                          room.status === "ready"
                            ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
                            : room.status === "cleaning"
                            ? "border-amber-500/30 text-amber-600 bg-amber-500/10"
                            : "border-rose-500/30 text-rose-600 bg-rose-500/10"
                        }`}
                      >
                        {room.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Floor {room.floor} • {room.room_types?.name || "Standard Room"}
                    </p>

                    <div className="flex gap-1 pt-1">
                      <Button
                        size="sm"
                        variant={room.status === "ready" ? "default" : "outline"}
                        onClick={() => handleUpdateStatus(room.id, "ready")}
                        className="text-[10px] h-7 px-2 flex-1"
                      >
                        Ready
                      </Button>
                      <Button
                        size="sm"
                        variant={room.status === "cleaning" ? "default" : "outline"}
                        onClick={() => handleUpdateStatus(room.id, "cleaning")}
                        className="text-[10px] h-7 px-2 flex-1"
                      >
                        Cleaning
                      </Button>
                      <Button
                        size="sm"
                        variant={room.status === "maintenance" ? "default" : "outline"}
                        onClick={() => handleUpdateStatus(room.id, "maintenance")}
                        className="text-[10px] h-7 px-2 flex-1"
                      >
                        Maint.
                      </Button>
                    </div>
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
