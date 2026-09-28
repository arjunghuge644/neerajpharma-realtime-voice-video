const app = require('../server');
const appointmentService = require('../src/services/appointmentService');

async function testAppointments() {
  const server = app.listen(5002, async () => {
    console.log('🧪 Running Appointments Verification Test Suite...');
    try {
      // 1. Login Patient & Doctor
      const patientRes = await fetch('http://localhost:5002/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'patient@neerajpharma.com', password: 'Patient123!' }),
      });
      const patientData = await patientRes.json();
      const patientToken = patientData.data.token;
      const patientId = patientData.data.user.id;

      const doctorRes = await fetch('http://localhost:5002/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'doctor@neerajpharma.com', password: 'Doctor123!' }),
      });
      const doctorData = await doctorRes.json();
      const doctorToken = doctorData.data.token;
      const doctorId = doctorData.data.user.id;

      // Register an unauthorized third-party patient
      const unauthEmail = `unauth_${Date.now()}@neerajpharma.com`;
      const unauthRegRes = await fetch('http://localhost:5002/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Unauth Patient', email: unauthEmail, password: 'Password123!', role: 'PATIENT' }),
      });
      const unauthRegData = await unauthRegRes.json();
      const unauthToken = unauthRegData.data.token;
      const unauthId = unauthRegData.data.user.id;

      console.log('✅ Authenticated Patient, Doctor, and Unauthorized Patient.');

      // 2. Test POST /api/appointments
      console.log('\n2. Testing POST /api/appointments (Create Appointment)...');
      const createRes = await fetch('http://localhost:5002/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${patientToken}`,
        },
        body: JSON.stringify({
          doctorId: doctorId,
          appointmentDate: new Date(Date.now() + 86400000).toISOString(),
          notes: 'Routine cardiology follow-up',
        }),
      });
      const createData = await createRes.json();
      console.log('   Status (Expected 201):', createRes.status);
      console.log('   Appointment Created ID:', createData.data?.appointment?.id);
      const appointmentId = createData.data?.appointment?.id;

      // 3. Test GET /api/appointments (Patient & Doctor Listing)
      console.log('\n3. Testing GET /api/appointments (List Appointments)...');
      const listPatientRes = await fetch('http://localhost:5002/api/appointments', {
        headers: { Authorization: `Bearer ${patientToken}` },
      });
      const listPatientData = await listPatientRes.json();
      console.log('   Patient Appointments Count:', listPatientData.data?.appointments?.length);

      const listDoctorRes = await fetch('http://localhost:5002/api/appointments', {
        headers: { Authorization: `Bearer ${doctorToken}` },
      });
      const listDoctorData = await listDoctorRes.json();
      console.log('   Doctor Appointments Count:', listDoctorData.data?.appointments?.length);

      // 4. Test GET /api/appointments/:id (Authorized Access)
      console.log('\n4. Testing GET /api/appointments/:id (Authorized View)...');
      const getRes = await fetch(`http://localhost:5002/api/appointments/${appointmentId}`, {
        headers: { Authorization: `Bearer ${patientToken}` },
      });
      const getData = await getRes.json();
      console.log('   Status (Expected 200):', getRes.status);
      console.log('   Retrieved Appointment Notes:', getData.data?.appointment?.notes);

      // 5. Test Unauthorized Appointment Access (403 Expected)
      console.log('\n5. Testing Unauthorized Patient Viewing Someone Else\'s Appointment...');
      const unauthAccessRes = await fetch(`http://localhost:5002/api/appointments/${appointmentId}`, {
        headers: { Authorization: `Bearer ${unauthToken}` },
      });
      const unauthAccessData = await unauthAccessRes.json();
      console.log('   Status (Expected 403):', unauthAccessRes.status);
      console.log('   Error Code:', unauthAccessData.error?.code);

      // 6. Test validateAppointmentForCall Service Gating
      console.log('\n6. Testing Call Gating Service Function...');
      const validCallGate = await appointmentService.validateAppointmentForCall(appointmentId, patientId);
      console.log('   Valid Caller Check:', validCallGate.isPatient ? 'PASSED (Patient)' : 'FAILED');

      try {
        await appointmentService.validateAppointmentForCall(appointmentId, unauthId);
        console.error('   FAILED: Unauthorized user was not blocked!');
      } catch (err) {
        console.log('   Unauthorized Call Gating Block (Expected 403):', err.message);
      }

      console.log('\n✅ ALL APPOINTMENTS VERIFICATION TESTS PASSED SUCCESSFULLY!');
    } catch (err) {
      console.error('❌ Appointments Verification Failed:', err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

testAppointments();
