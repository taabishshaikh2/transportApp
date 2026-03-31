-- ============================================================
-- FleetPro – Supabase SQL Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Helper: auto-updated timestamp ────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ─── USERS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  email         TEXT,
  role          TEXT NOT NULL DEFAULT 'driver' CHECK (role IN ('admin','manager','driver')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── VEHICLES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id       TEXT UNIQUE,          -- V001, V002 …
  reg_number       TEXT NOT NULL UNIQUE,
  type             TEXT NOT NULL,
  make             TEXT,
  model            TEXT,
  year             INT,
  capacity         TEXT,
  fuel_type        TEXT DEFAULT 'Diesel',
  status           TEXT DEFAULT 'Active' CHECK (status IN ('Active','On Trip','Maintenance','Inactive')),
  insurance_expiry DATE,
  fitness_expiry   DATE,
  permit_expiry    DATE,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_vehicles_updated BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto vehicle_id sequence
CREATE SEQUENCE IF NOT EXISTS vehicle_seq START 1;
CREATE OR REPLACE FUNCTION set_vehicle_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.vehicle_id IS NULL THEN
    NEW.vehicle_id := 'V' || LPAD(nextval('vehicle_seq')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_vehicle_id BEFORE INSERT ON vehicles FOR EACH ROW EXECUTE FUNCTION set_vehicle_id();

-- ─── DRIVERS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drivers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id       TEXT UNIQUE,
  full_name       TEXT NOT NULL,
  phone           TEXT NOT NULL,
  license_number  TEXT NOT NULL UNIQUE,
  license_expiry  DATE,
  age             INT,
  experience_yrs  INT,
  address         TEXT,
  status          TEXT DEFAULT 'Active' CHECK (status IN ('Active','On Trip','On Leave','Inactive')),
  vehicle_id      UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES users(id)    ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_drivers_updated BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE SEQUENCE IF NOT EXISTS driver_seq START 1;
CREATE OR REPLACE FUNCTION set_driver_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.driver_id IS NULL THEN
    NEW.driver_id := 'D' || LPAD(nextval('driver_seq')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_driver_id BEFORE INSERT ON drivers FOR EACH ROW EXECUTE FUNCTION set_driver_id();

-- ─── CUSTOMERS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id     TEXT UNIQUE,
  company_name    TEXT NOT NULL,
  contact_person  TEXT,
  phone           TEXT,
  email           TEXT,
  city            TEXT,
  state           TEXT,
  address         TEXT,
  gstin           TEXT,
  dhl_gstin       TEXT,
  credit_days     INT DEFAULT 30,
  opening_balance NUMERIC(12,2) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE SEQUENCE IF NOT EXISTS customer_seq START 1;
CREATE OR REPLACE FUNCTION set_customer_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NULL THEN
    NEW.customer_id := 'C' || LPAD(nextval('customer_seq')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_customer_id BEFORE INSERT ON customers FOR EACH ROW EXECUTE FUNCTION set_customer_id();

-- ─── TRIPS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trips (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id          TEXT UNIQUE,
  vendor_name      TEXT DEFAULT 'Lucky Transport Services',
  vehicle_type     TEXT,
  period_from      DATE,
  period_to        DATE,
  location         TEXT,
  customer_id      UUID NOT NULL REFERENCES customers(id),
  vehicle_id       UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id        UUID REFERENCES drivers(id)  ON DELETE SET NULL,
  trip_amount      NUMERIC(10,2) DEFAULT 0,
  rate_per_trip    NUMERIC(10,2) DEFAULT 0,
  extra_olt_hrs    NUMERIC(10,2) DEFAULT 0,
  extra_olt_amount NUMERIC(10,2) DEFAULT 0,
  acc_monthly_pass NUMERIC(10,2) DEFAULT 0,
  transport_total  NUMERIC(12,2) DEFAULT 0,
  total_amount     NUMERIC(12,2) DEFAULT 0,
  status           TEXT DEFAULT 'Draft' CHECK (status IN ('Draft','Submitted','Approved','Invoiced')),
  notes            TEXT,
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_trips_updated BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE SEQUENCE IF NOT EXISTS trip_seq START 1;
CREATE OR REPLACE FUNCTION set_trip_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trip_id IS NULL THEN
    NEW.trip_id := 'TR-' || LPAD(nextval('trip_seq')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_trip_id BEFORE INSERT ON trips FOR EACH ROW EXECUTE FUNCTION set_trip_id();

-- ─── TRIP ENTRIES (rows in the trip sheet table) ─────────────────────────────
CREATE TABLE IF NOT EXISTS trip_entries (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id          UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  sr_no            INT,
  entry_date       DATE,
  vehicle_no       TEXT,
  cha_name         TEXT,
  vehicle_type     TEXT,
  opening_time     TEXT,
  mrb_arrival_time TEXT,
  closing_time     TEXT,
  per_trip_hrs     NUMERIC(6,2),
  total_hrs        NUMERIC(6,2),
  gt_in_hrs        NUMERIC(6,2),
  gt_amount        NUMERIC(10,2),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trip_entries_trip ON trip_entries(trip_id);

-- ─── MAINTENANCE ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  maintenance_id  TEXT UNIQUE,
  vehicle_id      UUID NOT NULL REFERENCES vehicles(id),
  service_type    TEXT NOT NULL,
  service_date    DATE NOT NULL,
  cost            NUMERIC(10,2) DEFAULT 0,
  mechanic_name   TEXT,
  workshop        TEXT,
  odometer        INT,
  status          TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled','In Progress','Completed')),
  next_due_date   DATE,
  next_due_km     INT,
  notes           TEXT,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_maintenance_updated BEFORE UPDATE ON maintenance FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE SEQUENCE IF NOT EXISTS maintenance_seq START 1;
CREATE OR REPLACE FUNCTION set_maintenance_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.maintenance_id IS NULL THEN
    NEW.maintenance_id := 'M' || LPAD(nextval('maintenance_seq')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_maintenance_id BEFORE INSERT ON maintenance FOR EACH ROW EXECUTE FUNCTION set_maintenance_id();

-- ─── INVOICES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number   TEXT UNIQUE,
  invoice_date     DATE NOT NULL,
  due_date         DATE,
  customer_id      UUID NOT NULL REFERENCES customers(id),
  trip_id          UUID REFERENCES trips(id)    ON DELETE SET NULL,
  vehicle_id       UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  invoiced_to      TEXT,
  address          TEXT,
  period_from      DATE,
  period_to        DATE,
  location         TEXT,
  dhl_gstin        TEXT,
  sac_no           TEXT DEFAULT '996601',
  state            TEXT DEFAULT 'Maharashtra',
  state_code       TEXT DEFAULT '27',
  place_of_supply  TEXT DEFAULT 'MUMBAI, MAHARASHTRA',
  vehicle_type_desc TEXT,
  invoice_month    TEXT,
  freight_desc     TEXT,
  base_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  cgst_rate        NUMERIC(5,2)  DEFAULT 9,
  sgst_rate        NUMERIC(5,2)  DEFAULT 9,
  cgst_amount      NUMERIC(12,2) DEFAULT 0,
  sgst_amount      NUMERIC(12,2) DEFAULT 0,
  round_off        NUMERIC(6,2)  DEFAULT 0,
  total_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_in_words  TEXT,
  status           TEXT DEFAULT 'Pending' CHECK (status IN ('Draft','Pending','Paid','Overdue','Cancelled')),
  payment_date     DATE,
  payment_mode     TEXT,
  notes            TEXT,
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto invoice number: INV/2025-26/001
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  fy_start INT;
  fy_label TEXT;
  next_num INT;
BEGIN
  IF NEW.invoice_number IS NULL THEN
    fy_start := CASE WHEN EXTRACT(MONTH FROM NOW()) >= 4 THEN EXTRACT(YEAR FROM NOW())::INT ELSE EXTRACT(YEAR FROM NOW())::INT - 1 END;
    fy_label := fy_start::TEXT || '-' || RIGHT((fy_start + 1)::TEXT, 2);
    SELECT COALESCE(MAX(CAST(SPLIT_PART(invoice_number,'/',3) AS INT)), 0) + 1
    INTO next_num FROM invoices WHERE invoice_number LIKE 'INV/' || fy_label || '/%';
    NEW.invoice_number := 'INV/' || fy_label || '/' || LPAD(next_num::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_invoice_number BEFORE INSERT ON invoices FOR EACH ROW EXECUTE FUNCTION set_invoice_number();

-- ─── PAYMENTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id   UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount       NUMERIC(12,2) NOT NULL,
  payment_mode TEXT NOT NULL,
  reference_no TEXT,
  notes        TEXT,
  recorded_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

-- ─── ROW LEVEL SECURITY (disable for service role) ──────────────────────────
-- The backend uses the service role key which bypasses RLS.
-- Enable RLS only if you add direct client-side Supabase access later.
ALTER TABLE users        DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles     DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers      DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers    DISABLE ROW LEVEL SECURITY;
ALTER TABLE trips        DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance  DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices     DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments     DISABLE ROW LEVEL SECURITY;

-- ─── SEED DATA ────────────────────────────────────────────────────────────────
-- Passwords: all = column-name + "123"  e.g. admin123, manager123, driver123
-- Hashes generated with bcrypt rounds=10
INSERT INTO users (username, password_hash, full_name, email, role) VALUES
('admin',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Admin',  'admin@fleetpro.com',   'admin'),
('manager', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Fleet Manager', 'manager@fleetpro.com', 'manager'),
('driver1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ramesh Kumar',  'ramesh@fleetpro.com',  'driver')
ON CONFLICT (username) DO NOTHING;

INSERT INTO vehicles (reg_number, type, make, model, year, capacity, fuel_type, status, insurance_expiry, fitness_expiry, permit_expiry) VALUES
('MH-01-AB-1234', 'Truck',      'Tata',          'Prima 4028.S',  2021, '28T',  'Diesel', 'Active',      '2025-12-31', '2025-06-30', '2025-09-30'),
('MH-04-CD-5678', 'Trailer',    'Ashok Leyland', 'Captain 3518',  2020, '35T',  'Diesel', 'On Trip',     '2025-08-15', '2025-05-31', '2025-07-20'),
('GJ-01-EF-9012', 'Mini Truck', 'Mahindra',      'Bolero Pik-Up', 2022, '1.5T', 'Diesel', 'Active',      '2026-02-28', '2026-01-15', '2025-11-30'),
('MH-12-GH-3456', 'Tanker',    'VECV',           'Pro 6038',      2019, '22KL', 'Diesel', 'Maintenance', '2025-10-20', '2025-04-30', '2025-08-15')
ON CONFLICT (reg_number) DO NOTHING;

INSERT INTO customers (company_name, contact_person, phone, email, city, state, gstin, credit_days, opening_balance) VALUES
('Reliance Industries Ltd',  'Vikram Shah', '9812345678', 'logistics@ril.com',        'Mumbai', 'Maharashtra', '27AAACR5055K1ZE', 30,  125000),
('TATA Chemicals',           'Priya Nair',  '9823456789', 'supply@tatachemicals.com', 'Pune',   'Maharashtra', '27AABCT1332L1ZF', 45, -18500),
('Godrej Consumer Products', 'Amit Desai',  '9834567890', 'ops@godrej.com',           'Mumbai', 'Maharashtra', '27AAACG0569P1ZI', 30,  45000),
('DHL Express',              'Rahul Mehta', '9898001234', 'ops@dhl.in',               'Mumbai', 'Maharashtra', '27AABCD1234E1ZA', 30,  0)
ON CONFLICT DO NOTHING;
