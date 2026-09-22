const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Database Seeding for NeerajPharma Telemedicine Module...');

  // Hash passwords
  const salt = await bcrypt.genSalt(10);
  const patientPassword = await bcrypt.hash('Patient123!', salt);
  const doctorPassword = await bcrypt.hash('Doctor123!', salt);
  const adminPassword = await bcrypt.hash('Admin123!', salt);

  // 1. Create or Update Demo Users
  const patient = await prisma.user.upsert({
    where: { email: 'patient@neerajpharma.com' },
    update: {
      name: 'John Doe (Patient)',
      passwordHash: patientPassword,
      role: 'PATIENT',
    },
    create: {
      email: 'patient@neerajpharma.com',
      name: 'John Doe (Patient)',
      passwordHash: patientPassword,
      role: 'PATIENT',
    },
  });

  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@neerajpharma.com' },
    update: {
      name: 'Dr. Sarah Jenkins',
      passwordHash: doctorPassword,
      role: 'DOCTOR',
      specialization: 'Cardiology',
    },
    create: {
      email: 'doctor@neerajpharma.com',
      name: 'Dr. Sarah Jenkins',
      passwordHash: doctorPassword,
      role: 'DOCTOR',
      specialization: 'Cardiology',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@neerajpharma.com' },
    update: {
      name: 'System Administrator',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
    create: {
      email: 'admin@neerajpharma.com',
      name: 'System Administrator',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Users Created:');
  console.log(`   - Patient: ${patient.email} (ID: ${patient.id})`);
  console.log(`   - Doctor:  ${doctor.email} (ID: ${doctor.id})`);
  console.log(`   - Admin:   ${admin.email} (ID: ${admin.id})`);

  // 2. Create Active Valid Appointment for Demo
  const activeAppointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      appointmentDate: new Date(),
      status: 'SCHEDULED',
      notes: 'General tele-consultation and cardiovascular checkup',
    },
  });

  console.log('✅ Active Appointment Created:');
  console.log(`   - Appointment ID: ${activeAppointment.id}`);
  console.log(`   - Date: ${activeAppointment.appointmentDate.toISOString()}`);
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
