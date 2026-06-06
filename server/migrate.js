/**
 * server/migrate.js
 * One-time migration: imports all data from server/db.json into PostgreSQL.
 *
 * Usage:
 *   node server/migrate.js
 *
 * Requirements:
 *   - .env configured with DB_* variables
 *   - Tables already created (run: psql ... -f server/schema.sql)
 *   - server/db.json present
 */

import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pool = new Pool({
  host:     process.env.DB_HOST     || "localhost",
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || "smartcare",
  user:     process.env.DB_USER     || "postgres",
  password: process.env.DB_PASSWORD || "",
  ssl:      process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const dbJsonPath = path.join(__dirname, "db.json");
const data = JSON.parse(readFileSync(dbJsonPath, "utf8"));

async function migrate() {
  const client = await pool.connect();
  console.log("✅  Connected to PostgreSQL\n");

  try {
    await client.query("BEGIN");

    // Patients
    console.log(`→  Migrating ${data.patients.length} patients…`);
    for (const p of data.patients) {
      await client.query(
        `INSERT INTO patients (id, role, name, age, email, phone, password, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
        [p.id, p.role ?? "patient", p.name, p.age, p.email.toLowerCase(), p.phone, p.password, p.createdAt]
      );
    }

    // Doctors + slots
    console.log(`→  Migrating ${data.doctors.length} doctors…`);
    for (const d of data.doctors) {
      await client.query(
        `INSERT INTO doctors (id, role, name, age, email, phone, specialization, experience, password, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
        [d.id, d.role ?? "doctor", d.name, d.age, d.email.toLowerCase(), d.phone,
         d.specialization, d.experience, d.password, d.createdAt]
      );
      for (const slot of (d.slots || [])) {
        await client.query(
          "INSERT INTO doctor_slots (doctor_id, slot_time) VALUES ($1,$2) ON CONFLICT (doctor_id, slot_time) DO NOTHING",
          [d.id, slot]
        );
      }
    }

    // Admins
    console.log(`→  Migrating ${data.admins.length} admins…`);
    for (const a of data.admins) {
      await client.query(
        `INSERT INTO admins (id, role, name, email, password, created_at)
         VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
        [a.id, a.role ?? "admin", a.name, a.email.toLowerCase(), a.password, a.createdAt]
      );
    }

    // Appointments
    console.log(`→  Migrating ${data.appointments.length} appointments…`);
    for (const appt of data.appointments) {
      await client.query(
        `INSERT INTO appointments
           (id, patient_id, patient_name, doctor_id, doctor_name, specialization, date, time, status, rated, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO NOTHING`,
        [appt.id, appt.patientId, appt.patientName, appt.doctorId, appt.doctorName,
         appt.specialization, appt.date, appt.time, appt.status, appt.rated ?? false, appt.createdAt]
      );
    }

    // Ratings
    console.log(`→  Migrating ${data.ratings.length} ratings…`);
    for (const r of data.ratings) {
      await client.query(
        `INSERT INTO ratings
           (id, appointment_id, doctor_id, doctor_name, patient_id, patient_name, score, comment, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
        [r.id, r.appointmentId, r.doctorId, r.doctorName, r.patientId, r.patientName,
         r.score, r.comment ?? "", r.createdAt]
      );
    }

    await client.query("COMMIT");
    console.log("\n🎉  Migration complete!\n");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\n❌  Migration failed – rolled back:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
