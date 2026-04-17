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
import { Separator } from "@/components/ui/separator";
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
  ShieldCheck,
  Sparkles,
  Star,
  ArrowRight,
} from "lucide-react";

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
  const [profileRole, setProfileRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const ensureAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", data.user.id)
        .maybeSingle();
      setProfileRole(profile?.role || null);
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
          "id, reservation_code, arrival_date, departure_date, status, early_check_in, preference_notes, room_type_id, room_types(name)",
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

      const normalizedReservation: Reservation = {
        ...data,
        room_types: Array.isArray((data as any).room_types)
          ? ((data as any).room_types[0] ?? null)
          : (data as any).room_types,
      };

      setReservation(normalizedReservation);
      setRoomTypeId(data.room_type_id || "");
      setEarlyCheckIn(Boolean(data.early_check_in));
      setPreferenceNotes(data.preference_notes || "");
      await loadServiceRequests(data.id);
      toast.success("Reservation loaded");
    } catch {
      toast.error("Unable to load reservation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePreferences = async () => {
    if (!reservation) return;
    setIsLoading(true);
    const { error } = await supabase
      .from("reservations")
      .update({
        early_check_in: earlyCheckIn,
        preference_notes: preferenceNotes.trim() || null,
        room_type_id: roomTypeId || null,
      })
      .eq("id", reservation.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Preferences updated");
    }
    setIsLoading(false);
  };

  const handleCreateServiceRequest = async () => {
    if (!reservation) return;
    if (!requestType) {
      toast.error("Select a request type");
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.from("service_requests").insert({
      reservation_id: reservation.id,
      request_type: requestType,
      details: requestDetails.trim() || null,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Request sent to concierge");
      setRequestType("");
      setRequestDetails("");
      await loadServiceRequests(reservation.id);
    }
    setIsLoading(false);
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
              Guest portal
            </Badge>
            <div className="space-y-3">
              <CardTitle className="font-display text-4xl">
                Welcome to your stay
              </CardTitle>
              <CardDescription className="max-w-2xl text-base">
                Manage your reservation, room preferences, and services in one
                place.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarCheck className="w-5 h-5 text-primary" />
                Find your reservation
              </CardTitle>
              <CardDescription>
                Load your stay details, update preferences, and request
                services.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <form onSubmit={handleLookup} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
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
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      placeholder="Patel"
                      className="h-11"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Arrival Date</Label>
                    <Input
                      type="date"
                      className="h-11"
                      value={arrivalDate}
                      onChange={(event) => setArrivalDate(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Room Type</Label>
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
                </div>

                <Card>
                  <CardContent className="flex items-center justify-between gap-4 pt-6">
                    <div>
                      <p className="font-medium">Early check-in request</p>
                      <p className="text-sm text-muted-foreground">
                        We will confirm by noon on arrival day.
                      </p>
                    </div>
                    <Switch
                      checked={earlyCheckIn}
                      onCheckedChange={setEarlyCheckIn}
                    />
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label>Concierge preferences</Label>
                  <Textarea
                    placeholder="Pillow softness, ambient music, dietary notes"
                    value={preferenceNotes}
                    onChange={(event) => setPreferenceNotes(event.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="submit"
                    className="w-full h-11 bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? "Searching..." : "Load reservation"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11"
                    onClick={handleUpdatePreferences}
                    disabled={!reservation || isLoading}
                  >
                    Save preferences
                  </Button>
                </div>
              </form>

              {reservation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Reservation summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="outline" className="capitalize">
                        {reservation.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Stay</span>
                      <span>
                        {reservation.arrival_date} -{" "}
                        {reservation.departure_date}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Room</span>
                      <span>{reservation.room_types?.name || "Pending"}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {profileRole &&
              profileRole !== "guest" &&
              profileRole !== "patient" && (
                <Card>
                  <CardContent className="py-4 text-sm text-muted-foreground">
                    This portal is for guests only. Please contact the front
                    desk if you need access.
                  </CardContent>
                </Card>
              )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-chart-1" />
                  Today at AurumStay
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Check-in opens</span>
                  <span className="text-foreground">2:00 PM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Evening tasting</span>
                  <span className="text-foreground">6:30 PM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>City terrace lounge</span>
                  <span className="text-foreground">Open</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="w-5 h-5 text-chart-2" />
                  Concierge notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Share room ambience, pillow choice, or dietary preferences.
                  Our team will prepare your suite.
                </p>
                <Button
                  variant="outline"
                  className="w-full h-10"
                  onClick={handleUpdatePreferences}
                  disabled={!reservation}
                >
                  Add preferences
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="w-5 h-5 text-chart-2" />
                  Service requests
                </CardTitle>
                <CardDescription>
                  Submit a request for dining, housekeeping, transport, or
                  amenities.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Request type</Label>
                  <Select value={requestType} onValueChange={setRequestType}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Choose a request" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dining">Room dining</SelectItem>
                      <SelectItem value="housekeeping">Housekeeping</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="amenities">Amenities</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Details</Label>
                  <Textarea
                    placeholder="Add any details for the concierge team"
                    value={requestDetails}
                    onChange={(event) => setRequestDetails(event.target.value)}
                  />
                </div>

                <Button
                  className="w-full h-11"
                  onClick={handleCreateServiceRequest}
                  disabled={!reservation || isLoading}
                >
                  Send request
                </Button>

                <Separator />

                <div className="space-y-2 text-sm">
                  {serviceRequests.length === 0 && (
                    <p className="text-muted-foreground">No requests yet.</p>
                  )}
                  {serviceRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="flex items-center justify-between gap-4 pt-6">
                        <div>
                          <p className="font-medium capitalize">
                            {request.request_type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {request.details || "No details"}
                          </p>
                        </div>
                        <Badge variant="outline" className="uppercase">
                          {request.status}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Secure access
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Verified reservations and privacy-first check-in details.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="w-4 h-4 text-chart-3" />
                Tailored stay
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Room fragrance, ambient music, and welcome drink preferences.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="w-4 h-4 text-chart-4" />
                Local experiences
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Curated city guides and on-demand reservations.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
