# Requirement Traceability Matrix (RTM)

The Requirement Traceability Matrix ensures 100% coverage and auditability across all Software Requirement Specification (SRS) items, technical design documents, backend implementation modules, and test suite cases.

---

## 1. Traceability Matrix Table

| Requirement ID | SRS Requirement Description | Design Document | Code Module / Target | Test Case ID | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **FR-CALL-001** | Initiate Voice Call | `WEBSOCKET_SPECIFICATION.md` | `backend/src/sockets/callLifecycleHandler.js` | `TC-CALL-001` | ✅ |
| **FR-CALL-002** | Initiate Video Call | `WEBSOCKET_SPECIFICATION.md` | `backend/src/sockets/callLifecycleHandler.js` | `TC-CALL-002` | ✅ |
| **FR-CALL-003** | Accept Incoming Call | `WEBSOCKET_SPECIFICATION.md` | `backend/src/sockets/callLifecycleHandler.js` | `TC-CALL-002` | ✅ |
| **FR-CALL-004** | Reject Incoming Call | `WEBSOCKET_SPECIFICATION.md` | `backend/src/sockets/callLifecycleHandler.js` | `TC-CALL-003` | ✅ |
| **FR-CALL-005** | Busy State Detection | `WEBSOCKET_SPECIFICATION.md` | `backend/src/services/callService.js` | `TC-CALL-004` | ✅ |
| **FR-CALL-006** | End Call Execution | `WEBSOCKET_SPECIFICATION.md` | `backend/src/sockets/callLifecycleHandler.js` | `TC-CALL-005` | ✅ |
| **FR-CALL-007** | Call Timeout (30s) | `WEBSOCKET_SPECIFICATION.md` | `backend/src/sockets/callLifecycleHandler.js` | `TC-CALL-006` | ✅ |

| **FR-CALL-008** | Socket Reconnection | `WEBSOCKET_SPECIFICATION.md` | `server/src/sockets/connectionHandler.js` | `TC-CALL-007` | ⬜ |
| **FR-CALL-009** | Session Duration Calc | `DATABASE_DESIGN.md` | `server/src/services/callService.js` | `TC-CALL-005` | ⬜ |
| **FR-AUTH-001** | JWT Authentication | `SECURITY_DESIGN.md` | `backend/src/middleware/authMiddleware.js` | `TC-POSTMAN-009` | ✅ |
| **FR-AUTH-002** | Role-Based Auth (RBAC)| `SECURITY_DESIGN.md` | `backend/src/middleware/authMiddleware.js` | `TC-POSTMAN-012` | ✅ |
| **FR-AUTH-003** | Appointment Gate | `SECURITY_DESIGN.md` | `backend/src/services/appointmentService.js` | `TC-POSTMAN-013` | ✅ |
| **FR-AUTH-004** | Socket Handshake Auth | `SECURITY_DESIGN.md` | `backend/src/sockets/authMiddleware.js` | `TC-POSTMAN-010` | ✅ |
| **FR-AUTH-005** | Protected Call Rooms | `SECURITY_DESIGN.md` | `backend/src/sockets/roomManager.js` | `TC-POSTMAN-013` | ✅ |
| **FR-DB-001** | Store Patient Account | `DATABASE_DESIGN.md` | `backend/prisma/schema.prisma` | `TC-POSTMAN-001` | ✅ |
| **FR-DB-002** | Store Doctor Account | `DATABASE_DESIGN.md` | `backend/prisma/schema.prisma` | `TC-POSTMAN-002` | ✅ |
| **FR-DB-003** | Store Appointment Data| `DATABASE_DESIGN.md` | `backend/prisma/schema.prisma` | `TC-POSTMAN-003` | ✅ |
| **FR-DB-004** | Store Call Type | `DATABASE_DESIGN.md` | `backend/prisma/schema.prisma` | `TC-POSTMAN-004` | ✅ |
| **FR-DB-005** | Store Call Status | `DATABASE_DESIGN.md` | `backend/prisma/schema.prisma` | `TC-POSTMAN-004` | ✅ |
| **FR-DB-006** | Store Timestamps | `DATABASE_DESIGN.md` | `backend/prisma/schema.prisma` | `TC-POSTMAN-004` | ✅ |
| **FR-DB-007** | Store Session Duration| `DATABASE_DESIGN.md` | `backend/prisma/schema.prisma` | `TC-POSTMAN-005` | ⬜ |
| **FR-DB-008** | Store Session Room ID | `DATABASE_DESIGN.md` | `backend/prisma/schema.prisma` | `TC-POSTMAN-004` | ✅ |
| **FR-DB-009** | Audit Timestamps | `DATABASE_DESIGN.md` | `backend/prisma/schema.prisma` | `TC-POSTMAN-001` | ✅ |

| **FR-ADMIN-001**| Aggregate Statistics | `API_SPECIFICATION.md` | `server/src/controllers/adminController.js` | `TC-POSTMAN-005` | ⬜ |
| **FR-ADMIN-002**| Active Call Monitor | `API_SPECIFICATION.md` | `server/src/controllers/adminController.js` | `TC-POSTMAN-005` | ⬜ |
| **FR-ADMIN-003**| Historical Call Logs | `API_SPECIFICATION.md` | `server/src/controllers/adminController.js` | `TC-POSTMAN-005` | ⬜ |
| **FR-ADMIN-004**| Call Detail View | `API_SPECIFICATION.md` | `server/src/controllers/adminController.js` | `TC-POSTMAN-016` | ⬜ |
| **FR-ADMIN-005**| Admin Security Isolation| `SECURITY_DESIGN.md` | `server/src/middlewares/rbacMiddleware.js` | `TC-POSTMAN-012` | ⬜ |

*Status Key: ⬜ Pending Implementation | 🟡 In Development | ✅ Verified & Complete*

---

## 2. Requirement Verification Sign-Off Summary

This Requirement Traceability Matrix guarantees that upon development completion, every functional requirement maps directly to a specific REST controller or Socket.IO signaling handler and is verified by an automated test case in our Postman collection.
