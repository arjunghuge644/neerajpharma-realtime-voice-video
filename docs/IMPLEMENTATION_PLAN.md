# Implementation Roadmap & Development Plan

This document outlines the sequential, phase-by-phase development checklist for building the NeerajPharma Real-Time Voice & Video Calling module.

---

## 🚩 Phase Overview & Status Checklist

### Phase 0: Requirements & Technical Documentation
- [x] Create Product Requirements Document (`PRD.md`)
- [x] Create Technical Requirements Document (`TRD.md`)
- [x] Create Software Requirements Specification (`SRS.md`)
- [x] Create REST API Specification (`API_SPECIFICATION.md`)
- [x] Create Database Design & Prisma Model (`DATABASE_DESIGN.md`)
- [x] Create WebSocket & WebRTC Specification (`WEBSOCKET_SPECIFICATION.md`)
- [x] Create Security & Access Control Design (`SECURITY_DESIGN.md`)
- [x] Create Test Plan & Postman Collection Plan (`TEST_PLAN.md`)
- [x] Create Implementation Roadmap (`IMPLEMENTATION_PLAN.md`)
- [x] Create System Architecture (`ARCHITECTURE.md`)
- [x] Create Requirement Traceability Matrix (`REQUIREMENT_TRACEABILITY.md`)
- [x] Freeze Requirements and repository baseline (`README.md`, `.gitignore`, `.env.example`)

---

### Phase 1: Project & Server Core Setup
- [x] Initialize Express server in `backend/server.js`
- [x] Configure environment variables handler (`src/config/env.js`)
- [x] Implement central error handling middleware (`src/middleware/errorHandler.js`)
- [x] Set up CORS policies, JSON parsing, and HTTP logging (`morgan`)
- [x] Implement health check endpoint (`GET /api/health`)

### Phase 2: Database & Prisma ORM Setup
- [x] Configure database connection string in `.env`
- [x] Write Prisma Schema (`schema.prisma`) for `User`, `Appointment`, `CallSession`
- [x] Run database schema sync (`npx prisma db push`) & client generation
- [x] Seed database with initial Patient, Doctor, and Admin test accounts (`prisma/seed.js`)

### Phase 3: Authentication & Security Core
- [x] Implement bcrypt password hashing utilities
- [x] Create JWT issuing and token verification utilities (`src/utils/jwt.js`)
- [x] Implement authentication middleware (`authenticate`) & RBAC (`authorizeRole`)
- [x] Build `POST /api/auth/register` controller & route
- [x] Build `POST /api/auth/login` controller & route
- [x] Build `GET /api/auth/me` protected route
- [x] Create automated Auth test suite (`tests/authCheck.js`)


### Phase 4: Appointments Management Module
- [x] Build `POST /api/appointments` endpoint
- [x] Build `GET /api/appointments` endpoint with user scoping
- [x] Build `GET /api/appointments/:id` endpoint with RBAC
- [x] Add appointment time and participant validation service (`validateAppointmentForCall`)
- [x] Create automated Appointments test suite (`tests/appointmentCheck.js`)

### Phase 5: Call REST APIs & Session Tracking
- [x] Build `POST /api/calls` REST endpoint for initiating voice/video sessions
- [x] Build `POST /api/calls/:id/end` REST endpoint for ending active call sessions
- [x] Build `GET /api/calls/history` and `GET /api/calls` user-scoped history endpoints
- [x] Build `GET /api/calls/:id` single call detail inspection endpoint
- [x] Create automated Call REST API test suite (`tests/callCheck.js`)

### Phase 6: Socket.IO Server Setup & Auth
- [x] Initialize Socket.IO server wrapped over HTTP server (`server.js` & `src/sockets/index.js`)
- [x] Implement Socket JWT handshake authentication middleware (`src/sockets/authMiddleware.js`)
- [x] Configure socket room joining (`user_{userId}`, `call_{appointmentId}`) (`src/sockets/roomManager.js`)
- [x] Create automated Socket.IO integration test suite (`tests/socketCheck.js`)

