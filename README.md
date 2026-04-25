# Education Aid Disbursement System (EADS)

A centralized MERN-stack platform for identifying at-risk students and connecting them with verified scholarship providers in Bangladesh. It manages student scholarship applications, donor programs, and fund distribution with transparency and fairness.

## Features (25 Core)

- **Student**: Registration with Birth Certificate ID, academic info, district/upazila, document upload, verification, financial need score, scholarship history, application status tracking, dropout risk flag.
- **Provider**: Registration, program creation/update/closure, eligibility criteria, fund allocation, applicant ranking, disbursement recording (Bank/bKash/Nagad/Cash), duplicate aid conflict warnings.
- **Admin**: Dashboard (users, programs, applications, fund utilization), student verification, at-risk identification run, audit logs, report generation (CSV/PDF), regional impact analytics.
- **System**: JWT role-based auth (student/provider/admin), automated eligibility check, duplicate detection, real-time notifications and email alerts.

## Tech Stack

- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, Multer, Nodemailer, PDFKit, csv-stringify
- **Frontend**: React 18, Vite, React Router, React Hot Toast

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

## Setup

### 1. Clone and install

```bash
cd EADS
npm run install:all
```

### 2. Backend environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set at least:

- `MONGODB_URI` – MongoDB connection string
- `JWT_SECRET` – strong secret for JWT
- `CLIENT_URL` – e.g. `http://localhost:5173`
- Optional: `SMTP_*` and `EMAIL_FROM` for email alerts

### 3. Seed database (optional)

To populate **1 admin, 10 providers, and 100 students** for development:

```bash
cd backend
npm run seed
```

- **Admin**: `admin@eads.local` / `Admin123!`
- **Providers**: `provider1@eads.local` … `provider10@eads.local` / `Password123`
- **Students**: `student1@eads.local` … `student100@eads.local` / `Password123`

Alternatively, create only an admin with:

```bash
node scripts/createAdmin.js admin@eads.local yourSecurePassword
```

### 4. Run development

**Terminal 1 – backend**

```bash
npm run dev:backend
```

**Terminal 2 – frontend**

```bash
npm run dev:client
```

- Backend: http://localhost:5000  
- Frontend: http://localhost:5173  

Or from project root:

```bash
npm run dev
```

## API Overview

| Area        | Base path        | Main actions |
|------------|------------------|--------------|
| Auth       | `/api/auth`      | register/student, register/provider, login, me |
| Students   | `/api/students`  | profile, documents, scholarship-history |
| Providers  | `/api/providers` | profile |
| Programs   | `/api/programs`  | public list, create, my list, update, rank-applicants |
| Applications | `/api/applications` | apply, my, program/:id, review (approve/reject), eligibility |
| Disbursements | `/api/disbursements` | create, list by program |
| Admin      | `/api/admin`     | dashboard, students, verify, at-risk run, audit, reports |
| Analytics  | `/api/analytics` | regional, aggregation |
| Notifications | `/api/notifications` | list, mark read |

Protected routes require header: `Authorization: Bearer <token>`.

## Project structure

```
EADS/
├── backend/
│   ├── src/
│   │   ├── config/       # db, multer
│   │   ├── controllers/
│   │   ├── middleware/   # auth, error, validate
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/     # eligibility, duplicate, ranking, reports, notifications, dropout risk
│   │   ├── utils/        # auditLog, email
│   │   └── index.js
│   ├── .env.example
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/      # AuthContext
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── package.json
└── README.md
```

## License

MIT.
