# Security Design Document

## 1. Security Architecture Overview

The NeerajPharma platform employs a defense-in-depth security model to protect patient healthcare data, prevent unauthorized room access, and secure WebRTC signaling.

```
       ┌────────────────────────────────────────────────────────┐
       │                HTTP / WebSocket Gateway               │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │               1. JWT Authentication                    │
       │   Verifies token signature, expiration & claims       │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │           2. Role Authorization (RBAC)                 │
       │     Validates PATIENT, DOCTOR, or ADMIN role permissions│
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │           3. Appointment Ownership Gate                │
       │ Ensures user is assigned participant of appointmentId  │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │           4. Protected Room Isolation                  │
       │     Socket.IO room `call_{appointmentId}` locked      │
       └────────────────────────────────────────────────────────┘
```

---

## 2. JWT Lifecycle & Signature Verification

1. **Token Generation**: Upon successful login, server issues a signed JWT containing:
   ```json
   {
     "sub": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
     "email": "patient@neerajpharma.com",
     "role": "PATIENT",
     "iat": 1727025600,
     "exp": 1727112000
   }
   ```
2. **Algorithm**: HMAC-SHA256 (`HS256`) utilizing `JWT_SECRET` from environment configuration.
3. **Expiration & Rotation**: Default token TTL is 24 hours (`24h`). Unauthenticated or expired tokens trigger `401 Unauthorized`.

---

## 3. Password Security & Hashing Standard

* **Library**: `bcryptjs`
* **Salt Rounds**: 10 (provides optimal computation complexity balance preventing brute-force rainbow table attacks).
* **Rule**: Raw passwords are NEVER stored, logged, or exposed in API response objects.

---

## 4. Role-Based Access Control (RBAC) Matrix

| Endpoint / Action | PATIENT | DOCTOR | ADMIN |
| :--- | :---: | :---: | :---: |
| `POST /api/auth/register` | ✅ | ✅ | ✅ |
| `POST /api/auth/login` | ✅ | ✅ | ✅ |
| `GET /api/appointments` | ✅ (Own) | ✅ (Own) | ✅ (All) |
| `POST /api/calls/initiate` | ✅ | ❌ | ❌ |
| `POST /api/calls/:id/end` | ✅ (Participant) | ✅ (Participant) | ❌ |
| `GET /api/admin/*` | ❌ | ❌ | ✅ |
| Socket Join `call_{appointmentId}` | ✅ (Assigned) | ✅ (Assigned) | ❌ |

---

## 5. Socket.IO Security & Room Protection

1. **Handshake Middleware**: Sockets without valid JWT in `socket.handshake.auth.token` or `headers.authorization` are rejected before establishing a WebSocket connection.
2. **Room Validation**: Users attempting to emit or listen to events in `call_{appointmentId}` are cross-referenced against DB `Appointment` records. Unauthorized sockets are immediately disconnected and logged as security violations.

---

## 6. TURN Server Credential Protection

To prevent unauthorized third parties from bandwidth-stealing on the coturn TURN server:
* Ephemeral time-limited TURN credentials are generated using HMAC-SHA1 signature:
  * Username format: `timestamp:userId`
  * Credential: `Base64(HMAC-SHA1(COTURN_SECRET, username))`
  * Expire Time: 24 hours.

---

## 7. Additional Hardening Measures

* **Input Validation**: All REST request bodies sanitized via `zod` / `joi` validation middleware to prevent SQL injection and XSS payloads.
* **CORS Restrictions**: Configured strictly to whitelist allowed frontend origins (`CLIENT_URL`).
* **Rate Limiting**: `express-rate-limit` applied to `/api/auth/login` (max 10 requests per 15 minutes per IP).
