-- ============================================================
--  SmartCare v2 – Full PostgreSQL Schema
--  Safe to re-run: uses IF NOT EXISTS everywhere.
--  Run: psql -U postgres -d smartcare -f server/schema.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── ADMINS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id           TEXT        PRIMARY KEY,
  role         TEXT        NOT NULL DEFAULT 'admin',
  name         TEXT        NOT NULL,
  email        TEXT        NOT NULL UNIQUE,
  password     TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── DOCTORS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
  id               TEXT        PRIMARY KEY,
  role             TEXT        NOT NULL DEFAULT 'doctor',
  name             TEXT        NOT NULL,
  age              INTEGER     NOT NULL DEFAULT 0,
  email            TEXT        NOT NULL UNIQUE,
  phone            TEXT        NOT NULL DEFAULT '',
  specialization   TEXT        NOT NULL,
  experience       INTEGER     NOT NULL DEFAULT 0,
  password         TEXT        NOT NULL,
  added_by_admin   TEXT        REFERENCES admins(id) ON DELETE SET NULL,
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── DOCTOR SLOTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctor_slots (
  id          SERIAL PRIMARY KEY,
  doctor_id   TEXT   NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  slot_time   TEXT   NOT NULL,
  UNIQUE (doctor_id, slot_time)
);

-- ── PATIENTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id           TEXT        PRIMARY KEY,
  role         TEXT        NOT NULL DEFAULT 'patient',
  name         TEXT        NOT NULL,
  age          INTEGER     NOT NULL DEFAULT 0,
  email        TEXT        NOT NULL UNIQUE,
  phone        TEXT        NOT NULL DEFAULT '',
  password     TEXT        NOT NULL,
  is_verified  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── OTP STORAGE ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otps (
  id          SERIAL      PRIMARY KEY,
  email       TEXT        NOT NULL,
  code        TEXT        NOT NULL,
  purpose     TEXT        NOT NULL DEFAULT 'signup',
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── APPOINTMENTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id              TEXT        PRIMARY KEY,
  patient_id      TEXT        NOT NULL REFERENCES patients(id)  ON DELETE CASCADE,
  patient_name    TEXT        NOT NULL,
  doctor_id       TEXT        NOT NULL REFERENCES doctors(id)   ON DELETE CASCADE,
  doctor_name     TEXT        NOT NULL,
  specialization  TEXT        NOT NULL,
  date            DATE        NOT NULL,
  time            TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'booked'
                              CHECK (status IN ('booked','completed','cancelled')),
  rated           BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── RATINGS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ratings (
  id              TEXT        PRIMARY KEY,
  appointment_id  TEXT        NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  doctor_id       TEXT        NOT NULL REFERENCES doctors(id)   ON DELETE CASCADE,
  doctor_name     TEXT        NOT NULL,
  patient_id      TEXT        NOT NULL REFERENCES patients(id)  ON DELETE CASCADE,
  patient_name    TEXT        NOT NULL,
  score           INTEGER     NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment         TEXT        NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ADD MISSING COLUMNS (safe on existing databases) ─────────
-- Adds is_verified to patients if it doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='patients' AND column_name='is_verified'
  ) THEN
    ALTER TABLE patients ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='doctors' AND column_name='is_active'
  ) THEN
    ALTER TABLE doctors ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='doctors' AND column_name='added_by_admin'
  ) THEN
    ALTER TABLE doctors ADD COLUMN added_by_admin TEXT REFERENCES admins(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── DOCTOR BLOCKED DATES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctor_blocked_dates (
  id          SERIAL      PRIMARY KEY,
  doctor_id   TEXT        NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  blocked_date DATE       NOT NULL,
  reason      TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (doctor_id, blocked_date)
);

CREATE INDEX IF NOT EXISTS idx_blocked_dates_doctor ON doctor_blocked_dates(doctor_id);

-- ── INDEXES ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_otps_email      ON otps(email, purpose);
CREATE INDEX IF NOT EXISTS idx_appt_patient    ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appt_doctor     ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_ratings_doctor  ON ratings(doctor_id);
CREATE INDEX IF NOT EXISTS idx_ratings_patient ON ratings(patient_id);
