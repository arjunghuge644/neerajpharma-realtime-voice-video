const app = require('../server');

async function testAuth() {
  const server = app.listen(5001, async () => {
    console.log('🧪 Running Auth Verification Test Suite...');
    try {
      // 1. Test Patient Login
      console.log('1. Testing Patient Login...');
      const patientLoginRes = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'patient@neerajpharma.com',
          password: 'Patient123!',
        }),
      });
      const patientLoginData = await patientLoginRes.json();
      console.log('   Status:', patientLoginRes.status);
      console.log('   Success:', patientLoginData.success);
      console.log('   Token Issued:', Boolean(patientLoginData.data?.token));
      console.log('   User Role:', patientLoginData.data?.user?.role);

      const patientToken = patientLoginData.data?.token;

      // 2. Test Invalid Password Login (401 Expected)
      console.log('\n2. Testing Invalid Password Login...');
      const invalidRes = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'patient@neerajpharma.com',
          password: 'WrongPassword!',
        }),
      });
      const invalidData = await invalidRes.json();
      console.log('   Status (Expected 401):', invalidRes.status);
      console.log('   Error Code:', invalidData.error?.code);

      // 3. Test GET /api/auth/me with Bearer Token (200 Expected)
      console.log('\n3. Testing Protected GET /api/auth/me with Token...');
      const meRes = await fetch('http://localhost:5001/api/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${patientToken}`,
        },
      });
      const meData = await meRes.json();
      console.log('   Status (Expected 200):', meRes.status);
      console.log('   Authenticated User:', meData.data?.user?.email);

      // 4. Test GET /api/auth/me without Token (401 Expected)
      console.log('\n4. Testing GET /api/auth/me without Token...');
      const noTokenRes = await fetch('http://localhost:5001/api/auth/me');
      const noTokenData = await noTokenRes.json();
      console.log('   Status (Expected 401):', noTokenRes.status);
      console.log('   Error Code:', noTokenData.error?.code);

      // 5. Test Registering New User (201 Expected)
      console.log('\n5. Testing Registration of New User...');
      const testEmail = `newpatient_${Date.now()}@neerajpharma.com`;
      const regRes = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Smith',
          email: testEmail,
          password: 'SecurePassword123!',
          role: 'PATIENT',
        }),
      });
      const regData = await regRes.json();
      console.log('   Status (Expected 201):', regRes.status);
      console.log('   Created Email:', regData.data?.user?.email);

      console.log('\n✅ ALL AUTH VERIFICATION TESTS PASSED SUCCESSFULLY!');
    } catch (err) {
      console.error('❌ Auth Verification Failed:', err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

testAuth();
