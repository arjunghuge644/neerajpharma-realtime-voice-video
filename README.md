# NeerajPharma Real-Time Voice & Video Calling Platform

> **Disclaimer**: This repository implements the Real-Time Voice & Video Calling module independently based on the provided technical requirements. It serves as a complete standalone reference implementation and prototype for secure telemedicine consultations.

---

## 📌 Project Overview

**NeerajPharma Real-Time Voice & Video Calling Platform** is a secure, enterprise-grade WebRTC-based telemedicine module designed for real-time audio and video consultations between patients and doctors. The platform features robust appointment validation, Socket.IO signaling, STUN/TURN NAT traversal, PostgreSQL call session logging, and an Admin Monitoring Dashboard.

---

## 🚀 Key Features

* **Real-Time Consultations**: One-on-one peer-to-peer audio and video calls powered by WebRTC.
* **Socket.IO Signaling Protocol**: Instant call initiation, ringing, acceptance, rejection, busy states, and WebRTC SDP/ICE exchange.
* **Gated Security & Access Control**: JWT authentication, Role-Based Access Control (RBAC), and appointment-gated room authorization.
* **NAT Traversal**: STUN and coturn (TURN) integration for seamless peer connection across restrictive NATs and firewalls.
* **Call Lifecycle & Durations**: Complete session state tracking (`INITIATED`, `RINGING`, `CONNECTED`, `COMPLETED`, `REJECTED`, `MISSED`, `BUSY`, `FAILED`) and accurate duration calculations.
* **Admin Dashboard**: Real-time call monitoring, total volume metrics, completion/rejection rates, and searchable call logs.
* **Postman & Git Deliverables**: Fully documented REST API endpoints covered by Postman test suites and targeted for the `feature/realtime-voice-video` GitHub branch.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React (Vite), HTML5 WebRTC API, Socket.IO Client |
| **Backend** | Node.js, Express.js, Socket.IO Server |
| **Database** | PostgreSQL |
| **ORM** | Prisma ORM |
| **Auth & Security** | JWT (JSON Web Tokens), bcrypt |
| **Media & Signaling** | WebRTC (RTCPeerConnection), Socket.IO |
| **NAT Traversal** | coturn (STUN/TURN) |
| **Testing** | Postman, Vitest / Jest |

---

## 📚 Project Documentation (`docs/`)

The repository architecture and design are comprehensively specified in the following documents:

1. 📄 [PRD — Product Requirements Document](file:///home/arjun/neerajpharma-realtime-voice-video/docs/PRD.md): Vision, target users, core user journeys, and product goals.
2. 📄 [TRD — Technical Requirements Document](file:///home/arjun/neerajpharma-realtime-voice-video/docs/TRD.md): Tech stack specification, directory layout, performance targets.
3. 📄 [SRS — Software Requirements Specification](file:///home/arjun/neerajpharma-realtime-voice-video/docs/SRS.md): Precise functional requirement IDs (`FR-CALL-*`, `FR-AUTH-*`, `FR-DB-*`, `FR-ADMIN-*`) and non-functional requirements (`NFR-*`).
4. 📄 [API Specification](file:///home/arjun/neerajpharma-realtime-voice-video/docs/API_SPECIFICATION.md): Detailed REST endpoints, request/response formats, validation, and status codes.
5. 📄 [Database Design](file:///home/arjun/neerajpharma-realtime-voice-video/docs/DATABASE_DESIGN.md): PostgreSQL entity schemas, Prisma models, indexes, and ER diagrams.
6. 📄 [WebSocket Specification](file:///home/arjun/neerajpharma-realtime-voice-video/docs/WEBSOCKET_SPECIFICATION.md): Socket.IO events, payload schemas, and WebRTC signaling protocols.
7. 📄 [Security Design](file:///home/arjun/neerajpharma-realtime-voice-video/docs/SECURITY_DESIGN.md): Authentication workflow, room isolation, authorization middleware, secret safety.
8. 📄 [Test Plan](file:///home/arjun/neerajpharma-realtime-voice-video/docs/TEST_PLAN.md): Test strategy, coverage matrix, edge-case testing, and Postman test requirements.
9. 📄 [Implementation Plan](file:///home/arjun/neerajpharma-realtime-voice-video/docs/IMPLEMENTATION_PLAN.md): 18-Phase step-by-step roadmap from setup to final demo.
10. 📄 [Architecture](file:///home/arjun/neerajpharma-realtime-voice-video/docs/ARCHITECTURE.md): Architectural topology, signaling sequence flows, network diagrams.
11. 📄 [Requirement Traceability Matrix](file:///home/arjun/neerajpharma-realtime-voice-video/docs/REQUIREMENT_TRACEABILITY.md): Full end-to-end matrix mapping requirements to design, code, and tests.

---

## 🏃 Quick Start Guide

### Prerequisites
* Node.js (v18.x or higher)
* PostgreSQL (v14.x or higher)
* npm or pnpm

### Environment Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/arjunghuge644/neerajpharma-realtime-voice-video.git
   cd neerajpharma-realtime-voice-video
   ```
2. Copy environment file:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your local PostgreSQL credentials and JWT secret.

---

## 📐 Project Directory Layout

```
neerajpharma-realtime-voice-video/
├── docs/                        # Complete technical documentation suite
│   ├── PRD.md
│   ├── TRD.md
│   ├── SRS.md
│   ├── API_SPECIFICATION.md
│   ├── DATABASE_DESIGN.md
│   ├── WEBSOCKET_SPECIFICATION.md
│   ├── SECURITY_DESIGN.md
│   ├── TEST_PLAN.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── ARCHITECTURE.md
│   └── REQUIREMENT_TRACEABILITY.md
├── .env.example                 # Environment variable template
├── .gitignore                    # Git ignore file
└── README.md                    # Project documentation index
```
