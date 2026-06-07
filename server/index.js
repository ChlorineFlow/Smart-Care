/**
 * server/index.js – SmartCare v2 Express API
 *
 * Auth flows:
 *  Patient signup  → POST /api/otp/send (signup) → fill form → POST /api/auth/register/patient (with otpCode)
 *  Patient login   → password: POST /api/auth/patient-login
 *                    OTP:      POST /api/otp/send (login) → POST /api/auth/patient-otp-login
 *  Doctor login    → POST /api/auth/login  (email + password assigned by admin)
 *  Admin login     → POST /api/auth/login  (email + password)
 */
import "dotenv/config";
import express from "express";

import cors from "cors";
import {
  query, sanitizeUser, makeId, toCamel, doctorStats, initDb, generateOtp,
} from "./db.js";
import { sendOtpEmail, sendCancellationEmail } from "./mailer.js";

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

// ── Shared util ───────────────────────────────────────────────
const emailTaken = async (email) => {
  const { rows } = await query(
    `SELECT 1 FROM patients WHERE LOWER(email)=$1
     UNION ALL SELECT 1 FROM doctors  WHERE LOWER(email)=$1
     UNION ALL SELECT 1 FROM admins   WHERE LOWER(email)=$1`,
    [email.toLowerCase()]
  );
  return rows.length > 0;
};

// ── Health ────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ══════════════════════════════════════════════════════════════
//  OTP
// ══════════════════════════════════════════════════════════════

/**
 * POST /api/otp/send
 * body: { email, purpose: 'signup' | 'login' }
 * Generates a 6-digit OTP, stores it, and sends a real email.
 */
