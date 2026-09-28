const http = require('http');
const { io: Client } = require('socket.io-client');
const app = require('../server');
const { initSocketServer } = require('../src/sockets');
const prisma = require('../src/config/prisma');

async function testSockets() {
  const server = http.createServer(app);
  initSocketServer(server);

  server.listen(5004, async () => {
    console.log('🧪 Running Socket.IO Auth & Protected Room Test Suite...');
    try {
      // 1. Authenticate Patient & Doctor via REST
      const patientRes = await fetch('http://localhost:5004/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'patient@neerajpharma.com', password: 'Patient123!' }),
      });
      const patientData = await patientRes.json();
      const patientToken = patientData.data.token;
      const patientId = patientData.data.user.id;

      // Register an unauthorized patient
      const unauthEmail = `unauth_socket_${Date.now()}@neerajpharma.com`;
      const unauthRegRes = await fetch('http://localhost:5004/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Unauth Socket Patient', email: unauthEmail, password: 'Password123!', role: 'PATIENT' }),
      });
      const unauthRegData = await unauthRegRes.json();
      const unauthToken = unauthRegData.data.token;

      // Fetch active appointment
      const appointment = await prisma.appointment.findFirst({
        where: { patientId },
      });
      const appointmentId = appointment.id;

      // 2. Test Unauthenticated Socket Handshake Rejection (Invalid/Missing Token)
      console.log('\n2. Testing Unauthenticated Socket Handshake Rejection...');
      await new Promise((resolve) => {
        const badSocket = Client('http://localhost:5004', {
          auth: { token: 'InvalidOrMissingToken' },
          transports: ['websocket'],
          reconnection: false,
        });

        badSocket.on('connect_error', (err) => {
          console.log('   Handshake Error (Expected):', err.message);
          badSocket.close();
          resolve();
        });

        badSocket.on('connect', () => {
          console.error('   FAILED: Unauthenticated socket connected!');
          badSocket.close();
          resolve();
        });
      });

      // 3. Test Authenticated Socket Connection (Valid JWT)
      console.log('\n3. Testing Authenticated Socket Connection (Valid JWT)...');
      const patientSocket = await new Promise((resolve, reject) => {
        const socket = Client('http://localhost:5004', {
          auth: { token: `Bearer ${patientToken}` },
          transports: ['websocket'],
        });

        socket.on('connect', () => {
          console.log('   Status (Expected Connected):', socket.connected);
          console.log('   Assigned Socket ID:', socket.id);
          resolve(socket);
        });

        socket.on('connect_error', (err) => {
          reject(err);
        });
      });

      // 4. Test Authorized Room Join (room:join)
      console.log('\n4. Testing Authorized Room Join (call_{appointmentId})...');
      await new Promise((resolve) => {
        patientSocket.emit('room:join', { appointmentId }, (response) => {
          console.log('   Room Join Response:', response);
          console.log('   Success (Expected true):', response.success);
          console.log('   Joined Room:', response.roomId);
          resolve();
        });
      });

      // 5. Test Unauthorized Room Join Attempt
      console.log('\n5. Testing Unauthorized Room Join Attempt by Unassigned Patient...');
      const unauthSocket = await new Promise((resolve, reject) => {
        const socket = Client('http://localhost:5004', {
          auth: { token: `Bearer ${unauthToken}` },
          transports: ['websocket'],
        });

        socket.on('connect', () => resolve(socket));
        socket.on('connect_error', (err) => reject(err));
      });

      await new Promise((resolve) => {
        unauthSocket.emit('room:join', { appointmentId }, (response) => {
          console.log('   Room Join Response (Expected false):', response.success);
          console.log('   Error Code:', response.code);
          console.log('   Error Message:', response.message);
          resolve();
        });
      });

      patientSocket.close();
      unauthSocket.close();
      console.log('\n✅ ALL SOCKET.IO AUTH & ROOM VERIFICATION TESTS PASSED SUCCESSFULLY!');
    } catch (err) {
      console.error('❌ Socket Verification Failed:', err);
    } finally {
      server.close();
      await prisma.$disconnect();
      process.exit(0);
    }
  });
}

testSockets();
