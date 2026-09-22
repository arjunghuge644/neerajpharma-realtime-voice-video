# Architecture & System Design Document

## 1. System Architecture Diagram

The NeerajPharma platform employs a decoupled client-server architecture consisting of a React Vite SPA, a Node.js Express backend with Socket.IO, a coturn TURN/STUN server for NAT traversal, and a PostgreSQL database.

```mermaid
graph TD
    subgraph Client Layer
        P[Patient Browser - WebRTC Client]
        D[Doctor Browser - WebRTC Client]
        A[Admin Dashboard - React SPA]
    end

    subgraph Transport & API Gateway
        N[Node.js Express + Socket.IO Server]
        Auth[JWT & RBAC Middleware]
    end

    subgraph Infrastructure & Persistence
        DB[(PostgreSQL Database)]
        Prisma[Prisma ORM Layer]
        Coturn[coturn STUN/TURN Server]
    end

    %% HTTP REST Requests
    P -- REST / HTTPS --> Auth
    D -- REST / HTTPS --> Auth
    A -- REST / HTTPS --> Auth
    Auth --> N

    %% WebSocket Signaling
    P <== Socket.IO / WSS ==> N
    D <== Socket.IO / WSS ==> N

    %% Direct Peer-to-Peer Media Streams
    P <== WebRTC P2P (Opus/VP8) ==> D
    P -. NAT Traversal / Relay .-> Coturn
    D -. NAT Traversal / Relay .-> Coturn

    %% Database Operations
    N --> Prisma
    Prisma --> DB
```

---

## 2. WebRTC Peer Connection & Signaling Sequence Flow

The following sequence diagram details the exact signaling flow over Socket.IO required to establish a peer-to-peer WebRTC audio/video connection between Patient and Doctor.

```mermaid
sequenceDiagram
    autonumber
    participant Patient as Patient (Caller)
    participant Server as Node.js + Socket.IO Server
    participant DB as PostgreSQL DB
    participant Doctor as Doctor (Callee)

    Patient->>Server: POST /api/calls/initiate (appointmentId, callType)
    Server->>DB: Validate Appointment & Create CallSession (status: INITIATED)
    DB-->>Server: CallSession Created
    Server-->>Patient: 201 Created (callSessionId, roomId, iceServers)

    Server->>Doctor: Socket Event: call:incoming (callSessionId, patientInfo, callType)
    Server->>Patient: Socket Event: call:ringing

    alt Doctor Accepts Call
        Doctor->>Server: Socket Event: call:accept (callSessionId)
        Server->>DB: Update CallSession (status: CONNECTED, startedAt: NOW)
        Server->>Patient: Socket Event: call:accepted
        Server->>Doctor: Socket Event: call:accepted

        Note over Patient,Doctor: WebRTC P2P Negotiation Begins
        Patient->>Server: Socket Event: webrtc:offer (sdp)
        Server->>Doctor: Socket Event: webrtc:offer (sdp)
        Doctor->>Server: Socket Event: webrtc:answer (sdp)
        Server->>Patient: Socket Event: webrtc:answer (sdp)

        par ICE Candidate Exchange
            Patient->>Server: Socket Event: webrtc:ice-candidate
            Server->>Doctor: Socket Event: webrtc:ice-candidate
            Doctor->>Server: Socket Event: webrtc:ice-candidate
            Server->>Patient: Socket Event: webrtc:ice-candidate
        end

        Note over Patient,Doctor: Direct WebRTC Media Stream Established

    else Doctor Rejects Call
        Doctor->>Server: Socket Event: call:reject (callSessionId)
        Server->>DB: Update CallSession (status: REJECTED, endedAt: NOW, duration: 0)
        Server->>Patient: Socket Event: call:rejected
    
    else Doctor Busy
        Server->>Server: Detect Doctor Active Call Session
        Server->>Patient: Socket Event: call:busy
        Server->>DB: Update CallSession (status: BUSY)

    else Ringing Timeout (30 seconds)
        Note over Server: 30s Timer Expires
        Server->>DB: Update CallSession (status: MISSED)
        Server->>Patient: Socket Event: call:timeout
        Server->>Doctor: Socket Event: call:timeout
    end
```

---

## 3. Call Session State Machine

Every call session follows a strict finite state machine (FSM) managed by the backend:

```mermaid
stateDiagram-v2
    [*] --> INITIATED: Patient Initiates Call
    INITIATED --> RINGING: Doctor Socket Notified
    
    RINGING --> CONNECTED: Doctor Accepts
    RINGING --> REJECTED: Doctor Declines
    RINGING --> BUSY: Doctor Already in Call
    RINGING --> MISSED: 30s Timeout Expired
    
    CONNECTED --> COMPLETED: Either Participant Ends Call
    CONNECTED --> FAILED: Socket Disconnected > 30s

    COMPLETED --> [*]
    REJECTED --> [*]
    BUSY --> [*]
    MISSED --> [*]
    FAILED --> [*]
```

---

## 4. Network Topology & TURN Server Traversal

1. **Direct P2P Stream**: When both participants are on open public networks or standard home routers, WebRTC establishes direct UDP communication using STUN for public IP discovery.
2. **Relayed Stream via coturn**: When one or both participants are behind restrictive symmetric NATs or corporate enterprise firewalls, WebRTC falls back to relaying encrypted media packets through the coturn TURN server over port 3478/443.
