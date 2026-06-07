<div align="center">

<img src="https://img.shields.io/badge/SmartCare-Healthcare%20Platform-blue?style=for-the-badge&logo=heart&logoColor=white" alt="SmartCare" />

# 🏥 SmartCare

### A full-stack healthcare appointment management platform

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Nodemailer-Email-EA4335?style=flat-square&logo=gmail&logoColor=white" />
</p>

<p align="center">
  <b>Patients · Doctors · Admins · OTP Auth · Real Emails · Appointment Management</b>
</p>

</div>

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Default Credentials](#-default-credentials)
- [Screenshots](#-screenshots)

---

## 🌟 About

**SmartCare** is a production-grade healthcare appointment management platform that connects patients with doctors. It features a role-based authentication system with three distinct portals — **Patient**, **Doctor**, and **Admin** — each with a fully functional dashboard tailored to their needs.

Patients verify their identity via **OTP email verification** during signup and can also log in passwordlessly using OTP. Doctors receive their credentials directly from the admin when their account is created. Admins manage the entire platform from a secure dashboard.

---

## ✨ Features

### 🧑‍⚕️ Patient
- ✅ Signup with **OTP email verification** (real email via Gmail SMTP)
- ✅ Login with **password** or **passwordless OTP login**
- ✅ Book appointments with available doctors
- ✅ View upcoming and past appointments
- ✅ Rate and review doctors after completed appointments
- ✅ Receive **email notification** when appointment is cancelled
- ✅ Delete own account from dashboard

### 👨‍⚕️ Doctor
- ✅ Login with admin-assigned credentials
- ✅ View all scheduled appointments
- ✅ Mark appointments as completed or cancelled
- ✅ View patient ratings and reviews
- ✅ Manage available time slots

### 🛡️ Admin
- ✅ Secure admin login portal
- ✅ Add doctors with **assigned email & password**
- ✅ Auto-generate secure passwords for doctors
- ✅ Activate / deactivate doctor accounts
- ✅ View and remove patient accounts
- ✅ View platform-wide analytics and stats
- ✅ Manage doctor time slots

### 📧 Email System
- ✅ OTP verification email on patient signup
- ✅ OTP login email (passwordless)
- ✅ Appointment cancellation notification to patient
- ✅ Beautiful HTML email templates

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8, Tailwind CSS 3, React Router 7 |
| **Backend** | Node.js, Express 4 |
| **Database** | PostgreSQL 16 |
| **ORM / DB Driver** | pg (node-postgres) |
| **Email** | Nodemailer + Gmail SMTP |
| **Auth** | Session-based with localStorage + OTP |
| **Styling** | Tailwind CSS with custom glassmorphism UI |

---

## 📁 Project Structure

```
SmartCare/
├── server/
│   ├── index.js          # Express API — all routes
│   ├── db.js             # PostgreSQL pool + helpers
│   ├── mailer.js         # Nodemailer — OTP & cancellation emails
│   ├── schema.sql        # CREATE TABLE statements
│   └── migrate.js        # One-time JSON → PostgreSQL migration
│
├── src/
│   ├── pages/
│   │   ├── auth/         # Login, Signup, OTP, Role selection
│   │   ├── patient/      # Dashboard, Book, History, Ratings
│   │   ├── doctor/       # Dashboard, Appointments, Reviews
│   │   └── admin/        # Dashboard, Doctors, Patients, Slots, Analytics
│   ├── components/       # AppointmentCard, DoctorCard, Sidebar, Navbar
│   ├── context/          # AuthContext (global auth state)
│   ├── layouts/          # PatientLayout, DoctorLayout, AdminLayout
│   ├── services/         # api.js (all fetch calls)
│   └── utils/            # constants.js
│
├── .env.example          # Environment variable template
├── package.json
└── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- A Gmail account with 2FA enabled (for SMTP)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/SmartCare.git
cd SmartCare
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up PostgreSQL database
```bash
psql -U postgres -c "CREATE DATABASE smartcare;"
```

### 4. Configure environment variables
```bash
cp .env.example .env
```
Open `.env` and fill in your values (see [Environment Variables](#-environment-variables) below).

### 5. Create database tables
```bash
psql -U postgres -d smartcare -f server/schema.sql
```

### 6. Start the application
```bash
npm run dev:full
```

- Frontend → [http://localhost:5173](http://localhost:5173)
- Backend API → [http://localhost:4000](http://localhost:4000)

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartcare
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_SSL=false

# Express
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Gmail SMTP
# Get App Password: Google Account → Security → 2FA → App Passwords
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_16_char_app_password
SMTP_FROM=SmartCare <your_gmail@gmail.com>
```

> **How to get Gmail App Password:**
> 1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
> 2. Enable **2-Step Verification**
> 3. Search **"App passwords"** → Select Mail → Generate
> 4. Copy the 16-character code and paste it as `SMTP_PASS`

---

## 🗄️ Database Schema

```
admins
  id · role · name · email · password · created_at

doctors
  id · role · name · age · email · phone · specialization
  experience · password · added_by_admin (FK) · is_active · created_at

doctor_slots
  id · doctor_id (FK) · slot_time
  UNIQUE(doctor_id, slot_time)

patients
  id · role · name · age · email · phone
  password · is_verified · created_at

otps
  id · email · code · purpose · expires_at · used · created_at

appointments
  id · patient_id (FK) · patient_name · doctor_id (FK) · doctor_name
  specialization · date · time · status · rated · created_at

ratings
  id · appointment_id (FK, UNIQUE) · doctor_id (FK) · doctor_name
  patient_id (FK) · patient_name · score · comment · created_at
```

All foreign keys use `ON DELETE CASCADE` — deleting a doctor automatically removes their slots, appointments, and ratings.

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/otp/send` | Send OTP to email |
| POST | `/api/otp/verify` | Verify OTP code |
| POST | `/api/auth/login` | Doctor / Admin login |
| POST | `/api/auth/patient-login` | Patient password login |
| POST | `/api/auth/patient-otp-login` | Patient OTP login |
| POST | `/api/auth/register/patient` | Patient signup (OTP required) |

### Doctors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors` | List active doctors |
| GET | `/api/doctors/all` | List all doctors (admin) |
| GET | `/api/doctors/:id` | Get doctor by ID |
| POST | `/api/doctors` | Add doctor (admin) |
| PUT | `/api/doctors/:id/slots` | Update time slots |
| PATCH | `/api/doctors/:id/status` | Activate / deactivate |
| DELETE | `/api/doctors/:id` | Remove doctor |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/appointments` | Book appointment |
| GET | `/api/appointments` | List (filter by patient/doctor) |
| PATCH | `/api/appointments/:id/status` | Update status + send cancel email |

### Patients & Ratings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients` | List all patients (admin) |
| DELETE | `/api/patients/:id` | Remove patient |
| POST | `/api/ratings` | Submit rating |
| GET | `/api/ratings` | Get ratings (filter by doctor/patient) |
| GET | `/api/admin/stats` | Platform statistics |

---

## 🔐 Default Credentials

> ⚠️ Change these immediately in production.

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@smartcare.app | Admin@2024 |
| Doctor | meera@smartcare.app | MeeraDoc@123 |
| Doctor | arjun@smartcare.app | ArjunDoc@123 |
| Patient | rahul@smartcare.app | Rahul@123 |

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite frontend only |
| `npm run server` | Start Express backend only |
| `npm run dev:full` | Start both concurrently |
| `npm run build` | Build frontend for production |
| `npm run db:migrate` | Import legacy JSON data into PostgreSQL |

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

Made with ❤️ by **Priyanshu Bahuguna**

⭐ Star this repo if you found it helpful!

</div>
