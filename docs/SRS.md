# Software Requirements Specification (SRS) - Backend Focus

## 1. Functional Requirements

### 1.1 Voice & Video Call Backend Module (`FR-CALL`)

| Requirement ID | Title | Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-CALL-001** | Initiate Voice Call Endpoint & Signal | Backend server shall validate appointment, create call session with type `VOICE`, and emit `call:initiate` event to doctor room. | High |
| **FR-CALL-002** | Initiate Video Call Endpoint & Signal | Backend server shall validate appointment, create call session with type `VIDEO`, and emit `call:initiate` event to doctor room. | High |
| **FR-CALL-003** | Accept Call Handling | Backend server shall handle `call:accept` signaling, update call session status to `CONNECTED`, record `startedAt`, and bridge SDP/ICE exchange. | High |
| **FR-CALL-004** | Reject Call Handling | Backend server shall handle `call:reject` signaling, update call session status to `REJECTED`, record `endedAt`, and set duration to 0. | High |
| **FR-CALL-005** | Busy State Detection | Backend server shall check if doctor is already in an active session, auto-respond with `call:busy`, and log session status as `BUSY`. | High |
| **FR-CALL-006** | End Call Execution | Backend server shall process `call:end` event, update session status to `COMPLETED`, calculate exact duration in seconds, and persist in DB. | High |
| **FR-CALL-007** | Call Timeout Handling | Backend server shall run a 30-second timer on `call:initiate`. If unanswered, auto-terminate call and mark session status as `MISSED`. | High |
| **FR-CALL-008** | Socket Reconnection Window | Backend server shall maintain session state for 30 seconds during transient socket disconnects before declaring call as `FAILED`. | Medium |
| **FR-CALL-009** | Session Duration Tracking | Backend server shall compute duration `endedAt - startedAt` in integer seconds for all `COMPLETED` call records. | High |

---

### 1.2 Authentication & Security Module (`FR-AUTH`)

| Requirement ID | Title | Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-AUTH-001** | JWT Auth Middleware | Express REST middleware and Socket.IO handshake middleware shall verify signed JWT tokens. | High |
| **FR-AUTH-002** | Role-Based Access Control | Express route middleware shall enforce access control according to roles (`PATIENT`, `DOCTOR`, `ADMIN`). | High |
| **FR-AUTH-003** | Appointment Access Gate | Server shall verify that caller is the assigned patient or doctor for the requested `appointmentId` before creating a room. | High |
| **FR-AUTH-004** | Socket Authentication | Socket connections without a valid JWT token in auth header or handshake payload shall be rejected immediately. | High |
| **FR-AUTH-005** | Call Room Isolation | Socket rooms shall be scoped strictly to `call_{appointmentId}`, preventing unauthorized socket join attempts. | High |

---

### 1.3 Database & Session Persistence Module (`FR-DB`)

| Requirement ID | Title | Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-DB-001** | User Table Schema | Persist users (`id`, `name`, `email`, `passwordHash`, `role`, `createdAt`, `updatedAt`). | High |
| **FR-DB-002** | Appointment Schema | Persist appointments (`id`, `patientId`, `doctorId`, `scheduledTime`, `status`, `createdAt`, `updatedAt`). | High |
| **FR-DB-003** | Call Session Schema | Persist call sessions (`id`, `appointmentId`, `patientId`, `doctorId`, `callType`, `status`, `initiatedAt`, `startedAt`, `endedAt`, `duration`, `roomId`). | High |
| **FR-DB-004** | Enums & Constraints | Enforce PostgreSQL enums for `Role`, `AppointmentStatus`, `CallType`, and `CallStatus`. | High |
| **FR-DB-005** | DB Indexing Strategy | Apply compound indexes on (`appointmentId`), (`patientId`), (`doctorId`), and (`status`, `initiatedAt`). | High |

---

### 1.4 Admin Monitoring & Reporting Module (`FR-ADMIN`)

| Requirement ID | Title | Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-ADMIN-001** | Statistics Aggregation API | Backend endpoint `GET /api/admin/calls/stats` shall aggregate total calls, completion/rejection rates, average duration, and type split. | High |
| **FR-ADMIN-002** | Active Calls Stream API | Backend endpoint `GET /api/admin/calls/active` shall query in-memory Socket.IO state and database to list active sessions. | High |
| **FR-ADMIN-003** | Historical Logs API | Backend endpoint `GET /api/admin/calls` shall support paginated, filtered call history queries. | High |
| **FR-ADMIN-004** | Single Call Inspection API | Backend endpoint `GET /api/admin/calls/:id` shall return detailed session timeline and events. | High |

---

## 2. Non-Functional Requirements (Backend SLA)

* **NFR-PERF-001**: API Response Time < 100 ms for 95th percentile.
* **NFR-PERF-002**: Socket.IO Signaling latency < 50 ms.
* **NFR-SEC-001**: bcrypt salt rounds = 10 for password hashing.
* **NFR-SEC-002**: CORS policies strictly limited to allowed origins.
