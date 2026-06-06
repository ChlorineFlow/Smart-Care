/**
 * server/db.js – PostgreSQL pool + helpers
 */
import "dotenv/config";
import pg from "pg";
import crypto from "node:crypto";

const { Pool } = pg;

export const pool = new Pool({
  host:     process.env.DB_HOST     || "localhost",
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || "smartcare",
  user:     process.env.DB_USER     || "postgres",
  password: process.env.DB_PASSWORD || "",
  ssl:      process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});
pool.on("error", (err) => console.error("PG pool error:", err.message));

export const query = (text, params) => pool.query(text, params);

export const sanitizeUser = (row) => {
  if (!row) return null;
  const { password: _pw, ...safe } = row;
  return safe;
};

export const makeId = (prefix) => `${prefix}-${crypto.randomUUID()}`;

export const toCamel = (row) => {
  if (!row) return null;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = v;
  }
  return out;
};

export const doctorStats = async (doctorId) => {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS reviews, COALESCE(AVG(score),0) AS average FROM ratings WHERE doctor_id=$1`,
    [doctorId]
  );
  return { rating: Number(Number(rows[0].average).toFixed(1)), reviews: rows[0].reviews };
};

// Generate 6-digit OTP
export const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// Seed initial data if empty
const now = () => new Date().toISOString();
export const initDb = async () => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query("SELECT COUNT(*)::int AS cnt FROM admins");
    if (rows[0].cnt > 0) { console.log("✅  DB ready."); return; }
    console.log("🌱  Seeding…");
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO admins (id,role,name,email,password,created_at) VALUES ('admin-1','admin','System Admin','admin@smartcare.app','Admin@2024',$1)`,
      [now()]
    );
    for (const [id, name, age, email, phone, spec, exp, pwd, slots] of [
      ["doctor-1","Dr. Meera Iyer",42,"meera@smartcare.app","9887776665","Cardiologist",15,"MeeraDoc@123",["09:00","11:00","14:00","16:00"]],
      ["doctor-2","Dr. Arjun Patel",37,"arjun@smartcare.app","9877001100","Dermatologist",10,"ArjunDoc@123",["09:00","11:00","14:00","16:00"]],
    ]) {
      await client.query(
        `INSERT INTO doctors (id,role,name,age,email,phone,specialization,experience,password,added_by_admin,is_active,created_at)
         VALUES ($1,'doctor',$2,$3,$4,$5,$6,$7,$8,'admin-1',true,$9)`,
        [id,name,age,email,phone,spec,exp,pwd,now()]
      );
      for (const s of slots) await client.query(
        "INSERT INTO doctor_slots (doctor_id,slot_time) VALUES ($1,$2) ON CONFLICT DO NOTHING",[id,s]
      );
    }
    await client.query(
      `INSERT INTO patients (id,role,name,age,email,phone,password,is_verified,created_at)
       VALUES ('patient-1','patient','Rahul Sharma',28,'rahul@smartcare.app','9991112223','Rahul@123',true,$1)`,
      [now()]
    );
    await client.query("COMMIT");
    console.log("✅  Seeded.");
  } catch (e) { await client.query("ROLLBACK"); throw e; }
  finally { client.release(); }
};
