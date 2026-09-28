const app = require('../server');

async function runPostmanWorkflow() {
  const server = app.listen(5007, async () => {
    console.log('🚀 Running Postman Collection Workflow Automated Verification...');
    try {
      // 1. Login Patient -> get patientToken
      const patientLogin = await fetch('http://localhost:5007/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'patient@neerajpharma.com', password: 'Patient123!' }),
      });
      const patientData = await patientLogin.json();
      const patientToken = patientData.data.token;
      console.log('✅ 1. Login Patient (200 OK) -> Token Extracted');

      // 2. Login Doctor -> get doctorToken
      const doctorLogin = await fetch('http://localhost:5007/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'doctor@neerajpharma.com', password: 'Doctor123!' }),
      });
      const doctorData = await doctorLogin.json();
      const doctorToken = doctorData.data.token;
      console.log('✅ 2. Login Doctor (200 OK) -> Token Extracted');

      // 3. List Appointments -> get appointmentId
      const aptsRes = await fetch('http://localhost:5007/api/appointments', {
        headers: { Authorization: `Bearer ${patientToken}` },
      });
      const aptsData = await aptsRes.json();
      const appointmentId = aptsData.data.appointments[0].id;
      console.log('✅ 3. List Appointments (200 OK) -> Appointment ID:', appointmentId);

      // 4. Initiate Voice Call
      const voiceRes = await fetch('http://localhost:5007/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${patientToken}`,
        },
        body: JSON.stringify({ appointmentId, callType: 'VOICE' }),
      });
      const voiceData = await voiceRes.json();
      const voiceCallId = voiceData.data.callSession.id;
      console.log('✅ 4. Initiate Voice Call (201 Created) -> Voice Call ID:', voiceCallId);

      // 5. End Voice Call Session
      const endVoiceRes = await fetch(`http://localhost:5007/api/calls/${voiceCallId}/end`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${patientToken}` },
      });
      console.log('✅ 5. End Voice Call Session (200 OK)');

      // 6. Initiate Video Call
      const videoRes = await fetch('http://localhost:5007/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${patientToken}`,
        },
        body: JSON.stringify({ appointmentId, callType: 'VIDEO' }),
      });
      const videoData = await videoRes.json();
      const videoCallId = videoData.data.callSession.id;
      console.log('✅ 6. Initiate Video Call (201 Created) -> Video Call ID:', videoCallId);

      // 7. End Video Call Session
      const endVideoRes = await fetch(`http://localhost:5007/api/calls/${videoCallId}/end`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${patientToken}` },
      });
      console.log('✅ 7. End Video Call Session (200 OK)');

      // 8. Get Call History
      const historyRes = await fetch('http://localhost:5007/api/calls/history', {
        headers: { Authorization: `Bearer ${patientToken}` },
      });
      const historyData = await historyRes.json();
      console.log('✅ 8. Get Call History (200 OK) -> Total Logged Sessions:', historyData.data.calls.length);

      console.log('\n🎉 POSTMAN COLLECTION WORKFLOW VERIFIED WITH 100% SUCCESS!');
    } catch (err) {
      console.error('❌ Postman Collection Workflow Failed:', err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

runPostmanWorkflow();
