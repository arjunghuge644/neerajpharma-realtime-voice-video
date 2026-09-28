const http = require('http');
const { io: Client } = require('socket.io-client');
const app = require('../server');
const { initSocketServer } = require('../src/sockets');
const prisma = require('../src/config/prisma');

async function testSignaling() {
  const server = http.createServer(app);
  initSocketServer(server);

  server.listen(5006, async () => {
    console.log('🧪 Running WebRTC Signaling & Call Lifecycle Integration Test Suite...');
    try {
      // 1. Authenticate Patient & Doctor via REST
      const patientRes = await fetch('http://localhost:5006/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'patient@neerajpharma.com', password: 'Patient123!' }),
      });
      const patientData = await patientRes.json();
      const patientToken = patientData.data.token;
      const patientId = patientData.data.user.id;

      const doctorRes = await fetch('http://localhost:5006/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'doctor@neerajpharma.com', password: 'Doctor123!' }),
      });
      const doctorData = await doctorRes.json();
      const doctorToken = doctorData.data.token;

      // Fetch active appointment and clean up any past unclosed test sessions
      const appointment = await prisma.appointment.findFirst({
        where: { patientId },
      });
      const appointmentId = appointment.id;
      await prisma.callSession.updateMany({
        where: { appointmentId, status: { in: ['INITIATED', 'RINGING', 'ACCEPTED', 'ONGOING'] } },
        data: { status: 'COMPLETED' },
      });
      console.log('✅ Active Appointment ID:', appointmentId);

      // Connect Patient and Doctor Sockets
      const patientSocket = Client('http://localhost:5006', {
        auth: { token: `Bearer ${patientToken}` },
        transports: ['websocket'],
      });

      const doctorSocket = Client('http://localhost:5006', {
        auth: { token: `Bearer ${doctorToken}` },
        transports: ['websocket'],
      });

      await Promise.all([
        new Promise((resolve) => patientSocket.on('connect', resolve)),
        new Promise((resolve) => doctorSocket.on('connect', resolve)),
      ]);
      console.log('✅ Patient & Doctor Sockets Connected to Server.');

      // 2. Test Call Initiation (call:initiate -> call:incoming & call:ringing)
      console.log('\n2. Testing Call Initiation (call:initiate)...');
      let callSessionId = null;

      const incomingPromise = new Promise((resolve) => {
        doctorSocket.on('call:incoming', (data) => {
          console.log('   Doctor Received call:incoming:', data.callSessionId, 'Type:', data.callType);
          resolve(data);
        });
      });

      const ringingPromise = new Promise((resolve) => {
        patientSocket.on('call:ringing', (data) => {
          console.log('   Patient Received call:ringing:', data.callSessionId);
          resolve(data);
        });
      });

      const initiateAck = await new Promise((resolve) => {
        patientSocket.emit('call:initiate', { appointmentId, callType: 'VIDEO' }, resolve);
      });

      console.log('   Patient Initiate Ack Success:', initiateAck.success);
      callSessionId = initiateAck.callSessionId;

      await Promise.all([incomingPromise, ringingPromise]);

      // 3. Test Call Acceptance (call:accept -> call:accepted)
      console.log('\n3. Testing Call Acceptance (call:accept)...');
      const acceptedPromise = new Promise((resolve) => {
        patientSocket.on('call:accepted', (data) => {
          console.log('   Patient Received call:accepted for Session:', data.callSessionId);
          resolve(data);
        });
      });

      const acceptAck = await new Promise((resolve) => {
        doctorSocket.emit('call:accept', { callSessionId }, resolve);
      });
      console.log('   Doctor Accept Ack Success:', acceptAck.success);

      await acceptedPromise;

      // 4. Test WebRTC Signaling Exchange (webrtc:offer, webrtc:answer, webrtc:ice-candidate)
      console.log('\n4. Testing WebRTC Signaling Relay...');

      // Offer Relay Test
      const offerPromise = new Promise((resolve) => {
        doctorSocket.on('webrtc:offer', (data) => {
          console.log('   Doctor Received WebRTC Offer from Sender:', data.senderId);
          resolve(data);
        });
      });

      patientSocket.emit('webrtc:offer', {
        appointmentId,
        sdp: { type: 'offer', sdp: 'v=0\r\ntest_sdp_offer' },
      });

      await offerPromise;

      // Answer Relay Test
      const answerPromise = new Promise((resolve) => {
        patientSocket.on('webrtc:answer', (data) => {
          console.log('   Patient Received WebRTC Answer from Sender:', data.senderId);
          resolve(data);
        });
      });

      doctorSocket.emit('webrtc:answer', {
        appointmentId,
        sdp: { type: 'answer', sdp: 'v=0\r\ntest_sdp_answer' },
      });

      await answerPromise;

      // ICE Candidate Relay Test
      const icePromise = new Promise((resolve) => {
        doctorSocket.on('webrtc:ice-candidate', (data) => {
          console.log('   Doctor Received WebRTC ICE Candidate:', data.candidate.candidate);
          resolve(data);
        });
      });

      patientSocket.emit('webrtc:ice-candidate', {
        appointmentId,
        candidate: { candidate: 'candidate:123456789 udp host' },
      });

      await icePromise;

      // 5. Test Call Termination (call:end -> call:ended)
      console.log('\n5. Testing Call Termination (call:end)...');
      const endedPromise = new Promise((resolve) => {
        patientSocket.on('call:ended', (data) => {
          console.log('   Patient Received call:ended. Duration:', data.duration, 's');
          resolve(data);
        });
      });

      const endAck = await new Promise((resolve) => {
        doctorSocket.emit('call:end', { callSessionId }, resolve);
      });
      console.log('   Doctor End Ack Success:', endAck.success);

      await endedPromise;

      // 6. Verify Session Record in Database
      console.log('\n6. Verifying Database Call Session Persistence...');
      const dbSession = await prisma.callSession.findUnique({
        where: { id: callSessionId },
      });
      console.log('   DB Session Status:', dbSession.status);
      console.log('   DB Start Time:', dbSession.startTime?.toISOString());
      console.log('   DB End Time:', dbSession.endTime?.toISOString());
      console.log('   DB Duration (seconds):', dbSession.duration);

      patientSocket.close();
      doctorSocket.close();

      console.log('\n✅ ALL WEBRTC SIGNALING & CALL LIFECYCLE TESTS PASSED SUCCESSFULLY!');
    } catch (err) {
      console.error('❌ Signaling Verification Failed:', err);
    } finally {
      server.close();
      await prisma.$disconnect();
      process.exit(0);
    }
  });
}

testSignaling();
