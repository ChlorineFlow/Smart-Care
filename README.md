<div align="center">

<img src="https://img.shields.io/badge/SmartCare-Healthcare%20Platform-2563EB?style=for-the-badge&logo=heart&logoColor=white" alt="SmartCare"/>

# 🏥 SmartCare

### Full-Stack Healthcare Appointment Management Platform

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/Express.js-4-000000?style=flat-square&logo=express&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white"/>
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white"/>
  <img src="https://img.shields.io/badge/Nodemailer-Email-EA4335?style=flat-square&logo=gmail&logoColor=white"/>
  <img src="https://img.shields.io/badge/node--cron-Scheduler-339933?style=flat-square&logo=node.js&logoColor=white"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square"/>
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square"/>
  <img src="https://img.shields.io/github/last-commit/ChlorineFlow/Smart-Care?style=flat-square"/>
</p>

<p align="center">
  <b>Patients · Doctors · Admins · OTP Auth · Real Emails · Prescriptions · Analytics · CI/CD Ready</b>
</p>

</div>

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Default Credentials](#-default-credentials)
- [Available Scripts](#-available-scripts)
- [Deployment](#-deployment)
- [License](#-license)

---

## 🌟 About

**SmartCare** is a production-grade, full-stack healthcare appointment management platform that connects patients with verified doctors. It features a role-based authentication system with three distinct portals — **Patient**, **Doctor**, and **Admin** — each with a fully functional dashboard tailored to their needs.

Patients verify their identity via **OTP email verification** during signup and can also log in passwordlessly using OTP. Doctors receive their credentials directly from the admin when their account is created. Admins manage the entire platform from a secure dashboard with real-time analytics.

The platform includes automated email notifications for OTPs, appointment cancellations, reschedule confirmations, and 24-hour appointment reminders powered by a cron job scheduler.

---

---

## ✨ Features

### 🧑‍⚕️ Patient
- ✅ Signup with **OTP email verification** (real email via Gmail SMTP)
- ✅ Login with **password** or **passwordless OTP login**
- ✅ Book appointments with live availability calendar
- ✅ See doctor's blocked dates and recurring off-days before booking
- ✅ Reschedule appointments with new calendar picker
- ✅ Cancel appointments
- ✅ Download **PDF prescriptions** uploaded by doctor
- ✅ Rate and review doctors after completed appointments
- ✅ Receive **email notification** when appointment is cancelled
- ✅ Receive **reschedule confirmation email** with old vs new slot
- ✅ Receive **24-hour reminder email** before every appointment
- ✅ Delete own account from dashboard

### 👨‍⚕️ Doctor
- ✅ Login with admin-assigned credentials (email + password)
- ✅ View all scheduled appointments
- ✅ Mark appointments as completed or cancelled
- ✅ Upload **PDF prescriptions** per completed appointment
- ✅ Block specific unavailable dates on calendar (multi-select)
- ✅ Block **recurring days of the week** (e.g. every Saturday)
- ✅ Analytics dashboard — appointment trends, busiest days, slot popularity, rating distribution
- ✅ View patient ratings and reviews
- ✅ Manage available time slots

### 🛡️ Admin
- ✅ Secure admin-only login portal
- ✅ Add doctors with **assigned email & password**
- ✅ Auto-generate secure passwords for new doctors
- ✅ Activate / deactivate doctor accounts
- ✅ View all patient accounts with appointment counts
- ✅ Remove patient accounts
- ✅ Platform-wide analytics dashboard
- ✅ Appointment overview with status breakdown

### 📧 Email System
- ✅ OTP verification email on patient signup
- ✅ OTP login email (passwordless)
- ✅ Appointment cancellation notification
- ✅ Appointment reschedule confirmation (old slot vs new slot)
- ✅ **24-hour appointment reminder** (automated cron job — runs every hour)
- ✅ Beautiful HTML email templates for all notifications

### ⏰ Automated Scheduler
- ✅ Cron job runs **every hour** (`0 * * * *`)
- ✅ Scans all booked appointments for **tomorrow's date**
- ✅ Sends reminder emails automatically — no manual trigger needed
- ✅ Logs all activity to server console for monitoring

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8, Tailwind CSS 3, React Router 7, Context API |
| **Backend** | Node.js 20, Express.js 4, REST API |
| **Database** | PostgreSQL 16, pg (node-postgres) |
| **Auth** | OTP via Gmail SMTP, Role-based access control, Session storage |
| **Email** | Nodemailer + Gmail SMTP |
| **Scheduler** | node-cron (hourly reminder job) |
| **DevOps** | Git, GitHub Actions CI/CD, Docker, K3s, AWS Systems Manager |
| **Deployment** | AWS EC2, AWS RDS, AWS S3, AWS CloudFront |

---

## 📁 Project Structure

```
SmartCare/
├── server/
│   ├── index.js              # Express API — all routes + cron job
│   ├── db.js                 # PostgreSQL pool + helpers
│   ├── mailer.js             # Nodemailer — all email templates
│   ├── schema.sql            # CREATE TABLE statements (9 tables)
│   └── migrate.js            # One-time JSON → PostgreSQL migration
│
├── src/
│   ├── pages/
│   │   ├── auth/             # Login, Signup, OTP, Role selection
│   │   │   ├── PatientLogin.jsx
│   │   │   ├── PatientSignup.jsx
│   │   │   ├── DoctorLogin.jsx
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── SelectRole.jsx
│   │   │   └── SelectRoleLogin.jsx
│   │   ├── patient/          # Dashboard, Book, History, Prescriptions, Ratings
│   │   ├── doctor/           # Dashboard, Appointments, Availability, Analytics, Prescriptions, Reviews
│   │   └── admin/            # Dashboard, ManageDoctors, ManagePatients, ManageSlots, Analytics
│   ├── components/           # AppointmentCard, DoctorCard, Sidebar, Navbar, Rating
│   ├── context/              # AuthContext (global auth state)
│   ├── layouts/              # PatientLayout, DoctorLayout, AdminLayout, MainLayout
│   ├── services/             # api.js (all fetch calls)
│   └── utils/                # constants.js
│
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions CI/CD pipeline
├── Dockerfile                # Docker container for backend
├── .env.example              # Environment variable template
├── .gitignore
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## 🗄️ Database Schema

9 PostgreSQL tables with foreign key constraints and cascading deletes:

```
admins
  id · role · name · email (UNIQUE) · password · created_at

doctors
  id · role · name · age · email (UNIQUE) · phone
  specialization · experience · password
  added_by_admin (FK → admins) · is_active · created_at

doctor_slots
  id · doctor_id (FK → doctors) · slot_time
  UNIQUE (doctor_id, slot_time)

doctor_blocked_dates
  id · doctor_id (FK → doctors) · blocked_date · reason
  UNIQUE (doctor_id, blocked_date)

doctor_recurring_blocks
  id · doctor_id (FK → doctors) · day_of_week (0-6) · reason
  UNIQUE (doctor_id, day_of_week)

patients
  id · role · name · age · email (UNIQUE) · phone
  password · is_verified · created_at

otps
  id · email · code · purpose · expires_at · used · created_at

appointments
  id · patient_id (FK → patients) · patient_name
  doctor_id (FK → doctors) · doctor_name
  specialization · date · time · status · rated · created_at

ratings
  id · appointment_id (FK → appointments, UNIQUE)
  doctor_id (FK → doctors) · patient_id (FK → patients)
  score (1–5) · comment · created_at

prescriptions
  id · appointment_id (FK → appointments, UNIQUE)
  doctor_id (FK → doctors) · patient_id (FK → patients)
  patient_name · doctor_name · file_name · file_data (base64) · file_size · created_at
```

> All foreign keys use `ON DELETE CASCADE` — deleting a doctor removes their slots, appointments, ratings and prescriptions automatically.

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/otp/send` | Send OTP to email (signup or login) |
| POST | `/api/otp/verify` | Validate OTP code |
| POST | `/api/auth/login` | Doctor / Admin password login |
| POST | `/api/auth/patient-login` | Patient password login |
| POST | `/api/auth/patient-otp-login` | Patient OTP passwordless login |
| POST | `/api/auth/register/patient` | Patient signup (OTP required) |

### Doctors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors` | List active doctors (patients) |
| GET | `/api/doctors/all` | List all doctors (admin) |
| GET | `/api/doctors/:id` | Get doctor by ID |
| POST | `/api/doctors` | Add doctor (admin) |
| PUT | `/api/doctors/:id/slots` | Update time slots |
| PATCH | `/api/doctors/:id/status` | Activate / deactivate doctor |
| DELETE | `/api/doctors/:id` | Remove doctor |
| GET | `/api/doctors/:id/analytics` | Doctor analytics data |

### Availability
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors/:id/blocked-dates` | Get specific blocked dates |
| POST | `/api/doctors/:id/blocked-dates` | Block a specific date |
| DELETE | `/api/doctors/:id/blocked-dates/:date` | Unblock a date |
| GET | `/api/doctors/:id/recurring-blocks` | Get recurring day blocks |
| POST | `/api/doctors/:id/recurring-blocks` | Block a recurring day |
| DELETE | `/api/doctors/:id/recurring-blocks/:day` | Remove recurring block |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/appointments` | Book appointment |
| GET | `/api/appointments` | List (filter by patient or doctor) |
| PATCH | `/api/appointments/:id/status` | Update status + send cancel email |
| PATCH | `/api/appointments/:id/reschedule` | Reschedule + send confirmation email |

### Prescriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/prescriptions` | Upload prescription PDF |
| GET | `/api/prescriptions` | List prescriptions |
| GET | `/api/prescriptions/:id/download` | Download PDF |

### Ratings & Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ratings` | Submit rating |
| GET | `/api/ratings` | Get ratings (filter by doctor/patient) |
| GET | `/api/patients` | List all patients (admin) |
| DELETE | `/api/patients/:id` | Remove patient |
| GET | `/api/admin/stats` | Platform statistics |
| GET | `/api/health` | Health check |

### Scheduler
| Type | Schedule | Description |
|------|----------|-------------|
| Cron Job | `0 * * * *` (every hour) | Scans tomorrow's booked appointments and sends reminder emails |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Gmail account with 2-Step Verification enabled

### 1 — Clone the repository
```bash
git clone https://github.com/ChlorineFlow/Smart-Care.git
cd Smart-Care
```

### 2 — Install dependencies
```bash
npm install
```

### 3 — Create PostgreSQL database
```bash
psql -U postgres -c "CREATE DATABASE smartcare;"
```

### 4 — Configure environment variables
```bash
cp .env.example .env
# Open .env and fill in your values
```

### 5 — Create database tables
```bash
psql -U postgres -d smartcare -f server/schema.sql
```

### 6 — Start the application
```bash
npm run dev:full
```

- Frontend → http://localhost:5173
- Backend API → http://localhost:4000

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
> 4. Copy the 16-character code as `SMTP_PASS`

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
| `npm run server` | Start Express backend + cron job (runs every hour automatically) |
| `npm run dev:full` | Start both frontend and backend concurrently |
| `npm run build` | Build frontend for production |
| `npm run db:migrate` | Import legacy JSON data into PostgreSQL |

---

## ☁️ Deployment

### SmartCare cloud demo

The `smartcare-cloud.bat` helper uses AWS Systems Manager (SSM), so Jenkins does not need an inbound port 8080 rule and access does not depend on your public IP. It starts EC2 and ensures Docker, K3s and Jenkins are running; it does not deploy application code directly. Only the successful GitHub Actions → SonarCloud → Jenkins path deploys the app.

1. Complete the one-time GitHub, AWS, Jenkins and Kubernetes setup below before expecting an automated deployment.
2. Run `smartcare-cloud.bat` to start EC2 and its services. A main-branch workflow starts a stopped instance automatically after CI and SonarCloud pass.
3. Run `smartcare-cloud.bat connect` in a separate Command Prompt and keep it open to administer Jenkins at `http://localhost:8080`.
4. Run `smartcare-cloud.bat stop` to stop EC2. A later successful main push starts it again and incurs AWS charges.

Install the AWS Session Manager plugin if `aws ssm start-session` reports that it is missing. SSM port forwarding requires no inbound SSH or Jenkins rules; do not expose Jenkins to `0.0.0.0/0`.

### AWS Architecture
```
GitHub push to main → GitHub Actions CI → SonarCloud Quality Gate
  → AWS OIDC/SSM → private Jenkins CD → Docker → GHCR (immutable SHA tags)
  → existing K3s Deployments → existing Services → live website
Browser → existing frontend Service :80 → Nginx /api proxy → backend Service
Backend → existing PostgreSQL service/database and persistent storage
```

### Deployment Components
| Service | Purpose |
|---------|---------|
| EC2 | Hosts private Jenkins and the existing K3s cluster |
| GitHub Actions | Lint, test, build, and require SonarCloud success before CD |
| Jenkins | Fetches the exact verified commit, checks Docker, builds and deploys |
| GitHub Container Registry | Stores immutable commit-SHA-tagged frontend/backend images |
| K3s | Rolls out images by patching existing Deployments only |
| PostgreSQL | Existing database and PVCs are not changed by deployments |

### Push-triggered CI/CD

Only a push to `main` starts the release pipeline. GitHub Actions runs lint, schema-backed API tests and the production frontend build, then SonarCloud must pass its Quality Gate. Actions assumes a narrowly scoped AWS role using OIDC, starts the tagged EC2 instance if it is stopped, and invokes one SHA-validated SSM document. That document triggers the private Jenkins job and waits for its result. Jenkins fetches the exact SHA, checks Docker Engine availability on its labeled build agent, builds/pushes both images, then rolls out only the image fields on the existing Kubernetes Deployments. The deployment script smoke-tests the existing frontend and backend Services and restores their previous images if rollout or smoke testing fails.

The deploy script never applies/recreates Services, namespaces, PVCs or database objects. Existing pod environment, selectors, probes, storage and Service configuration are retained. The EC2 instance remains running after an automatic start so the website can stay available; this incurs normal EC2 charges.

Complete these one-time settings before expecting a live deployment:

1. Review `terraform/main.tf`. In `terraform/`, run `terraform init` and inspect `terraform plan` before applying the GitHub OIDC role, custom SSM document and IAM permissions. Do not apply a plan that replaces the existing EC2 instance or K3s resources. If the OIDC provider already exists in the AWS account, import it into this state rather than attempting to create a duplicate. After an approved apply, get the role ARN with `terraform output -raw github_actions_deploy_role_arn`.
2. In GitHub **Settings → Secrets and variables → Actions**, add repository variable `AWS_DEPLOY_ROLE_ARN` using that Terraform output and repository secret `SONAR_TOKEN` from SonarCloud. No long-lived AWS access key is used.
3. Configure the SonarCloud project to match `sonar-project.properties` (`ChlorineFlow_Smart-Care`, organization `chlorineflow`). A missing/failed Sonar token or failed Quality Gate blocks the Jenkins handoff.
4. Configure Jenkins on EC2 as a private Pipeline job named `SmartCare-CD`, using this repository's `main` branch and `Jenkinsfile`. Before the first push, enable **This project is parameterized** and add a string parameter named `COMMIT_SHA` (default blank) so the SSM helper can call `buildWithParameters`; add the remaining parameters from the Jenkinsfile with their documented defaults or let Declarative Pipeline populate them on its first run. Create a Jenkins node/agent labeled `smartcare-deploy` on EC2. Install and verify a real Docker Engine on that agent; K3s/containerd is not Docker. The Jenkins execution account must pass `docker info`, have `kubectl`, and use the restricted kubeconfig described below. Keep Jenkins port 8080 private; use `smartcare-cloud.bat connect` through SSM for administration.
5. In Jenkins, create username/password credential `smartcare-ghcr-push` with a GitHub token authorized to publish the two GHCR packages. After the first successful package creation, make `smart-care-backend` and `smart-care-frontend` public so K3s can pull without a cluster-wide registry secret. Do not put this token in the repository or on the EC2 command line.
6. Create a Jenkins trigger user with only Overall Read and Read/Build access to `SmartCare-CD`. Open a private EC2 terminal using `smartcare-cloud.bat shell`, then clone the public repo and install the helper:

  ```bash
  sudo install -d -o ubuntu -g ubuntu /opt/smartcare-deploy
  sudo -u ubuntu git clone --depth 1 --branch main https://github.com/ChlorineFlow/Smart-Care.git /opt/smartcare-deploy
  sudo install -o root -g root -m 0750 /opt/smartcare-deploy/ansible/files/smartcare-trigger-jenkins.sh /usr/local/sbin/smartcare-trigger-jenkins
  ```

  Create `/etc/smartcare/jenkins-trigger.env` on EC2, owned by root with mode `0600`; first run `sudo install -d -o root -g root -m 700 /etc/smartcare`, then use `sudoedit` and enter these settings locally (never commit or paste the API token into a command):

  ```env
  JENKINS_USER=smartcare-trigger
  JENKINS_API_TOKEN=<Jenkins user API token>
  JENKINS_URL=http://127.0.0.1:8080
  JENKINS_JOB=SmartCare-CD
  ```

  Then run `sudo chown root:root /etc/smartcare/jenkins-trigger.env` and `sudo chmod 600 /etc/smartcare/jenkins-trigger.env`. Install `curl` and `jq` if absent, enable/start Docker, K3s and Jenkins with systemd, and run `sudo -u jenkins docker info` to verify the actual Jenkins user's Docker access. The Ansible playbook contains these checks for environments where an approved Ansible connection is available; public SSH is not required by this design.
7. Before configuring the job, inspect live resource names/storage without changing anything: `sudo k3s kubectl get deployments,services,pvc -n smartcare`. Confirm the namespace is `smartcare` and the existing names match the Jenkinsfile parameters (`smartcare-backend`, `smartcare-frontend`, and matching container names). The frontend Nginx config expects backend Service `smartcare-backend`; preserve that Service or deliberately update its proxy target. Do not apply replacement Deployment/Service/PVC manifests.
8. Apply only the additive RBAC manifest to the existing `smartcare` namespace as a cluster administrator, after confirming the namespace exists:

  ```bash
  sudo k3s kubectl apply -f k8s/jenkins-rbac.yaml
  TOKEN="$(sudo k3s kubectl -n smartcare create token jenkins-deployer --duration=8760h)"
  CA_FILE="$(mktemp)"
  KUBECONFIG_FILE="$(mktemp)"
  sudo k3s kubectl config view --raw -o jsonpath='{.clusters[0].cluster.certificate-authority-data}' | base64 -d > "$CA_FILE"
  kubectl --kubeconfig="$KUBECONFIG_FILE" config set-cluster smartcare --server=https://127.0.0.1:6443 --certificate-authority="$CA_FILE" --embed-certs=true
  kubectl --kubeconfig="$KUBECONFIG_FILE" config set-credentials jenkins-deployer --token="$TOKEN"
  kubectl --kubeconfig="$KUBECONFIG_FILE" config set-context smartcare --cluster=smartcare --user=jenkins-deployer --namespace=smartcare
  kubectl --kubeconfig="$KUBECONFIG_FILE" config use-context smartcare
  sudo install -d -o jenkins -g jenkins -m 700 /var/lib/jenkins/.kube
  sudo install -o jenkins -g jenkins -m 600 "$KUBECONFIG_FILE" /var/lib/jenkins/.kube/config
  rm -f "$CA_FILE" "$KUBECONFIG_FILE"
  ```

  Rotate this one-year token before expiry. Do not give the Jenkins job the K3s administrator kubeconfig.
9. Ensure EC2 has the SSM instance profile/agent and systemd services Docker, K3s and Jenkins. The security group must allow website HTTP port 80; do not expose Jenkins port 8080. The instance Name tag must be `smartcare-devops-server`.
10. Save files, commit and run `git push origin main`; saving in VS Code alone does not push. If EC2 is stopped, the approved workflow starts it, waits for SSM/Jenkins, and deploys the same verified SHA. Starting a stopped EC2 automatically incurs AWS charges.

The workflow is `.github/workflows/ci-cd.yml`. GitHub secrets, Terraform apply, Jenkins credentials/job setup and K3s RBAC are account/host operations; they are not performed by this repository change. No end-to-end deployment is claimed until the configured pipeline has completed successfully.

### Docker
```bash
# Build image
docker build -t smartcare-api .

# Run container
docker run -p 4000:4000 --env-file .env smartcare-api
```

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
Copyright (c) Priyanshu Bahuguna
```

---

<div align="center">

Made with by **Priyanshu Bahuguna**

⭐ **Star this repo if you found it helpful!**

[🔗 GitHub Repository](https://github.com/ChlorineFlow/Smart-Care)

</div>