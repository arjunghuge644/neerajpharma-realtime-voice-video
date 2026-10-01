# NeerajPharma Real-Time Voice & Video Calling Platform

Real-Time Telemedicine backend service enabling secure audio/video consultations between patients and doctors over WebRTC and Socket.IO signaling, gated by appointment authorization and monitored via Admin Dashboard APIs.

---

## 📁 Project Structure

```
neerajpharma-realtime-voice-video/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database models (User, Appointment, CallSession)
│   │   └── seed.js             # Initial database seed (Patient, Doctor, Admin)
│   ├── public/
│   │   └── demo.html           # Dual Patient-Doctor browser call demo
│   ├── src/
│   │   ├── config/             # Database & environment configurations
│   │   ├── controllers/        # REST route controllers
│   │   ├── middleware/         # Auth, RBAC & Error handling middleware
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # Business logic & call gating services
│   │   ├── sockets/            # Socket.IO & WebRTC signaling handlers
│   │   ├── utils/              # JWT & API response utilities
│   │   └── validators/         # Input validation schemas (Zod)
│   ├── .env.example            # Environment variables template
│   ├── package.json
│   └── server.js               # Entry point
├── postman/
│   └── realtime-calling.json   # Complete Postman Collection
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Installation & Environment Setup

```bash
cd backend
npm install
```

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default `.env` configuration:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET="neerajpharma_telemedicine_jwt_secret_key_2026_super_secure"
JWT_EXPIRES_IN="24h"
STUN_SERVER="stun:stun.l.google.com:19302"
```

### 2. Database Migration & Seeding

Run database schema push and seed initial test accounts:

```bash
npx prisma db push
node prisma/seed.js
```

Seeded test accounts:
* **Patient**: `patient@neerajpharma.com` | Password: `Patient123!`
* **Doctor**: `doctor@neerajpharma.com` | Password: `Doctor123!`
* **Admin**: `admin@neerajpharma.com` | Password: `Admin123!`

### 3. Start Server

```bash
npm run dev
```

Server runs at `http://localhost:5000`.

---

## 📡 API Endpoints Reference

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user | Public |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token | Public |
| `GET` | `/api/auth/me` | Fetch current user profile | Authenticated |

### 📅 Appointments & Access Control (`/api/appointments`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/appointments` | Book new appointment | Patient |
| `GET` | `/api/appointments` | List user appointments | Patient / Doctor |
| `GET` | `/api/appointments/:id` | View appointment details | Patient / Doctor |

### 📞 Call Management (`/api/calls`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/calls` | Initiate a voice or video call session | Patient / Doctor |
| `POST` | `/api/calls/:id/end` | End call session and calculate duration | Participant |
| `GET` | `/api/calls/history` | Get user call consultation logs | Authenticated |
| `GET` | `/api/calls/ice-servers` | Get STUN/TURN ICE server configuration | Authenticated |
| `GET` | `/api/calls/:id` | View call session details | Participant |

### 📊 Admin Dashboard (`/api/admin/calls`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/calls/stats` | Aggregate system metrics & call stats | Admin Only |
| `GET` | `/api/admin/calls/active` | Monitor real-time active call sessions | Admin Only |
| `GET` | `/api/admin/calls` | System-wide paginated call audit logs | Admin Only |
| `GET` | `/api/admin/calls/:id` | Detailed system call session log | Admin Only |

---

## 🧪 Postman API Testing Guide

### 1. Import Collection
Import `postman/realtime-calling.json` into Postman. Set environment variable `baseUrl` to `http://localhost:5000`.

### 2. REST Authentication & Execution Order
1. **Login Patient** (`POST /api/auth/login`): Automatically saves `patientToken`.
2. **Login Doctor** (`POST /api/auth/login`): Automatically saves `doctorToken`.
3. **Login Admin** (`POST /api/auth/login`): Automatically saves `adminToken`.
4. **List Appointments** (`GET /api/appointments`): Extracts active `appointmentId`.
5. **Initiate Call** (`POST /api/calls`): Creates call session and returns room ID + ICE servers.
6. **End Call** (`POST /api/calls/:id/end`): Calculates duration and updates database status to `COMPLETED`.

### 3. Socket.IO Real-Time Call Signaling (Dual-Tab Testing)

To test live signaling events in Postman (v10+ Socket.IO feature):

1. **Tab 1 (Doctor Socket)**:
   * New Socket.IO Request to `http://localhost:5000`
   * Auth: Handshake Key `token` = `Bearer <doctorToken>`
   * Click **Connect**.
2. **Tab 2 (Patient Socket)**:
   * New Socket.IO Request to `http://localhost:5000`
   * Auth: Handshake Key `token` = `Bearer <patientToken>`
   * Click **Connect**.
3. **Initiate Call**:
   * Patient emits `call:initiate` with payload `{ "appointmentId": "<appointmentId>", "callType": "VIDEO" }`.
   * Doctor instantly receives **`call:incoming`** event.
4. **Accept Call**:
   * Doctor emits `call:accept` with payload `{ "callSessionId": "<callSessionId>" }`.
   * Both tabs receive **`call:accepted`** event and database records `startTime`.
5. **WebRTC Relay**:
   * Emit `webrtc:offer`, `webrtc:answer`, and `webrtc:ice-candidate` to relay peer connection data.
6. **End Call**:
   * Emit `call:end` with payload `{ "callSessionId": "<callSessionId>" }`.
   * Both tabs receive **`call:ended`** event with exact duration logged in database.

---

## 💻 Browser Demo Client

To visually test patient and doctor call interaction:
1. Start the server (`npm run dev`).
2. Open `http://localhost:5000/demo.html` in your browser.
3. Use the dual Patient / Doctor interface to test call initiation, ring state, acceptance, and WebRTC media connection.
