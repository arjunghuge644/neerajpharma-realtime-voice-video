# Database Design Document

## 1. Overview & ER Diagram Concept

The NeerajPharma PostgreSQL database utilizes Prisma ORM to manage user identities, appointment scheduling, and real-time voice/video call session logs.

```
       ┌────────────────────────┐
       │          User          │
       ├────────────────────────┤
       │ id (PK)                │
       │ email (UNIQUE)         │
       │ passwordHash           │
       │ name                   │
       │ role (ENUM)            │
       │ specialization         │
       └───────────┬────────────┘
                   │ 1
                   │
                   │ N (Patient / Doctor)
                   ▼
       ┌────────────────────────┐
       │      Appointment       │
       ├────────────────────────┤
       │ id (PK)                │
       │ patientId (FK -> User) │
       │ doctorId (FK -> User)  │
       │ scheduledTime          │
       │ status (ENUM)          │
       └───────────┬────────────┘
                   │ 1
                   │
                   │ N (Calls)
                   ▼
       ┌────────────────────────┐
       │      CallSession       │
       ├────────────────────────┤
       │ id (PK)                │
       │ appointmentId (FK)     │
       │ patientId (FK -> User) │
       │ doctorId (FK -> User)  │
       │ callType (ENUM)        │
       │ status (ENUM)          │
       │ initiatedAt            │
       │ startedAt              │
       │ endedAt                │
       │ duration               │
       │ roomId (UNIQUE)        │
       └────────────────────────┘
```

---

## 2. PostgreSQL Enums

```prisma
enum Role {
  PATIENT
  DOCTOR
  ADMIN
}

enum AppointmentStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum CallType {
  VOICE
  VIDEO
}

enum CallStatus {
  INITIATED
  RINGING
  CONNECTED
  COMPLETED
  REJECTED
  MISSED
  BUSY
  FAILED
}
```

---

## 3. Detailed Entity Schemas (Prisma Definition)

```prisma
// server/prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id             String        @id @default(uuid())
  email          String        @unique
  passwordHash   String
  name           String
  role           Role          @default(PATIENT)
  specialization String?       // Applicable for DOCTOR role
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  // Relationships
  patientAppointments Appointment[] @relation("PatientAppointments")
  doctorAppointments  Appointment[] @relation("DoctorAppointments")
  patientCalls        CallSession[] @relation("PatientCalls")
  doctorCalls         CallSession[] @relation("DoctorCalls")

  @@index([email])
  @@index([role])
}

model Appointment {
  id            String            @id @default(uuid())
  patientId     String
  doctorId      String
  scheduledTime DateTime
  status        AppointmentStatus @default(SCHEDULED)
  notes         String?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  // Relations
  patient User        @relation("PatientAppointments", fields: [patientId], references: [id], onDelete: Cascade)
  doctor  User        @relation("DoctorAppointments", fields: [doctorId], references: [id], onDelete: Cascade)
  calls   CallSession[]

  @@index([patientId])
  @@index([doctorId])
  @@index([scheduledTime])
  @@index([status])
}

model CallSession {
  id            String      @id @default(uuid())
  appointmentId String
  patientId     String
  doctorId      String
  callType      CallType    @default(VIDEO)
  status        CallStatus  @default(INITIATED)
  roomId        String      @unique // E.g., call_apt_<UUID>
  initiatedAt   DateTime    @default(now())
  startedAt     DateTime?   // Timestamp when Doctor ACCEPTS
  endedAt       DateTime?   // Timestamp when call ENDS
  duration      Int?        // Duration in seconds (endedAt - startedAt)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Relations
  appointment Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  patient     User        @relation("PatientCalls", fields: [patientId], references: [id], onDelete: Cascade)
  doctor      User        @relation("DoctorCalls", fields: [doctorId], references: [id], onDelete: Cascade)

  @@index([appointmentId])
  @@index([patientId])
  @@index([doctorId])
  @@index([status])
  @@index([initiatedAt])
  @@index([status, initiatedAt])
}
```

---

## 4. Indexing & Performance Optimization Strategy

1. **User Authentication Index**: `User.email` is uniquely indexed to guarantee instant `$1` lookup during login.
2. **Appointment Gating Index**: Compound index on `[patientId, doctorId, scheduledTime]` allows O(1) authorization checks before allowing call setup.
3. **Admin Monitoring Indexes**: Compound index on `[status, initiatedAt]` enables efficient filtering of active calls (`CONNECTED`/`RINGING`) and fast temporal queries for dashboard analytics.
