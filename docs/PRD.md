# Product Requirements Document (PRD)

## 1. Product Overview

### 1.1 Product Name
**NeerajPharma Real-Time Voice & Video Calling Platform**

### 1.2 Objective
The primary objective of this project is to allow authenticated patients and doctors to conduct secure real-time voice and video consultations, backed by automated session logging, database persistence, and comprehensive administrative oversight.

### 1.3 Scope & Context
This platform is an independent, modular telemedicine prototype for NeerajPharma. It focuses on the core tele-consultation workflow: scheduled appointment verification, peer-to-peer WebRTC media delivery over Socket.IO signaling, NAT traversal via coturn, and session tracking for auditing and administrative compliance.

---

## 2. Target Users & Personas

| Persona | Role Description | Key Motivations & Tasks |
| :--- | :--- | :--- |
| **Patient** | End-user seeking healthcare advice | Log in, view valid upcoming appointments, initiate voice/video calls to assigned doctor, mute/unmute audio/video, end call, view past consultation history. |
| **Doctor** | Healthcare provider conducting consultations | Log in, view scheduled appointments, receive call notifications, accept or reject incoming calls, toggle media, view call history. |
| **Admin** | Operations & Compliance Officer | Log in to central admin dashboard, view system-wide call metrics (total calls, completion rates, failure breakdown), inspect active calls, review complete historical call logs. |

---

## 3. Core User Journeys

### 3.1 Patient User Journey
```
[Login] ──► [View Active Appointment] ──► [Initiate Voice/Video Call]
                                                  │
                                                  ▼
[View Consultation History] ◄── [End Call] ◄── [Peer-to-Peer Consultation] ◄── [Doctor Accepts]
```

1. **Authentication**: Patient logs in with email and password, receiving a JWT.
2. **Appointment Check**: Patient views valid appointments scheduled for the current timeframe.
3. **Call Initiation**: Patient selects Voice or Video call mode and initiates the call.
4. **Signaling & Consultation**: Patient hears a ringing tone while signaling the assigned doctor. Once accepted, peer-to-peer WebRTC audio/video stream is established.
5. **Call Termination & Logging**: Either participant clicks "End Call". Call status (`COMPLETED`) and duration are recorded in PostgreSQL.

---

### 3.2 Doctor User Journey
```
[Login] ──► [View Assigned Appointments] ──► [Incoming Call Alert (Modal/Sound)]
                                                          │
                                            ┌─────────────┴─────────────┐
                                            ▼                           ▼
                                     [Accept Call]               [Reject Call]
                                            │                           │
                                            ▼                           ▼
                                  [Conduct Consultation]      [Status: REJECTED]
                                            │                           │
                                            ▼                           ▼
                                       [End Call]           [Return to Dashboard]
```

1. **Authentication**: Doctor logs in and stays on active appointment screen.
2. **Incoming Call Handling**: Receives real-time Socket.IO incoming call modal with caller information and call type (Voice/Video).
3. **Accept / Reject**:
   * **Accept**: Triggers WebRTC answer negotiation, opens consultation video grid.
   * **Reject**: Emits call rejection signal to patient; session status marked as `REJECTED`.
4. **Busy State**: If doctor is currently in an active call, system automatically responds with `BUSY` status to any secondary caller.

---

### 3.3 Admin User Journey
```
[Admin Login] ──► [Executive Dashboard]
                        │
      ┌─────────────────┼─────────────────┬─────────────────┐
      ▼                 ▼                 ▼                 ▼
[System Statistics]  [Active Calls]    [Call History]    [Call Details Modal]
```

1. **Authentication**: Admin logs into dedicated `/admin` area.
2. **Overview Statistics**: Observes key performance indicators (Total Calls, Active Calls, Completion Rate, Missed/Rejected count, Voice vs Video distribution).
3. **Active Calls Monitoring**: Views real-time active consultation sessions, room IDs, and connected participants.
4. **Historical Auditing**: Filters complete call logs by status, date range, patient, or doctor, inspecting exact start/end timestamps and session duration.

---

## 4. Key Functional Features

1. **Dual-Mode Communications**: High-definition video calling (VP8/H.264) and audio-only voice calling (Opus) using WebRTC.
2. **Appointment Validation**: Gating room creation so calls can only occur between assigned patient and doctor for a valid appointment.
3. **In-Call Controls**: Toggle Microphone Mute/Unmute, Camera On/Off, and Emergency Disconnect.
4. **Call State & Durations**: Automated calculation of call duration in seconds, categorized into `COMPLETED`, `MISSED`, `REJECTED`, `BUSY`, `TIMEOUT`, and `FAILED`.
5. **Socket.IO Reconnection & Heartbeats**: Graceful handling of network drops with a 30-second re-establishment window before timing out.

---

## 5. Success Criteria & Definition of Done

* ✅ Authenticated Patients & Doctors can successfully conduct Voice & Video calls on modern browsers (Chrome, Firefox, Edge).
* ✅ 100% of initiated calls create a persistent session record in PostgreSQL with accurate start/end timestamps and duration.
* ✅ Admin Dashboard accurately renders real-time active calls and aggregated metrics.
* ✅ All REST APIs covered with passing Postman tests for 200/201 Success, 400 Validation Errors, 401 Unauthenticated, 403 Forbidden, and 404 Not Found.
