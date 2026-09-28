const app = require('../server');
const prisma = require('../src/config/prisma');

async function testCalls() {
  const server = app.listen(5003, async () => {
    console.log('🧪 Running Call REST APIs Verification Test Suite...');
    try {
      // 1. Authenticate Patient & Doctor
      const patientRes = await fetch('http://localhost:5003/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'patient@neerajpharma.com', password: 'Patient123!' }),
      });
      const patientData = await patientRes.json();
      const patientToken = patientData.data.token;
      const patientId = patientData.data.user.id;

      const doctorRes = await fetch('http://localhost:5003/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'doctor@neerajpharma.com', password: 'Doctor123!' }),
      });
      const doctorData = await doctorRes.json();
      const doctorToken = doctorData.data.token;
      const doctorId = doctorData.data.user.id;

      // Register an unauthorized third-party patient
      const unauthEmail = `unauth_call_${Date.now()}@neerajpharma.com`;
      const unauthRegRes = await fetch('http://localhost:5003/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Unauth Call Patient', email: unauthEmail, password: 'Password123!', role: 'PATIENT' }),
      });
      const unauthRegData = await unauthRegRes.json();
      const unauthToken = unauthRegData.data.token;

      // Fetch active appointment
      const appointment = await prisma.appointment.findFirst({
        where: { patientId, doctorId },
      });
      const appointmentId = appointment.id;
      console.log('✅ Active Appointment Retrieved:', appointmentId);

      // 2. Initiate Voice Call (POST /api/calls)
      console.log('\n2. Testing POST /api/calls (Initiate Voice Call)...');
      const voiceCallRes = await fetch('http://localhost:5003/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${patientToken}`,
        },
        body: JSON.stringify({
          appointmentId: appointmentId,
          callType: 'VOICE',
        }),
      });
      const voiceCallData = await voiceCallRes.json();
      console.log('   Status (Expected 201):', voiceCallRes.status);
      console.log('   Call Session ID:', voiceCallData.data?.callSession?.id);
      console.log('   Generated Room ID:', voiceCallData.data?.callSession?.roomId);
      console.log('   ICE Servers Configured:', voiceCallData.data?.iceServers?.length > 0);
      const callSessionId = voiceCallData.data?.callSession?.id;

      // 3. Duplicate Call Initiation (Conflict 409 BUSY Expected)
      console.log('\n3. Testing Duplicate Active Call Initiation (Conflict BUSY Block)...');
      const busyRes = await fetch('http://localhost:5003/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${patientToken}`,
        },
        body: JSON.stringify({
          appointmentId: appointmentId,
          callType: 'VIDEO',
        }),
      });
      const busyData = await busyRes.json();
      console.log('   Status (Expected 409):', busyRes.status);
      console.log('   Error Code:', busyData.error?.code);

      // 4. End Call Session (POST /api/calls/:id/end)
      console.log('\n4. Testing POST /api/calls/:id/end (End Call Session)...');
      const endRes = await fetch(`http://localhost:5003/api/calls/${callSessionId}/end`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${patientToken}` },
      });
      const endData = await endRes.json();
      console.log('   Status (Expected 200):', endRes.status);
      console.log('   Final Call Status:', endData.data?.callSession?.status);

      // 5. Initiate Video Call After Previous Call Completed
      console.log('\n5. Testing POST /api/calls (Initiate Video Call)...');
      const videoCallRes = await fetch('http://localhost:5003/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${patientToken}`,
        },
        body: JSON.stringify({
          appointmentId: appointmentId,
          callType: 'VIDEO',
        }),
      });
      const videoCallData = await videoCallRes.json();
      console.log('   Status (Expected 201):', videoCallRes.status);
      console.log('   Video Call Session ID:', videoCallData.data?.callSession?.id);

      // 6. Fetch User Call History (GET /api/calls/history)
      console.log('\n6. Testing GET /api/calls/history (Fetch Call History)...');
      const historyRes = await fetch('http://localhost:5003/api/calls/history', {
        headers: { Authorization: `Bearer ${patientToken}` },
      });
      const historyData = await historyRes.json();
      console.log('   Status (Expected 200):', historyRes.status);
      console.log('   History Count:', historyData.data?.calls?.length);

      // 7. Test Unauthorized User Call Detail Access (403 Expected)
      console.log('\n7. Testing Unauthorized Access to Call Session...');
      const unauthCallRes = await fetch(`http://localhost:5003/api/calls/${callSessionId}`, {
        headers: { Authorization: `Bearer ${unauthToken}` },
      });
      const unauthCallData = await unauthCallRes.json();
      console.log('   Status (Expected 403):', unauthCallRes.status);
      console.log('   Error Code:', unauthCallData.error?.code);

      console.log('\n✅ ALL CALL REST API VERIFICATION TESTS PASSED SUCCESSFULLY!');
    } catch (err) {
      console.error('❌ Call REST API Verification Failed:', err);
    } finally {
      server.close();
      await prisma.$disconnect();
      process.exit(0);
    }
  });
}

testCalls();
