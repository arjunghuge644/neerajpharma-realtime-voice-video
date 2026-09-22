# Test Plan & Quality Assurance Specification

## 1. Testing Strategy Overview

The testing framework covers unit tests for backend business logic, integration tests for REST API endpoints, real-time WebSocket protocol tests, and an automated Postman test suite required for submission.

---

## 2. Postman Test Collection Specification (Mandatory Assignment Requirement)

The assignment explicitly requires comprehensive Postman test coverage across five critical categories:

### 2.1 Category 1: Successful Requests (200 / 201)
* `TC-POSTMAN-001`: `POST /api/auth/register` with valid patient payload returns 201 Created and valid JWT token.
* `TC-POSTMAN-002`: `POST /api/auth/login` with correct doctor credentials returns 200 OK and JWT.
* `TC-POSTMAN-003`: `POST /api/appointments` with valid doctor ID returns 201 Created.
* `TC-POSTMAN-004`: `POST /api/calls/initiate` returns 201 Created and call session object.
* `TC-POSTMAN-005`: `GET /api/admin/calls/stats` returns 200 OK with accurate aggregate numbers.

---

### 2.2 Category 2: Invalid Input & Validation Failures (400)
* `TC-POSTMAN-006`: `POST /api/auth/register` with invalid email format returns 400 Bad Request.
* `TC-POSTMAN-007`: `POST /api/calls/initiate` missing `appointmentId` returns 400 Bad Request.
* `TC-POSTMAN-008`: `POST /api/auth/register` with weak password (< 8 chars) returns 400 Bad Request.

---

### 2.3 Category 3: Authentication Failures (401)
* `TC-POSTMAN-009`: `GET /api/appointments` without `Authorization` header returns 401 Unauthorized.
* `TC-POSTMAN-010`: `GET /api/auth/me` with expired or tampered JWT token returns 401 Unauthorized.
* `TC-POSTMAN-011`: `POST /api/auth/login` with wrong password returns 401 Unauthorized.

---

### 2.4 Category 4: Unauthorized Access & Role Gating (403)
* `TC-POSTMAN-012`: Patient attempting to access `GET /api/admin/calls` returns 403 Forbidden.
* `TC-POSTMAN-013`: Patient attempting to initiate a call for an appointment assigned to another patient returns 403 Forbidden.
* `TC-POSTMAN-014`: Doctor attempting to trigger patient-only call initiation returns 403 Forbidden.

---

### 2.5 Category 5: Invalid IDs & Resource Not Found (404)
* `TC-POSTMAN-015`: `GET /api/appointments/apt_non_existent_id` returns 404 Not Found.
* `TC-POSTMAN-016`: `GET /api/admin/calls/call_invalid_uuid` returns 404 Not Found.

---

## 3. Real-Time Signaling & WebRTC Test Cases

| Test Case ID | Feature | Test Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-CALL-001** | Voice Call Initiation | Patient initiates voice call. | Server emits `call:incoming` with `callType: VOICE` to Doctor socket. |
| **TC-CALL-002** | Video Call Acceptance | Doctor accepts incoming video call. | Server emits `call:accepted`, updates DB session status to `CONNECTED`. |
| **TC-CALL-003** | Call Rejection | Doctor clicks Reject. | Server emits `call:rejected`, sets DB status `REJECTED`, duration = 0. |
| **TC-CALL-004** | Busy State Handling | Patient B calls Doctor while Doctor is in call with Patient A. | Server immediately returns `call:busy` to Patient B. |
| **TC-CALL-005** | Call Duration Calculation | Call connected for 120 seconds, then ended. | DB record has `startedAt`, `endedAt`, and `duration = 120`. |
| **TC-CALL-006** | Ringing Timeout (30s) | Doctor ignores call for 30s. | Server emits `call:timeout`, sets status to `MISSED`. |
| **TC-CALL-007** | Socket Reconnection | Disconnect network during call for 10s. | Socket reconnects, session resumes without dropping. |

---

## 4. Test Execution Matrix Summary

* **Unit Tests**: Vitest / Jest execution (`npm run test:unit`)
* **Integration & API Tests**: Supertest + Postman CLI Newman (`npm run test:api`)
* **End-to-End Signaling**: Simulated Socket.IO client harness (`npm run test:sockets`)
