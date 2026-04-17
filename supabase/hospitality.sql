-- Hospitality module schema + seed data
-- Run this after your existing schema.sql

-- =====================================================
-- EXTEND PROFILE ROLES
-- =====================================================
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('patient', 'doctor', 'admin', 'guest', 'staff', 'lab', 'pharma'));

-- =====================================================
-- ROOM TYPES
-- =====================================================
CREATE TABLE IF NOT EXISTS room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  capacity INTEGER NOT NULL DEFAULT 2 CHECK (capacity >= 1),
  base_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read room types" ON room_types;
CREATE POLICY "Authenticated can read room types"
  ON room_types FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- =====================================================
-- ROOMS
-- =====================================================
CREATE TABLE IF NOT EXISTS rooms (
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

DROP POLICY IF EXISTS "Authenticated can read rooms" ON rooms;
DROP POLICY IF EXISTS "Staff can manage rooms" ON rooms;

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
CREATE TABLE IF NOT EXISTS reservations (
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

DROP POLICY IF EXISTS "Guests can read own reservations" ON reservations;
DROP POLICY IF EXISTS "Guests can update own reservations" ON reservations;
DROP POLICY IF EXISTS "Staff can read all reservations" ON reservations;
DROP POLICY IF EXISTS "Staff can manage reservations" ON reservations;

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
CREATE TABLE IF NOT EXISTS room_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL UNIQUE REFERENCES reservations(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  staff_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE room_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guests can read own allocations" ON room_allocations;
DROP POLICY IF EXISTS "Staff can manage allocations" ON room_allocations;

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
CREATE TABLE IF NOT EXISTS service_requests (
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

DROP POLICY IF EXISTS "Guests can create service requests" ON service_requests;
DROP POLICY IF EXISTS "Guests can read own service requests" ON service_requests;
DROP POLICY IF EXISTS "Staff can manage service requests" ON service_requests;

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
INSERT INTO room_types (name, description, capacity, base_rate) VALUES
  ('Deluxe Suite', 'Spacious suite with city view', 2, 240.00),
  ('Executive King', 'Premium king room with lounge access', 2, 180.00),
  ('Garden Villa', 'Private villa with garden access', 4, 420.00)
ON CONFLICT (name) DO NOTHING;

INSERT INTO rooms (room_number, floor, room_type_id, status) VALUES
  ('118', 1, (SELECT id FROM room_types WHERE name = 'Executive King'), 'ready'),
  ('204', 2, (SELECT id FROM room_types WHERE name = 'Executive King'), 'cleaning'),
  ('305', 3, (SELECT id FROM room_types WHERE name = 'Deluxe Suite'), 'ready'),
  ('402', 4, (SELECT id FROM room_types WHERE name = 'Deluxe Suite'), 'ready'),
  ('418', 4, (SELECT id FROM room_types WHERE name = 'Deluxe Suite'), 'maintenance'),
  ('512', 5, (SELECT id FROM room_types WHERE name = 'Executive King'), 'ready'),
  ('601', 6, (SELECT id FROM room_types WHERE name = 'Deluxe Suite'), 'ready'),
  ('612', 6, (SELECT id FROM room_types WHERE name = 'Executive King'), 'ready'),
  ('701', 7, (SELECT id FROM room_types WHERE name = 'Deluxe Suite'), 'cleaning'),
  ('801', 8, (SELECT id FROM room_types WHERE name = 'Garden Villa'), 'ready'),
  ('812', 8, (SELECT id FROM room_types WHERE name = 'Garden Villa'), 'ready'),
  ('912', 9, (SELECT id FROM room_types WHERE name = 'Garden Villa'), 'out_of_service')
ON CONFLICT (room_number) DO NOTHING;

DO $$
DECLARE
  guest_profile_id UUID;
  guest_last_name TEXT;
BEGIN
  SELECT id, COALESCE(NULLIF(split_part(full_name, ' ', 2), ''), full_name)
  INTO guest_profile_id, guest_last_name
  FROM profiles
  WHERE role = 'guest'
  ORDER BY created_at
  LIMIT 1;

  IF guest_profile_id IS NULL THEN
    SELECT id, COALESCE(NULLIF(split_part(full_name, ' ', 2), ''), full_name)
    INTO guest_profile_id, guest_last_name
    FROM profiles
    WHERE role = 'patient'
    ORDER BY created_at
    LIMIT 1;
  END IF;

  IF guest_profile_id IS NULL THEN
    RAISE NOTICE 'No guest or patient profile found. Create a guest user to seed reservations.';
    RETURN;
  END IF;

  INSERT INTO reservations (
    reservation_code,
    guest_profile_id,
    last_name,
    arrival_date,
    departure_date,
    room_type_id,
    status,
    early_check_in,
    preference_notes
  ) VALUES
    ('AR-2391', guest_profile_id, guest_last_name, CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days',
      (SELECT id FROM room_types WHERE name = 'Deluxe Suite'), 'confirmed', true, 'Quiet room, extra pillows'),
    ('AR-4530', guest_profile_id, guest_last_name, CURRENT_DATE, CURRENT_DATE + INTERVAL '3 days',
      (SELECT id FROM room_types WHERE name = 'Executive King'), 'pending', false, 'Late arrival after 10 PM'),
    ('AR-7812', guest_profile_id, guest_last_name, CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '4 days',
      (SELECT id FROM room_types WHERE name = 'Garden Villa'), 'pending', false, NULL)
  ON CONFLICT (reservation_code) DO NOTHING;
END $$;
