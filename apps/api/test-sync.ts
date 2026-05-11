import axios from 'axios';

async function testSync() {
  try {
    // 1. Get Token (using the common test user)
    const loginRes = await axios.post('http://localhost:3000/v1/auth/otp/verify', {
      phone: '+919999999999',
      code: '123456'
    });
    const token = loginRes.data.token;

    console.log('Got Token, testing pull...');
    const pullRes = await axios.get('http://localhost:3000/v1/sync/pull?lastPulledAt=0', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Pull Success:', JSON.stringify(pullRes.data, null, 2).substring(0, 500) + '...');
  } catch (error: any) {
    console.error('Sync Test Failed:', error.response?.data || error.message);
  }
}

testSync();