app.post("/api/otp/send", async (req, res) => {
  try {
    const { email, purpose = "signup" } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    const emailLower = email.toLowerCase().trim();

    // Guard: signup → email must not exist; login → patient must exist
    if (purpose === "signup") {
      if (await emailTaken(emailLower))
        return res.status(400).json({ message: "This email is already registered. Please sign in." });
    }
    if (purpose === "login") {
      const { rows } = await query(
        "SELECT id FROM patients WHERE LOWER(email)=$1", [emailLower]
      );
      if (!rows.length)
        return res.status(404).json({ message: "No patient account found with this email." });
    }

    // Invalidate any previous unused OTPs for this email+purpose
    await query(
      "UPDATE otps SET used=true WHERE LOWER(email)=$1 AND purpose=$2 AND used=false",
      [emailLower, purpose]
    );

    // Generate and store new OTP
    const code      = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await query(
      "INSERT INTO otps (email, code, purpose, expires_at) VALUES ($1,$2,$3,$4)",
      [emailLower, code, purpose, expiresAt]
    );

    // Send real email — throws if SMTP is not configured
    try {
      await sendOtpEmail({ to: emailLower, otp: code, purpose });
    } catch (mailErr) {
      console.error("❌  Email send failed:", mailErr.message);
      // Roll back the OTP so user can try again
      await query("UPDATE otps SET used=true WHERE email=$1 AND code=$2", [emailLower, code]);
      return res.status(500).json({
        message: "Failed to send OTP email. Please check the server SMTP configuration.",
      });
    }

    console.log(`📧  OTP sent to ${emailLower} [${purpose}]`);
    return res.json({ message: "OTP sent to your email. It expires in 10 minutes.", expiresIn: 600 });
  } catch (err) {
    console.error("POST /api/otp/send:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /api/otp/verify  – validate OTP without consuming it (UI guard step)
 * body: { email, code, purpose }
 */
app.post("/api/otp/verify", async (req, res) => {
  try {
    const { email, code, purpose = "signup" } = req.body;
    if (!email || !code) return res.status(400).json({ message: "Email and code are required" });

    const { rows } = await query(
      `SELECT id FROM otps
       WHERE LOWER(email)=$1 AND code=$2 AND purpose=$3
         AND used=false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email.toLowerCase().trim(), code, purpose]
    );
    if (!rows.length) return res.status(400).json({ message: "Invalid or expired OTP" });
    return res.json({ valid: true });
  } catch (err) {
    console.error("POST /api/otp/verify:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ══════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════

/** POST /api/auth/login  –  Doctor & Admin password login */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { role, email, password } = req.body;
    if (!["doctor", "admin"].includes(role))
      return res.status(400).json({ message: "Use /api/auth/patient-login for patients" });

    const table = role === "admin" ? "admins" : "doctors";
    const { rows } = await query(
      `SELECT * FROM ${table} WHERE LOWER(email)=LOWER($1) AND password=$2`,
      [email, password]
    );
    if (!rows.length)
      return res.status(401).json({ message: "Invalid email or password" });

    if (role === "doctor" && rows[0].is_active === false)
      return res.status(403).json({ message: "Your account is inactive. Contact the administrator." });

    let user = toCamel(rows[0]);
    if (role === "doctor") {
      const { rows: slotRows } = await query(
        "SELECT slot_time FROM doctor_slots WHERE doctor_id=$1 ORDER BY slot_time", [user.id]
      );
      user.slots = slotRows.map(r => r.slot_time);
    }
    return res.json(sanitizeUser(user));
  } catch (err) {
    console.error("POST /api/auth/login:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/** POST /api/auth/patient-login  –  Patient email + password login */
app.post("/api/auth/patient-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const { rows } = await query(
      "SELECT * FROM patients WHERE LOWER(email)=LOWER($1) AND password=$2",
      [email, password]
    );
    if (!rows.length)
      return res.status(401).json({ message: "Invalid email or password" });

    return res.json(sanitizeUser(toCamel(rows[0])));
  } catch (err) {
    console.error("POST /api/auth/patient-login:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/** POST /api/auth/patient-otp-login  –  Passwordless OTP login for patients */
app.post("/api/auth/patient-otp-login", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code)
      return res.status(400).json({ message: "Email and OTP are required" });

    const emailLower = email.toLowerCase().trim();

    // Validate and consume OTP
    const { rows: otpRows } = await query(
      `SELECT id FROM otps WHERE LOWER(email)=$1 AND code=$2 AND purpose='login'
       AND used=false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
      [emailLower, code]
    );
    if (!otpRows.length)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    await query("UPDATE otps SET used=true WHERE id=$1", [otpRows[0].id]);

    const { rows } = await query(
      "SELECT * FROM patients WHERE LOWER(email)=$1", [emailLower]
    );
    if (!rows.length)
      return res.status(404).json({ message: "Patient not found" });

    return res.json(sanitizeUser(toCamel(rows[0])));
  } catch (err) {
    console.error("POST /api/auth/patient-otp-login:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/** POST /api/auth/register/patient  –  Create patient account after OTP verified */
app.post("/api/auth/register/patient", async (req, res) => {
  try {
    const { name, age, email, phone, password, otpCode } = req.body;

    if (!name || !email || !password || !age || !phone || !otpCode)
      return res.status(400).json({ message: "All fields including OTP are required" });

    const emailLower = email.toLowerCase().trim();

    // Validate OTP (and consume it)
    const { rows: otpRows } = await query(
      `SELECT id FROM otps WHERE LOWER(email)=$1 AND code=$2 AND purpose='signup'
       AND used=false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
      [emailLower, otpCode]
    );
    if (!otpRows.length)
      return res.status(400).json({ message: "Invalid or expired OTP. Please request a new one." });

    // Check email uniqueness
    if (await emailTaken(emailLower))
      return res.status(400).json({ message: "This email is already registered." });

    // Consume OTP
    await query("UPDATE otps SET used=true WHERE id=$1", [otpRows[0].id]);

    // Create patient
    const { rows } = await query(
      `INSERT INTO patients (id, role, name, age, email, phone, password, is_verified, created_at)
       VALUES ($1, 'patient', $2, $3, $4, $5, $6, true, NOW()) RETURNING *`,
      [makeId("patient"), name.trim(), Number(age), emailLower, phone.trim(), password]
    );

    return res.status(201).json(sanitizeUser(toCamel(rows[0])));
  } catch (err) {
    console.error("POST /api/auth/register/patient:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ══════════════════════════════════════════════════════════════
//  DOCTORS
// ══════════════════════════════════════════════════════════════

/** GET /api/doctors  –  Active doctors only (for patients to browse) */
app.get("/api/doctors", async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT d.*,
              COALESCE(s.slots, '{}')       AS slots,
              COALESCE(rs.reviews, 0)::int  AS reviews,
              COALESCE(rs.average,  0)      AS rating
       FROM doctors d
       LEFT JOIN LATERAL (
         SELECT ARRAY_AGG(slot_time ORDER BY slot_time) AS slots
         FROM doctor_slots WHERE doctor_id = d.id
       ) s ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS reviews, AVG(score) AS average
         FROM ratings WHERE doctor_id = d.id
       ) rs ON true
       WHERE d.is_active = true
       ORDER BY d.name`
    );
    return res.json(rows.map(r => {
      const doc = toCamel(r);
      doc.rating  = Number(Number(doc.rating  || 0).toFixed(1));
      doc.reviews = Number(doc.reviews || 0);
      return sanitizeUser(doc);
    }));
  } catch (err) {
    console.error("GET /api/doctors:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/** GET /api/doctors/all  –  All doctors including inactive (admin only) */
app.get("/api/doctors/all", async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT d.*,
              COALESCE(s.slots, '{}')       AS slots,
              COALESCE(rs.reviews, 0)::int  AS reviews,
              COALESCE(rs.average,  0)      AS rating
       FROM doctors d
       LEFT JOIN LATERAL (
         SELECT ARRAY_AGG(slot_time ORDER BY slot_time) AS slots
         FROM doctor_slots WHERE doctor_id = d.id
       ) s ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS reviews, AVG(score) AS average
         FROM ratings WHERE doctor_id = d.id
       ) rs ON true
       ORDER BY d.name`
    );
    return res.json(rows.map(r => {
      const doc = toCamel(r);
      doc.rating  = Number(Number(doc.rating  || 0).toFixed(1));
      doc.reviews = Number(doc.reviews || 0);
      return sanitizeUser(doc);
    }));
  } catch (err) {
    console.error("GET /api/doctors/all:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/** GET /api/doctors/:id */
app.get("/api/doctors/:id", async (req, res) => {
  try {
    const { rows } = await query("SELECT * FROM doctors WHERE id=$1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Doctor not found" });
    const doc = toCamel(rows[0]);
    const { rows: slotRows } = await query(
      "SELECT slot_time FROM doctor_slots WHERE doctor_id=$1 ORDER BY slot_time", [doc.id]
    );
    doc.slots = slotRows.map(r => r.slot_time);
    const stats = await doctorStats(doc.id);
    return res.json({ ...sanitizeUser(doc), ...stats });
  } catch (err) {
    console.error("GET /api/doctors/:id:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/** POST /api/doctors  –  Admin adds a doctor with assigned credentials */
app.post("/api/doctors", async (req, res) => {
  try {
    const { name, age, email, phone, specialization, experience, password, adminId } = req.body;
    if (!name || !email || !password || !specialization)
      return res.status(400).json({ message: "Name, email, specialization and password are required" });

    const emailLower = email.toLowerCase().trim();
    if (await emailTaken(emailLower))
      return res.status(400).json({ message: "This email is already registered" });

    const id = makeId("doctor");
    const defaultSlots = ["09:00","11:00","14:00","16:00"];

    const { rows } = await query(
      `INSERT INTO doctors
         (id, role, name, age, email, phone, specialization, experience, password, added_by_admin, is_active, created_at)
       VALUES ($1,'doctor',$2,$3,$4,$5,$6,$7,$8,$9,true,NOW()) RETURNING *`,
      [id, name.trim(), Number(age||0), emailLower, String(phone||"").trim(),
       specialization.trim(), Number(experience||0), password, adminId || null]
    );

    for (const s of defaultSlots)
      await query(
        "INSERT INTO doctor_slots (doctor_id, slot_time) VALUES ($1,$2) ON CONFLICT DO NOTHING",
        [id, s]
      );

    const doc = toCamel(rows[0]);
    doc.slots   = defaultSlots;
    doc.rating  = 0;
    doc.reviews = 0;
    return res.status(201).json(sanitizeUser(doc));
  } catch (err) {
    console.error("POST /api/doctors:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/** PUT /api/doctors/:id/slots */
app.put("/api/doctors/:id/slots", async (req, res) => {
  try {
    const { id } = req.params;
    const slots = [...new Set((req.body.slots||[]).map(s => String(s).trim()).filter(Boolean))];

    const { rows } = await query("SELECT * FROM doctors WHERE id=$1", [id]);
    if (!rows.length) return res.status(404).json({ message: "Doctor not found" });

    await query("DELETE FROM doctor_slots WHERE doctor_id=$1", [id]);
    for (const s of slots)
      await query(
        "INSERT INTO doctor_slots (doctor_id, slot_time) VALUES ($1,$2) ON CONFLICT DO NOTHING",
        [id, s]
      );

    const stats = await doctorStats(id);
    return res.json({ ...sanitizeUser(toCamel(rows[0])), slots, ...stats });
  } catch (err) {
    console.error("PUT /api/doctors/:id/slots:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/** PATCH /api/doctors/:id/status  –  Activate / deactivate */
app.patch("/api/doctors/:id/status", async (req, res) => {
  try {
    const { is_active } = req.body;
    const { rows } = await query(
      "UPDATE doctors SET is_active=$1 WHERE id=$2 RETURNING *",
      [Boolean(is_active), req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Doctor not found" });
    return res.json(sanitizeUser(toCamel(rows[0])));
  } catch (err) {
    console.error("PATCH /api/doctors/:id/status:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/** DELETE /api/doctors/:id */
app.delete("/api/doctors/:id", async (req, res) => {
  try {
    await query("DELETE FROM doctors WHERE id=$1", [req.params.id]);
    return res.status(204).send();
  } catch (err) {
    console.error("DELETE /api/doctors/:id:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ══════════════════════════════════════════════════════════════
//  APPOINTMENTS
// ══════════════════════════════════════════════════════════════

app.post("/api/appointments", async (req, res) => {
  try {
    const { patientId, doctorId, date, time } = req.body;
    if (!patientId || !doctorId || !date || !time)
      return res.status(400).json({ message: "patientId, doctorId, date, and time are required" });

    const [patRes, docRes] = await Promise.all([
      query("SELECT * FROM patients WHERE id=$1", [patientId]),
      query("SELECT * FROM doctors  WHERE id=$1", [doctorId]),
    ]);
    if (!patRes.rows.length || !docRes.rows.length)
      return res.status(400).json({ message: "Invalid patient or doctor" });

    const conflict = await query(
      "SELECT 1 FROM appointments WHERE doctor_id=$1 AND date=$2 AND time=$3 AND status='booked'",
      [doctorId, date, time]
    );
    if (conflict.rows.length)
      return res.status(409).json({ message: "This slot is already booked" });

    const pat = toCamel(patRes.rows[0]);
    const doc = toCamel(docRes.rows[0]);
    const { rows } = await query(
      `INSERT INTO appointments
         (id, patient_id, patient_name, doctor_id, doctor_name, specialization, date, time, status, rated, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'booked',false,NOW()) RETURNING *`,
      [makeId("appointment"), patientId, pat.name, doctorId, doc.name, doc.specialization, date, time]
    );
    return res.status(201).json(toCamel(rows[0]));
  } catch (err) {
    console.error("POST /api/appointments:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/appointments", async (req, res) => {
  try {
    const { patientId, doctorId } = req.query;
    let sql = "SELECT * FROM appointments WHERE 1=1";
    const params = [];
    if (patientId) { params.push(patientId); sql += ` AND patient_id=$${params.length}`; }
    if (doctorId)  { params.push(doctorId);  sql += ` AND doctor_id=$${params.length}`;  }
    sql += " ORDER BY date DESC, time DESC";
    const { rows } = await query(sql, params);
    return res.json(rows.map(toCamel));
  } catch (err) {
    console.error("GET /api/appointments:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.patch("/api/appointments/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["booked","completed","cancelled"].includes(status))
      return res.status(400).json({ message: "Invalid status" });

    // Fetch appointment + patient email BEFORE updating
    const { rows: existing } = await query(
      `SELECT a.*, p.email AS patient_email
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       WHERE a.id = $1`,
      [req.params.id]
    );
    if (!existing.length) return res.status(404).json({ message: "Appointment not found" });

    // Update status
    const { rows } = await query(
      "UPDATE appointments SET status=$1 WHERE id=$2 RETURNING *",
      [status, req.params.id]
    );

    // Send cancellation email if status changed to cancelled
    if (status === "cancelled") {
      const appt = existing[0];
      try {
        await sendCancellationEmail({
          to:             appt.patient_email,
          patientName:    appt.patient_name,
          doctorName:     appt.doctor_name,
          specialization: appt.specialization,
          date:           appt.date,
          time:           appt.time,
        });
        console.log(`📧  Cancellation email sent to ${appt.patient_email}`);
      } catch (mailErr) {
        // Don't fail the request if email fails — just log it
        console.error("❌  Cancellation email failed:", mailErr.message);
      }
    }

    return res.json(toCamel(rows[0]));
  } catch (err) {
    console.error("PATCH /api/appointments/:id/status:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ══════════════════════════════════════════════════════════════
//  RATINGS
// ══════════════════════════════════════════════════════════════

app.post("/api/ratings", async (req, res) => {
  try {
    const { appointmentId, patientId, score, comment } = req.body;
    if (!appointmentId || !patientId || !score)
      return res.status(400).json({ message: "appointmentId, patientId, and score are required" });

    const apptRes = await query("SELECT * FROM appointments WHERE id=$1", [appointmentId]);
    if (!apptRes.rows.length) return res.status(404).json({ message: "Appointment not found" });
    const appt = toCamel(apptRes.rows[0]);
    if (appt.rated) return res.status(400).json({ message: "Already rated" });

    const { rows } = await query(
      `INSERT INTO ratings
         (id, appointment_id, doctor_id, doctor_name, patient_id, patient_name, score, comment, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING *`,
      [makeId("rating"), appointmentId, appt.doctorId, appt.doctorName,
       patientId, appt.patientName, Number(score), String(comment||"").trim()]
    );
    await query("UPDATE appointments SET rated=true WHERE id=$1", [appointmentId]);
    return res.status(201).json(toCamel(rows[0]));
  } catch (err) {
    console.error("POST /api/ratings:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/ratings", async (req, res) => {
  try {
    const { doctorId, patientId } = req.query;
    let sql = "SELECT * FROM ratings WHERE 1=1";
    const params = [];
    if (doctorId)  { params.push(doctorId);  sql += ` AND doctor_id=$${params.length}`;  }
    if (patientId) { params.push(patientId); sql += ` AND patient_id=$${params.length}`; }
    sql += " ORDER BY created_at DESC";
    const { rows } = await query(sql, params);
    return res.json(rows.map(toCamel));
  } catch (err) {
    console.error("GET /api/ratings:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ══════════════════════════════════════════════════════════════
//  ADMIN STATS
// ══════════════════════════════════════════════════════════════

app.get("/api/admin/stats", async (_req, res) => {
  try {
    const [patients, doctors, appts, ratings] = await Promise.all([
      query("SELECT COUNT(*)::int AS cnt FROM patients"),
      query("SELECT COUNT(*)::int AS cnt FROM doctors WHERE is_active=true"),
      query(`SELECT
               COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE status='booked')::int    AS booked,
               COUNT(*) FILTER (WHERE status='completed')::int AS completed,
               COUNT(*) FILTER (WHERE status='cancelled')::int AS cancelled
             FROM appointments`),
      query("SELECT COUNT(*)::int AS cnt FROM ratings"),
    ]);
    return res.json({
      totalPatients:     patients.rows[0].cnt,
      totalDoctors:      doctors.rows[0].cnt,
      totalAppointments: appts.rows[0].total,
      booked:            appts.rows[0].booked,
      completed:         appts.rows[0].completed,
      cancelled:         appts.rows[0].cancelled,
      totalRatings:      ratings.rows[0].cnt,
    });
  } catch (err) {
    console.error("GET /api/admin/stats:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});
// Existing routes above...

// ══════════════════════════════════════════════════════════════
//  PATIENTS (Admin management)
// ══════════════════════════════════════════════════════════════

app.get("/api/patients", async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT p.*,
              COUNT(a.id)::int AS total_appointments
       FROM patients p
       LEFT JOIN appointments a ON a.patient_id = p.id
       GROUP BY p.id
       ORDER BY p.created_at DESC`
    );
    return res.json(rows.map(r => sanitizeUser(toCamel(r))));
  } catch (err) {
    console.error("GET /api/patients:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/api/patients/:id", async (req, res) => {
  try {
    await query("DELETE FROM patients WHERE id=$1", [req.params.id]);
    return res.status(204).send();
  } catch (err) {
    console.error("DELETE /api/patients/:id:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ── Start ─────────────────────────────────────────────────────
initDb()
  .then(() => app.listen(PORT, () => {
    console.log(`🚀  SmartCare API → http://localhost:${PORT}`);
  }))
  .catch((err) => {
    console.error("DB init failed:", err.message);
    process.exit(1);
  });

