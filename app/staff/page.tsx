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
  ArrowRight,
  BedDouble,
  ClipboardList,
  ConciergeBell,
  Layers,
  ShieldCheck,
  Users,
} from "lucide-react";

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
        { ready: 0, cleaning: 0, maintenance: 0 },
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
          ? (arrival.room_types[0] ?? null)
          : arrival.room_types,
      }),
    );
    setArrivals(normalizedArrivals);

    const { data: roomData } = await supabase
      .from("rooms")
      .select("id, room_number, floor, status, room_types(name)")
      .order("room_number");
    const normalizedRooms: RoomRow[] = (roomData || []).map((room: any) => ({
      ...room,
      room_types: Array.isArray(room.room_types)
        ? (room.room_types[0] ?? null)
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
      const { data } = await supabase
        .from("room_types")
        .select("id, name")
        .order("name");
      setRoomTypes(data || []);
    };

    ensureAuth();
    loadRoomTypes();
    loadDashboard();
  }, [router, supabase]);

  const handleAllocateRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reservationCode.trim()) {
      toast.error("Enter reservation code");
      return;
    }
    if (!profile) {
      toast.error("Profile not found");
      return;
    }

    setIsLoading(true);
    try {
      const { data: reservation, error: reservationError } = await supabase
        .from("reservations")
        .select("id, room_type_id")
        .eq("reservation_code", reservationCode.trim())
        .maybeSingle();

      if (reservationError || !reservation) {
        toast.error("Reservation not found");
        return;
      }

      let roomQuery = supabase
        .from("rooms")
        .select("id, status")
        .eq("status", "ready")
        .order("room_number")
        .limit(1);

      if (roomTypeId) {
        roomQuery = roomQuery.eq("room_type_id", roomTypeId);
      }
      if (floor) {
        roomQuery = roomQuery.eq("floor", Number(floor));
      }

      const { data: availableRooms } = await roomQuery;
      const selectedRoom = availableRooms?.[0];

      if (!selectedRoom) {
        toast.error("No available room for this selection");
        return;
      }

      const { error: allocationError } = await supabase
        .from("room_allocations")
        .insert({
          reservation_id: reservation.id,
          room_id: selectedRoom.id,
          staff_profile_id: profile.id,
          notes: notes.trim() || null,
        });

      if (allocationError) {
        toast.error(allocationError.message);
        return;
      }

      await supabase
        .from("rooms")
        .update({ status: "occupied" })
        .eq("id", selectedRoom.id);

      await supabase
        .from("reservations")
        .update({
          status: "confirmed",
          room_type_id: roomTypeId || reservation.room_type_id,
        })
        .eq("id", reservation.id);

      toast.success("Room assigned successfully");
      setGuestName("");
      setReservationCode("");
      setNotes("");
      setFloor("");
      setRoomTypeId("");
      loadDashboard();
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthorized = profile?.role === "admin" || profile?.role === "staff";

  const handleRoomStatusChange = async (roomId: string, status: string) => {
    const { error } = await supabase
      .from("rooms")
      .update({ status })
      .eq("id", roomId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Room status updated");
      loadDashboard();
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Button asChild variant="ghost" className="w-fit px-0">
          <Link href="/">
            <ArrowRight className="size-4 rotate-180" />
            Back to home
          </Link>
        </Button>

        <Card>
          <CardHeader className="gap-4">
            <Badge variant="secondary" className="w-fit">
              <ConciergeBell className="size-3" />
              Staff portal
            </Badge>
            <div className="space-y-3">
              <CardTitle className="font-display text-4xl">
                Room allocation command
              </CardTitle>
              <CardDescription className="max-w-2xl text-base">
                Assign rooms, coordinate housekeeping, and balance arrivals with
                real-time availability.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>

        {!isAuthorized && (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              Your account does not have staff access. Please contact an
              administrator.
            </CardContent>
          </Card>
        )}

        {isAuthorized && (
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  Allocate room
                </CardTitle>
                <CardDescription>
                  Match available rooms to arriving reservations and record
                  allocation notes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <form onSubmit={handleAllocateRoom} className="space-y-5">
                  <div className="space-y-2">
                    <Label>Guest name</Label>
                    <Input
                      placeholder="Aisha Khan"
                      className="h-11"
                      value={guestName}
                      onChange={(event) => setGuestName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reservation ID</Label>
                    <Input
                      placeholder="AR-2391"
                      className="h-11"
                      value={reservationCode}
                      onChange={(event) =>
                        setReservationCode(event.target.value)
                      }
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Room type</Label>
                      <Select value={roomTypeId} onValueChange={setRoomTypeId}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Floor</Label>
                      <Select value={floor} onValueChange={setFloor}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select floor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">Level 3</SelectItem>
                          <SelectItem value="4">Level 4</SelectItem>
                          <SelectItem value="6">Level 6</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input
                      placeholder="Near elevator, late arrival"
                      className="h-11"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full h-11 bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? "Assigning..." : "Assign room"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BedDouble className="w-5 h-5 text-chart-1" />
                    Live inventory
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4 text-sm">
                  {[
                    ["Ready", inventory.ready],
                    ["Cleaning", inventory.cleaning],
                    ["Maintenance", inventory.maintenance],
                  ].map(([label, value]) => (
                    <Card key={String(label)}>
                      <CardContent className="pt-6">
                        <p className="text-muted-foreground">{label}</p>
                        <p className="text-2xl font-display">{value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5 text-chart-2" />
                    Arrivals queue
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={loadDashboard}>
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Guest</TableHead>
                        <TableHead>Arrival</TableHead>
                        <TableHead>Room type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {arrivals.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center text-muted-foreground"
                          >
                            No arrivals today
                          </TableCell>
                        </TableRow>
                      )}
                      {arrivals.map((arrival) => (
                        <TableRow key={arrival.id}>
                          <TableCell>{arrival.last_name}</TableCell>
                          <TableCell>{arrival.arrival_date}</TableCell>
                          <TableCell>
                            {arrival.room_types?.name || "Unassigned"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BedDouble className="w-5 h-5 text-chart-1" />
                    Rooms overview
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={loadDashboard}>
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Room</TableHead>
                        <TableHead>Floor</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rooms.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-muted-foreground"
                          >
                            No rooms found
                          </TableCell>
                        </TableRow>
                      )}
                      {rooms.map((room) => (
                        <TableRow key={room.id}>
                          <TableCell>{room.room_number}</TableCell>
                          <TableCell>{room.floor}</TableCell>
                          <TableCell>
                            {room.room_types?.name || "Unassigned"}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={room.status}
                              onValueChange={(value) =>
                                handleRoomStatusChange(room.id, value)
                              }
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ready">Ready</SelectItem>
                                <SelectItem value="cleaning">
                                  Cleaning
                                </SelectItem>
                                <SelectItem value="maintenance">
                                  Maintenance
                                </SelectItem>
                                <SelectItem value="occupied">
                                  Occupied
                                </SelectItem>
                                <SelectItem value="out_of_service">
                                  Out of service
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="w-4 h-4 text-primary" />
                Allocation rules
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Automatic grouping by stay length and VIP tier.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="w-4 h-4 text-chart-3" />
                Access control
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Staff roles with audit trails on every room update.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="w-4 h-4 text-chart-4" />
                Housekeeping sync
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Inspection checklists and turn-down scheduling.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
