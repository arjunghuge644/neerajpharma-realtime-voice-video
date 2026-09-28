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
- [ ] Initialize Socket.IO server wrapped over HTTP server
- [ ] Implement Socket JWT handshake authentication middleware
- [ ] Configure socket room joining (`user_{userId}`, `call_{appointmentId}`)

### Phase 7: WebRTC Signaling Engine
- [ ] Implement `webrtc:offer` socket event relay
- [ ] Implement `webrtc:answer` socket event relay
- [ ] Implement `webrtc:ice-candidate` socket event relay

### Phase 8: Real-Time Voice Calling Module
- [ ] Implement Voice-only audio constraint handling (`audio: true`, `video: false`)
- [ ] Connect Opus codec audio streaming over WebRTC P2P connection

### Phase 9: Real-Time Video Calling Module
- [ ] Implement Video constraint handling (`audio: true`, `video: true`)
- [ ] Connect VP8/H.264 video streaming grid UI

### Phase 10: STUN / TURN & Coturn Server Integration
- [ ] Configure public STUN fallback server
- [ ] Add TURN credential generator service (`turn:coturn.neerajpharma.com`)
- [ ] Test peer connection across restrictive NAT firewalls

### Phase 11: Call Lifecycle State Machine
- [ ] Implement `call:initiate`, `call:ringing`, `call:accept`, `call:reject` state triggers
- [ ] Implement Busy state detection for doctors in active calls
- [ ] Implement 30-second ringing timeout trigger (`MISSED`)
- [ ] Implement 30-second socket reconnection window

### Phase 12: Call History & Persistence Verification
- [ ] Implement exact `duration` calculation (`endedAt - startedAt`)
- [ ] Verify automatic DB status updating across all exit paths (`COMPLETED`, `REJECTED`, `MISSED`, `BUSY`, `FAILED`)

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
