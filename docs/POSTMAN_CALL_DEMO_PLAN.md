# Postman Call Demonstration & Testing Implementation Plan

> **Objective**: Complete end-to-end demonstration and testing of Patient-Doctor voice and video calling, Socket.IO real-time signaling, call controls (Accept, Reject, Busy, End), duration tracking, and PostgreSQL database logging strictly using **Postman** (REST + WebSocket/Socket.IO features).

---

## 📋 Overview of the Postman Demonstration Architecture

In Postman (v10+), we utilize two types of requests working together:
1. **REST Requests**: For authentication, appointment lookup, call session creation (`POST /api/calls`), ending calls (`POST /api/calls/:id/end`), and history auditing (`GET /api/calls/history`).
2. **Socket.IO Real-Time Connection Tabs**: For real-time signaling where Doctor receives `call:incoming`, responds with `call:accept` or `call:reject`, and relays WebRTC SDP/ICE candidate events.

```
Postman Tab A (Patient)                       Backend Server                      Postman Tab B (Doctor)
         │                                          │                                       │
[1. Login Patient] ────────────────────────► JWT Token 1                                    │
         │                                          │                                [2. Login Doctor] ────► JWT Token 2
         │                                          │                                       │
[3. Socket Connect (Token 1)] ══════════════════════╪═══════════════════════════════════════╪══► [4. Socket Connect (Token 2)]
         │                                          │                                       │
[5. Emit call:initiate] ───────────────────────────►│                                       │
         │                                          ├──────── Emit call:incoming ──────────►│
         │◄──────── Emit call:ringing ──────────────┤                                       │
         │                                          │◄─────── Emit call:accept ─────────────┤
         │◄──────── Emit call:accepted ─────────────┼──────── Emit call:accepted ──────────►│
         │                                          │                                       │
         │◄═════════════════════ WebRTC SDP (Offer/Answer) & ICE Relay ════════════════════►│
         │                                          │                                       │
         │                                          │◄─────── Emit call:end / REST End ─────┤
         │◄──────── Emit call:ended ────────────────┤                                       │
         │                                          │                                       │
         ▼                                          ▼                                       ▼
 [Calculates Duration]                      [Updates PostgreSQL]                    [Session Status: COMPLETED]
```

---

## 🛠️ Step-by-Step Implementation & Execution Roadmap

### STEP 1: Backend Setup & Initial State
1. Start backend server:
   ```bash
   cd backend
   npm run dev
   ```
   *(Server starts at `http://localhost:5000`)*
2. Ensure demo database is seeded (`patient@neerajpharma.com`, `doctor@neerajpharma.com`, active appointment).

---

### STEP 2: REST Authentication & Variable Extraction (Postman Collection)

