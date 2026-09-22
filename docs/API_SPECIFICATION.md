# REST API Specification

## 1. Overview & General Standards

* **Base URL**: `http://localhost:5000/api`
* **Content-Type**: `application/json`
* **Authentication**: Bearer Token in `Authorization: Bearer <JWT_TOKEN>` header.
* **Response Envelope Format**:
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Optional operational summary"
  }
  ```
* **Error Response Envelope Format**:
  ```json
  {
    "success": false,
    "error": {
      "code": "UNAUTHORIZED_ACCESS",
      "message": "Detailed error message",
      "details": []
    }
  }
  ```

---

## 2. Authentication Endpoints (`/api/auth`)

### 2.1 Register User
* **Method**: `POST`
* **URL**: `/api/auth/register`
* **Authentication**: None (Public)
* **Role**: All
* **Request Body**:
  ```json
  {
    "name": "Dr. Sarah Jenkins",
    "email": "sarah.jenkins@neerajpharma.com",
    "password": "SecurePassword123!",
    "role": "DOCTOR",
    "specialization": "Cardiology"
  }
  ```
* **Validation**:
  * `name`: string, min 2 chars
  * `email`: valid email format
  * `password`: min 8 chars
  * `role`: Enum (`PATIENT`, `DOCTOR`, `ADMIN`)
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "name": "Dr. Sarah Jenkins",
        "email": "sarah.jenkins@neerajpharma.com",
        "role": "DOCTOR",
        "createdAt": "2026-09-22T12:00:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
* **Errors**: `400 Bad Request` (Email already exists / validation error).

---

### 2.2 Login User
* **Method**: `POST`
* **URL**: `/api/auth/login`
* **Authentication**: None (Public)
* **Request Body**:
  ```json
  {
    "email": "sarah.jenkins@neerajpharma.com",
    "password": "SecurePassword123!"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "name": "Dr. Sarah Jenkins",
        "email": "sarah.jenkins@neerajpharma.com",
        "role": "DOCTOR"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
* **Errors**: `401 Unauthorized` (Invalid email or password).

---

### 2.3 Get Current User (`Me`)
* **Method**: `GET`
* **URL**: `/api/auth/me`
* **Authentication**: Bearer Token
* **Response (200 OK)**: Returns full user profile without password hash.

---

## 3. Appointment Endpoints (`/api/appointments`)

### 3.1 Create Appointment
* **Method**: `POST`
* **URL**: `/api/appointments`
* **Authentication**: Bearer Token
* **Role**: `PATIENT`, `ADMIN`
* **Request Body**:
  ```json
  {
    "doctorId": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "scheduledTime": "2026-09-22T18:00:00.000Z",
    "notes": "Follow-up consultation"
  }
  ```
* **Response (201 Created)**: Returns created appointment object with `id`, `patientId`, `doctorId`, `scheduledTime`, `status`.

---

### 3.2 List Appointments
* **Method**: `GET`
* **URL**: `/api/appointments`
* **Authentication**: Bearer Token
* **Query Parameters**: `status` (`SCHEDULED`, `COMPLETED`, `CANCELLED`), `page`, `limit`
* **Response (200 OK)**: Returns list of appointments associated with the requesting user.

---

## 4. Call Endpoints (`/api/calls`)

### 4.1 Initiate Call
* **Method**: `POST`
* **URL**: `/api/calls/initiate`
* **Authentication**: Bearer Token
* **Role**: `PATIENT`
* **Request Body**:
  ```json
  {
    "appointmentId": "apt_8f2a1b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "callType": "VIDEO"
  }
  ```
* **Validation**: Checks appointment exists, caller is patient, appointment time is valid, doctor is not busy.
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "callSession": {
        "id": "call_12345678-abcd-efgh-ijkl-1234567890ab",
        "appointmentId": "apt_8f2a1b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
        "patientId": "usr_patient_1",
        "doctorId": "usr_doctor_1",
        "callType": "VIDEO",
        "status": "INITIATED",
        "roomId": "call_apt_8f2a1b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
        "initiatedAt": "2026-09-22T17:30:00.000Z"
      },
      "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
      ]
    }
  }
  ```
* **Errors**:
  * `400 Bad Request` (Invalid payload / missing fields)
  * `403 Forbidden` (User not part of this appointment)
  * `409 Conflict` (Doctor is currently in another call / `BUSY`)

---

### 4.2 Get Call History (User Scoped)
* **Method**: `GET`
* **URL**: `/api/calls/history`
* **Authentication**: Bearer Token
* **Role**: `PATIENT`, `DOCTOR`
* **Query Parameters**: `page=1`, `limit=10`, `status=COMPLETED`
* **Response (200 OK)**: Returns user's past call sessions with timestamps and durations.

---

## 5. Admin Monitoring Endpoints (`/api/admin/calls`)

### 5.1 Get Call Aggregated Statistics
* **Method**: `GET`
* **URL**: `/api/admin/calls/stats`
* **Authentication**: Bearer Token
* **Role**: `ADMIN`
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "totalCalls": 142,
      "activeCalls": 3,
      "completedCalls": 118,
      "rejectedCalls": 12,
      "missedCalls": 7,
      "busyCalls": 3,
      "failedCalls": 2,
      "completionRate": 83.1,
      "callTypeBreakdown": {
        "VOICE": 45,
        "VIDEO": 97
      },
      "averageDurationSeconds": 485
    }
  }
  ```

---

### 5.2 Get Active Calls List
* **Method**: `GET`
* **URL**: `/api/admin/calls/active`
* **Authentication**: Bearer Token
* **Role**: `ADMIN`
* **Response (200 OK)**: List of currently ongoing calls (`status = CONNECTED` or `RINGING`).

---

### 5.3 Get System-Wide Call Logs (Paginated & Filtered)
* **Method**: `GET`
* **URL**: `/api/admin/calls`
* **Authentication**: Bearer Token
* **Role**: `ADMIN`
* **Query Parameters**: `status`, `callType`, `patientId`, `doctorId`, `startDate`, `endDate`, `page`, `limit`
* **Response (200 OK)**: Returns matching records with pagination metadata.

---

### 5.4 Get Call Session Details
* **Method**: `GET`
* **URL**: `/api/admin/calls/:id`
* **Authentication**: Bearer Token
* **Role**: `ADMIN`
* **Response (200 OK)**: Full call record details including appointment and participant objects.
