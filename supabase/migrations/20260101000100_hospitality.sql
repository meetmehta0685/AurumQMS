-- Hospitality schema: room types, rooms, reservations, allocations, service requests

CREATE TABLE room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  capacity INTEGER NOT NULL DEFAULT 2 CHECK (capacity >= 1),
  base_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read room types"
  ON room_types FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- =====================================================
-- ROOMS
-- =====================================================
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number VARCHAR(20) NOT NULL UNIQUE,
  floor INTEGER NOT NULL,
  room_type_id UUID NOT NULL REFERENCES room_types(id),
  status VARCHAR(20) NOT NULL DEFAULT 'ready'
    CHECK (status IN ('ready', 'cleaning', 'maintenance', 'occupied', 'out_of_service')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read rooms"
  ON rooms FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage rooms"
  ON rooms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- =====================================================
-- RESERVATIONS
-- =====================================================
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_code VARCHAR(20) NOT NULL UNIQUE,
  guest_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_name VARCHAR(120) NOT NULL,
  arrival_date DATE NOT NULL,
  departure_date DATE NOT NULL,
  room_type_id UUID REFERENCES room_types(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled')),
  early_check_in BOOLEAN DEFAULT false,
  preference_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guests can read own reservations"
  ON reservations FOR SELECT
  USING (guest_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Guests can update own reservations"
  ON reservations FOR UPDATE
  USING (guest_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can read all reservations"
  ON reservations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Staff can manage reservations"
  ON reservations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- =====================================================
-- ROOM ALLOCATIONS
-- =====================================================
CREATE TABLE room_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL UNIQUE REFERENCES reservations(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  staff_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE room_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guests can read own allocations"
  ON room_allocations FOR SELECT
  USING (
    reservation_id IN (
      SELECT id FROM reservations
      WHERE guest_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Staff can manage allocations"
  ON room_allocations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- =====================================================
-- SERVICE REQUESTS
-- =====================================================
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  request_type VARCHAR(50) NOT NULL,
  details TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'closed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guests can create service requests"
  ON service_requests FOR INSERT
  WITH CHECK (
    reservation_id IN (
      SELECT id FROM reservations
      WHERE guest_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Guests can read own service requests"
  ON service_requests FOR SELECT
  USING (
    reservation_id IN (
      SELECT id FROM reservations
      WHERE guest_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Staff can manage service requests"
  ON service_requests FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- =====================================================
-- SEED DATA
-- =====================================================

-- =====================================================
-- ROOM ALLOCATION (atomic: pick a ready room, assign it, mark it occupied)
-- =====================================================
CREATE OR REPLACE FUNCTION public.allocate_room(
  p_reservation_code TEXT,
  p_room_type_id UUID DEFAULT NULL,
  p_floor INTEGER DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  staff_id UUID;
  res reservations%ROWTYPE;
  chosen_room rooms%ROWTYPE;
BEGIN
  SELECT id INTO staff_id FROM profiles
  WHERE user_id = auth.uid() AND role IN ('admin', 'staff');
  IF staff_id IS NULL THEN
    RAISE EXCEPTION 'Only staff can allocate rooms';
  END IF;

  SELECT * INTO res FROM reservations
  WHERE upper(reservation_code) = upper(trim(p_reservation_code))
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation % not found', p_reservation_code;
  END IF;
  IF res.status IN ('cancelled', 'checked_out') THEN
    RAISE EXCEPTION 'Reservation % is %', res.reservation_code, res.status;
  END IF;
  IF EXISTS (SELECT 1 FROM room_allocations WHERE reservation_id = res.id) THEN
    RAISE EXCEPTION 'Reservation % already has a room', res.reservation_code;
  END IF;

  SELECT * INTO chosen_room FROM rooms
  WHERE status = 'ready'
    AND room_type_id = COALESCE(p_room_type_id, res.room_type_id, room_type_id)
    AND (p_floor IS NULL OR floor = p_floor)
  ORDER BY room_number
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No ready room matches that request';
  END IF;

  INSERT INTO room_allocations (reservation_id, room_id, staff_profile_id, notes)
  VALUES (res.id, chosen_room.id, staff_id, p_notes);

  UPDATE rooms SET status = 'occupied', updated_at = now() WHERE id = chosen_room.id;
  UPDATE reservations SET status = 'confirmed', updated_at = now()
  WHERE id = res.id AND status = 'pending';

  RETURN chosen_room.room_number;
END;
$$;

REVOKE ALL ON FUNCTION public.allocate_room(TEXT, UUID, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.allocate_room(TEXT, UUID, INTEGER, TEXT) TO authenticated;
