# Technical Requirements Document (TRD)

## 1. System Technology Stack

| Layer | Component / Technology | Version Requirement | Selection Rationale |
| :--- | :--- | :--- | :--- |
| **Target Branch** | Git Branch | `feature/realtime-voice-video` | Internship delivery specification branch |
| **Frontend Framework** | React + Vite | React 18.x / Vite 5.x | High-performance SPA development, fast HMR, component isolation. |
| **Frontend Styling** | Vanilla CSS / CSS Modules | Standard CSS3 | Custom design system without heavy framework bloat. |
| **Backend Runtime** | Node.js | v18.x LTS or higher | Event-driven, asynchronous non-blocking I/O optimized for real-time signaling. |
| **HTTP Framework** | Express.js | v4.19.x | Industry standard routing and REST API framework. |
| **Realtime Engine** | Socket.IO | v4.7.x | Robust WebSocket abstraction with fallback polling, auto-reconnection, and room management. |
| **Media Standard** | WebRTC Native APIs | Standard W3C Specification | P2P audio/video streaming via `RTCPeerConnection` with Opus audio and VP8/H.264 video. |
| **NAT Traversal** | Coturn / STUN / TURN | coturn 4.6.x / Public STUN | Essential for relaying media across symmetric NATs, firewalls, and carrier networks. |
| **Database** | PostgreSQL | v14.x or higher | ACIDs-compliant relational database for structured storage of users, appointments, and call logs. |
| **ORM** | Prisma ORM | v5.x | Type-safe query builder, automated migration management, clean schema definitions. |
| **Auth & Encryption** | JWT + bcrypt | `jsonwebtoken` 9.x, `bcryptjs` 2.x | Stateless JWT authentication and 10-round salted password hashing. |
| **API Testing** | Postman | v10.x | Automated API verification and schema compliance testing. |

---

## 2. Technical Architecture & Directory Structure

The project follows a clean, modular Node.js/Express backend coupled with a React client SPA.

```
neerajpharma-realtime-voice-video/
├── client/                      # React + Vite Frontend SPA
│   ├── src/
│   │   ├── assets/              # Static media assets & icons
│   │   ├── components/          # Reusable UI components (VideoGrid, CallControls, AdminCard)
│   │   ├── context/             # React contexts (AuthContext, SocketContext, WebRTCContext)
│   │   ├── pages/               # Page views (Login, PatientDashboard, DoctorDashboard, AdminDashboard, CallRoom)
│   │   ├── services/            # API client (Axios/Fetch) & WebRTC signaling manager
│   │   ├── styles/              # Design tokens and modular CSS
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
│
├── server/                      # Node.js + Express Backend
│   ├── src/
│   │   ├── config/              # Environment vars, Prisma client, Socket.IO setup
│   │   ├── controllers/         # REST API Controllers (auth, appointments, calls, admin)
│   │   ├── middlewares/         # Auth JWT middleware, RBAC middleware, error handler
│   │   ├── routes/              # Express API routers
│   │   ├── sockets/             # Socket.IO handlers (connection, signaling, call lifecycle)
│   │   ├── services/            # Business logic (call state machine, duration tracking)
│   │   └── index.js             # HTTP server entry point
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema definitions
│   │   └── migrations/          # SQL migration scripts
│   └── package.json
│
├── docs/                        # Specifications & Traceability
├── .env.example
├── .gitignore
└── README.md
```

---

## 3. Network & NAT Traversal Requirements (STUN/TURN)

To ensure high connection success rates (>98%) across diverse network configurations:

1. **STUN Configuration**:
   * Default public STUN: `stun:stun.l.google.com:19302`
   * Solves peer IP discovery behind Full Cone, Restricted Cone, and Port-Restricted Cone NATs.

2. **coturn (TURN) Configuration**:
   * Installed on dedicated server or cloud instance (`turn:coturn.neerajpharma.com:3478`).
   * Configured with dynamic time-limited credentials or static user auth.
   * Required when both participants are behind Symmetric NATs or enterprise firewalls blocking UDP.

---

## 4. Performance & Scalability Targets

| Metric | Target Standard | SLA Threshold |
| :--- | :--- | :--- |
| **REST API Latency** | < 100 ms (p95) | < 250 ms |
| **Signaling Event Delay** | < 50 ms (p95) | < 150 ms |
| **WebRTC Connection Time** | < 1.5 seconds | < 3.0 seconds |
| **Media Audio Latency** | < 200 ms end-to-end | < 400 ms |
| **Video Stream Quality** | 720p @ 30 fps (dynamic adaptive bitrate) | 360p @ 15 fps minimum fallback |
| **Concurrent Active Calls** | Support up to 100 simultaneous calls per Node process | Scalable horizontally via Socket.IO Redis Adapter |

---

## 5. Browser Compatibility Matrix

* **Google Chrome**: v90+ (Full WebRTC & Socket.IO support)
* **Mozilla Firefox**: v88+ (Full WebRTC & Socket.IO support)
* **Microsoft Edge**: v90+ (Full WebRTC & Socket.IO support)
* **Apple Safari**: v14.1+ (Full WebRTC & Socket.IO support)