In Postman, open the collection file [postman/realtime-calling.json](file:///home/arjun/neerajpharma-realtime-voice-video/postman/realtime-calling.json):

1. **Patient Login** (`POST http://localhost:5000/api/auth/login`):
   * Body:
     ```json
     { "email": "patient@neerajpharma.com", "password": "Patient123!" }
     ```
   * *Outcome*: Returns `200 OK`. Post-response script automatically saves `patientToken`.

2. **Doctor Login** (`POST http://localhost:5000/api/auth/login`):
   * Body:
     ```json
     { "email": "doctor@neerajpharma.com", "password": "Doctor123!" }
     ```
   * *Outcome*: Returns `200 OK`. Post-response script automatically saves `doctorToken`.

3. **Get Active Appointment ID** (`GET http://localhost:5000/api/appointments`):
   * Header: `Authorization: Bearer {{patientToken}}`
   * *Outcome*: Returns list of appointments. Saves `appointmentId` (`ee84fa84-9928-4d37-b37d-fd2a5e8b1934`).

---

### STEP 3: Real-Time Socket.IO Dual-Tab Setup in Postman

1. **Tab B (Doctor Listener Socket)**:
   * In Postman, click **New -> Socket.IO Request**.
   * URL: `http://localhost:5000`
   * Under **Auth**: Select `Handshake` -> Key: `token`, Value: `Bearer <doctorToken>`.
   * Click **Connect**.
   * *Server Console output*: `⚡ [Socket Connected] Dr. Sarah Jenkins (doctor@neerajpharma.com)`.

2. **Tab A (Patient Caller Socket)**:
   * Click **New -> Socket.IO Request**.
   * URL: `http://localhost:5000`
   * Under **Auth**: Key: `token`, Value: `Bearer <patientToken>`.
   * Click **Connect**.
   * *Server Console output*: `⚡ [Socket Connected] John Doe (Patient) (patient@neerajpharma.com)`.

---

### STEP 4: Executing the Complete Call Action Sequence in Postman

#### Scenario A: Initiate & Accept Call Session

1. **Patient Initiates Call**:
   * In **Tab A (Patient)**, under **Events**, set Event Name to `call:initiate`.
   * Payload:
     ```json
     {
       "appointmentId": "{{appointmentId}}",
       "callType": "VIDEO"
     }
     ```
   * Click **Send**.
   * **Result**:
     * Patient receives acknowledgement with `callSessionId` and `roomId`.
     * Patient receives event `call:ringing`.
     * **Doctor (Tab B)** instantly receives real-time event **`call:incoming`** containing patient profile and `callSessionId`!

2. **Doctor Accepts Call**:
   * In **Tab B (Doctor)**, set Event Name to `call:accept`.
   * Payload:
     ```json
     {
       "callSessionId": "<callSessionId_from_incoming_event>"
     }
     ```
   * Click **Send**.
   * **Result**:
     * Both Tab A (Patient) and Tab B (Doctor) receive real-time event **`call:accepted`**!
     * Server updates PostgreSQL `CallSession` status to `CONNECTED` and records `startTime`.

3. **WebRTC Signaling Exchange Relay**:
   * In Tab A (Patient), emit `webrtc:offer`:
     ```json
     { "appointmentId": "{{appointmentId}}", "sdp": { "type": "offer", "sdp": "v=0\r\nsample_sdp_offer" } }
     ```
     * -> Doctor (Tab B) receives `webrtc:offer`.
   * In Tab B (Doctor), emit `webrtc:answer`:
     ```json
     { "appointmentId": "{{appointmentId}}", "sdp": { "type": "answer", "sdp": "v=0\r\nsample_sdp_answer" } }
     ```
     * -> Patient (Tab A) receives `webrtc:answer`.

4. **Ending the Call**:
   * In Tab B (Doctor) or Tab A (Patient), emit `call:end`:
     ```json
     { "callSessionId": "<callSessionId>" }
     ```
   * **Result**:
     * Both tabs receive real-time event **`call:ended`** with exact duration in seconds!
     * PostgreSQL database updates record to `COMPLETED`, records `endTime`, and stores computed `duration`.

---

### STEP 5: Verifying Stored PostgreSQL Call Record & History via REST

1. **Verify Call History** (`GET http://localhost:5000/api/calls/history`):
   * Header: `Authorization: Bearer {{patientToken}}`
   * *Response*:
     ```json
     {
       "success": true,
       "data": {
         "calls": [
           {
             "id": "call_12345...",
             "callType": "VIDEO",
             "status": "COMPLETED",
             "duration": 45,
             "startTime": "2026-09-28T18:34:00.000Z",
             "endTime": "2026-09-28T18:34:45.000Z",
             "patient": { "name": "John Doe (Patient)" },
             "doctor": { "name": "Dr. Sarah Jenkins" }
           }
         ]
       }
     }
     ```

---

## 🎯 Summary Checklist of Call Actions Demonstrated in Postman

| Action | Sender | Receiver | Postman Mechanism | Server & DB Effect |
| :--- | :--- | :--- | :--- | :--- |
| **Authenticate** | Patient / Doctor | Server | REST `POST /api/auth/login` | Issues JWT Token |
| **Initiate Call** | Patient Tab A | Doctor Tab B | Socket event `call:initiate` | Creates DB record (`INITIATED`), emits `call:incoming` to Doctor |
| **Accept Call** | Doctor Tab B | Patient Tab A | Socket event `call:accept` | Sets status `CONNECTED`, records `startTime`, emits `call:accepted` |
| **Reject Call** | Doctor Tab B | Patient Tab A | Socket event `call:reject` | Sets status `REJECTED`, duration = 0, emits `call:rejected` |
| **Busy State** | Server | Patient Tab A | REST or Socket initiation | Auto-returns `BUSY` (409) if doctor is in active call |
| **End Call** | Patient / Doctor | Both Tabs | Socket `call:end` or REST `/end` | Sets status `COMPLETED`, calculates duration `endTime - startTime` |
| **Audit Log** | Admin / User | Server | REST `GET /api/calls/history` | Fetches complete call record from PostgreSQL |