### Phase 7: WebRTC Signaling Engine & Call Lifecycle State Machine
- [x] Implement `call:initiate`, `call:incoming`, `call:ringing` signaling triggers (`src/sockets/callLifecycleHandler.js`)
- [x] Implement `call:accept`, `call:accepted` acceptance logic (`src/sockets/callLifecycleHandler.js`)
- [x] Implement `call:reject`, `call:rejected` decline handling (`src/sockets/callLifecycleHandler.js`)
- [x] Implement `call:end`, `call:ended` call termination and DB status updating (`src/sockets/callLifecycleHandler.js`)
- [x] Implement 30-second ringing timeout trigger (`MISSED`) (`src/sockets/callLifecycleHandler.js`)
- [x] Implement `webrtc:offer` socket event relay (`src/sockets/signalingHandler.js`)
- [x] Implement `webrtc:answer` socket event relay (`src/sockets/signalingHandler.js`)
- [x] Implement `webrtc:ice-candidate` socket event relay (`src/sockets/signalingHandler.js`)
- [x] Create automated WebRTC Signaling & Call Lifecycle test suite (`tests/signalingCheck.js`)

### Phase 8: Real-Time Voice Calling Module (Backend Engine)
- [x] Implement `VOICE` call type support (`audio: true`, `video: false` signal metadata) (`src/services/callService.js`)
- [x] Verify voice-only session initiation in REST API & Socket signaling (`tests/callCheck.js`)

### Phase 9: Real-Time Video Calling Module (Backend Engine)
- [x] Implement `VIDEO` call type support (`audio: true`, `video: true` signal metadata) (`src/services/callService.js`)
- [x] Verify video session initiation and WebRTC SDP/ICE relay (`tests/signalingCheck.js`)

### Phase 10: STUN / TURN & Coturn Integration
- [x] Configure public STUN fallback server (`config.stunServer`)
- [x] Implement STUN/TURN ICE servers generator service (`getIceServersConfig()`) returned during call setup
- [x] Document coturn TURN server deployment & credential generation (`SECURITY_DESIGN.md` & `TRD.md`)

### Phase 11: Call Lifecycle State Machine
- [x] Implement `call:initiate`, `call:ringing`, `call:accept`, `call:reject` state triggers (`src/sockets/callLifecycleHandler.js`)
- [x] Implement Busy state detection for active calls (`BUSY_STATE` block) (`src/services/callService.js`)
- [x] Implement 30-second ringing timeout trigger (`MISSED`) (`src/sockets/callLifecycleHandler.js`)
- [x] Implement 30-second socket reconnection window

### Phase 12: Call History & Persistence Verification
- [x] Implement exact `duration` calculation (`endTime - startTime` in seconds) (`src/services/callService.js`)
- [x] Verify automatic DB status updating across all exit paths (`COMPLETED`, `REJECTED`, `MISSED`, `BUSY`, `FAILED`)


### Phase 13: Admin REST APIs
- [ ] Build `GET /api/admin/calls/stats` aggregation endpoint
- [ ] Build `GET /api/admin/calls/active` real-time list endpoint
- [ ] Build `GET /api/admin/calls` paginated historical logs endpoint
- [ ] Enforce strict `ADMIN` role middleware protection

### Phase 14: Frontend Admin Monitoring Dashboard
- [ ] Build Admin Dashboard UI view in React
- [ ] Connect stats cards, active call widgets, and searchable call logs table

### Phase 15: Automated Testing & Postman Collection
- [ ] Create Postman Collection covering 200/201 Success, 400 Validation, 401 Auth, 403 Forbidden, 404 Not Found
- [ ] Execute automated collection run via Postman / Newman
- [ ] Write integration test cases for signaling events

### Phase 16: System Documentation Polish
- [ ] Review documentation suite for 100% alignment with code
- [ ] Ensure all file links and markdown references are valid

### Phase 17: Final Demo & Code Cleanup
- [ ] Conduct end-to-end patient to doctor consultation demo
- [ ] Verify admin live dashboard monitoring
- [ ] Prepare final submission package
