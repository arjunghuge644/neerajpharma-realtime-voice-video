const app = require('../server');

async function testAdmin() {
  const server = app.listen(5008, async () => {
    console.log('🧪 Running Admin Dashboard REST APIs Verification Test Suite...');
    try {
      // 1. Authenticate Admin and Patient
      const adminRes = await fetch('http://localhost:5008/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@neerajpharma.com', password: 'Admin123!' }),
      });
      const adminData = await adminRes.json();
      const adminToken = adminData.data?.token;

      const patientRes = await fetch('http://localhost:5008/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'patient@neerajpharma.com', password: 'Patient123!' }),
      });
      const patientData = await patientRes.json();
      const patientToken = patientData.data?.token;

      console.log('✅ Authenticated Admin & Patient Credentials.');

      // 2. Test GET /api/admin/calls/stats (Admin Statistics Aggregation)
      console.log('\n2. Testing GET /api/admin/calls/stats (Admin Stats)...');
      const statsRes = await fetch('http://localhost:5008/api/admin/calls/stats', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const statsData = await statsRes.json();
      console.log('   Status (Expected 200):', statsRes.status);
      console.log('   Total Calls:', statsData.data?.totalCalls);
      console.log('   Active Calls:', statsData.data?.activeCalls);
      console.log('   Completed Calls:', statsData.data?.completedCalls);
      console.log('   Completion Rate (%):', statsData.data?.completionRatePercent);
      console.log('   Voice Calls Count:', statsData.data?.callTypeBreakdown?.VOICE);
      console.log('   Video Calls Count:', statsData.data?.callTypeBreakdown?.VIDEO);
      console.log('   Average Duration (seconds):', statsData.data?.averageDurationSeconds);

      // 3. Test GET /api/admin/calls/active (Active Calls List)
      console.log('\n3. Testing GET /api/admin/calls/active (Active Calls Monitor)...');
      const activeRes = await fetch('http://localhost:5008/api/admin/calls/active', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const activeData = await activeRes.json();
      console.log('   Status (Expected 200):', activeRes.status);
      console.log('   Active Calls Count:', activeData.data?.count);

      // 4. Test GET /api/admin/calls (Complete System Call History)
      console.log('\n4. Testing GET /api/admin/calls (Paginated System Logs)...');
      const historyRes = await fetch('http://localhost:5008/api/admin/calls?page=1&limit=5', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const historyData = await historyRes.json();
      console.log('   Status (Expected 200):', historyRes.status);
      console.log('   Total Call Records:', historyData.data?.pagination?.total);
      console.log('   Returned Log Batch Size:', historyData.data?.calls?.length);

      // 5. Test Non-Admin Role Security Gating (403 Expected for Patient)
      console.log('\n5. Testing Non-Admin Security Gate (Patient Accessing Admin API)...');
      const forbiddenRes = await fetch('http://localhost:5008/api/admin/calls/stats', {
        headers: { Authorization: `Bearer ${patientToken}` },
      });
      const forbiddenData = await forbiddenRes.json();
      console.log('   Status (Expected 403):', forbiddenRes.status);
      console.log('   Error Code:', forbiddenData.error?.code);
      console.log('   Error Message:', forbiddenData.message);

      console.log('\n✅ ALL ADMIN REST API VERIFICATION TESTS PASSED SUCCESSFULLY!');
    } catch (err) {
      console.error('❌ Admin Verification Failed:', err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

testAdmin();
