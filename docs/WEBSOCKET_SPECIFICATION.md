# WebSocket & WebRTC Signaling Specification

## 1. Socket.IO Connection & Authentication Handshake

* **Endpoint**: `ws://localhost:5000/socket.io/`
* **Handshake Protocol**: Socket authentication occurs via JWT passed in `auth` payload during socket connection establishment.

### Handshake Payload (Client -> Server)
```javascript
const socket = io("http://localhost:5000", {
  auth: {
    token: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
});
```

### Authentication Failure
If JWT is invalid or missing, server returns a socket connect error:
```javascript
socket.on("connect_error", (err) => {
  console.error("Socket Auth Error:", err.message); // "Authentication error: Invalid or expired token"
});
```

---

## 2. Room Naming & Joining Protocol

* **Room Format**: `call_{appointmentId}`
* **Automated Joining**: Upon connection, server attaches `socket.userId` and `socket.userRole`.
* User rooms:
  * Individual User Room: `user_{userId}` (for direct incoming call alerts)
  * Call Session Room: `call_{appointmentId}` (joined when call is initiated/accepted)

---

## 3. Call Lifecycle Events Matrix

```
Patient                               Server                              Doctor
   │                                     │                                  │
   ├─────── call:initiate ──────────────►│                                  │
   │        (appointmentId, callType)    ├─────── call:incoming ───────────►│
   │                                     │        (callSessionId, patient)  │
   │◄────── call:ringing ────────────────┤                                  │
   │                                     │◄────── call:accept ──────────────┤
   │                                     │        (callSessionId)           │
   │◄────── call:accepted ───────────────┼─────── call:accepted ───────────►│
   │                                     │                                  │
   │◄════════════════════ WebRTC SDP & ICE Exchange ═══════════════════════►│
   │                                     │                                  │
   ├─────── call:end ───────────────────►│                                  │
   │                                     ├─────── call:ended ──────────────►│
   │◄────── call:ended ──────────────────┤                                  │
```

---

## 4. Socket Event Payloads Detail

### 4.1 `call:initiate` (Client -> Server)
* **Emitted By**: Patient
* **Payload**:
  ```json
  {
    "appointmentId": "apt_8f2a1b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "callType": "VIDEO"
  }
  ```
* **Server Action**: Validates appointment, checks doctor availability, creates `CallSession` in DB (`status = INITIATED`), joins patient to `call_{appointmentId}`, and emits `call:incoming` to `user_{doctorId}`.

---

### 4.2 `call:incoming` (Server -> Client)
* **Received By**: Doctor
* **Payload**:
  ```json
  {
    "callSessionId": "call_12345678-abcd-efgh-ijkl-1234567890ab",
    "appointmentId": "apt_8f2a1b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "callType": "VIDEO",
    "patient": {
      "id": "usr_patient_1",
      "name": "John Doe"
    },
    "roomId": "call_apt_8f2a1b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c"
  }
  ```

---

### 4.3 `call:accept` (Client -> Server)
* **Emitted By**: Doctor
* **Payload**:
  ```json
  {
    "callSessionId": "call_12345678-abcd-efgh-ijkl-1234567890ab"
  }
  ```
* **Server Action**: Updates DB `CallSession` (`status = CONNECTED`, `startedAt = NOW()`), joins doctor to `call_{appointmentId}`, emits `call:accepted` to room.

---

### 4.4 `call:reject` (Client -> Server)
* **Emitted By**: Doctor
* **Payload**:
  ```json
  {
    "callSessionId": "call_12345678-abcd-efgh-ijkl-1234567890ab",
    "reason": "Currently with another patient"
  }
  ```
* **Server Action**: Updates DB `CallSession` (`status = REJECTED`, `endedAt = NOW()`, `duration = 0`), notifies patient via `call:rejected`.

---

### 4.5 `call:busy` (Server -> Client)
* **Emitted By**: Server
* **Payload**:
  ```json
  {
    "callSessionId": "call_12345678-abcd-efgh-ijkl-1234567890ab",
    "message": "Doctor is currently engaged in another active call"
  }
  ```

---

### 4.6 `call:end` (Client -> Server)
* **Emitted By**: Patient or Doctor
* **Payload**:
  ```json
  {
    "callSessionId": "call_12345678-abcd-efgh-ijkl-1234567890ab"
  }
  ```
* **Server Action**: Updates DB `CallSession` (`status = COMPLETED`, `endedAt = NOW()`, calculates duration `endedAt - startedAt`), emits `call:ended` to room, forces room cleanup.

---

## 5. WebRTC Signaling Relay Events

### 5.1 `webrtc:offer`
* **Direction**: Bi-directional relay through server room
* **Payload**:
  ```json
  {
    "callSessionId": "call_12345678-abcd-efgh-ijkl-1234567890ab",
    "sdp": {
      "type": "offer",
      "sdp": "v=0\r\no=- 42398423 2 IN IP4 127.0.0.1...\r\n..."
    }
  }
  ```

### 5.2 `webrtc:answer`
* **Direction**: Bi-directional relay through server room
* **Payload**:
  ```json
  {
    "callSessionId": "call_12345678-abcd-efgh-ijkl-1234567890ab",
    "sdp": {
      "type": "answer",
      "sdp": "v=0\r\no=- 87234982 2 IN IP4 127.0.0.1...\r\n..."
    }
  }
  ```

### 5.3 `webrtc:ice-candidate`
* **Direction**: Bi-directional relay through server room
* **Payload**:
  ```json
  {
    "callSessionId": "call_12345678-abcd-efgh-ijkl-1234567890ab",
    "candidate": {
      "candidate": "candidate:842163049 1 udp 1686052607 192.168.1.15 54321 typ host...",
      "sdpMid": "0",
      "sdpMLineIndex": 0
    }
  }
  ```

---

## 6. Timeout & Reconnection Protocol

1. **Ringing Timeout (30s)**: If doctor does not accept/reject within 30,000 ms, server fires `call:timeout`, updates DB status to `MISSED`, and disconnects room.
2. **Socket Disconnect Grace Window (30s)**: If a client socket disconnects during an active call (`status = CONNECTED`), server marks session as `RECONNECTING`. If client re-authenticates within 30 seconds, state is restored. Otherwise, server sets status to `FAILED` and closes call.
