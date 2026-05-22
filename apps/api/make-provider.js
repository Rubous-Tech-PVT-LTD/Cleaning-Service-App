const pg = require('pg');
const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:postgres@localhost:5432/marketplace_db?schema=public' 
});

async function main() {
  const userId = '2ec45b09-4945-45c9-8af3-9c68ecbcb898';
  const lastPulledDate = new Date(0); // from beginning

  // Simulate what the sync API does for PROVIDER
  const bookings = await pool.query(
    `SELECT * FROM bookings WHERE ("providerId" = $1 OR status = 'PENDING') AND "updatedAt" > $2`,
    [userId, lastPulledDate]
  );
  
  console.log(`\n=== BOOKINGS PROVIDER WOULD GET (${bookings.rows.length} total) ===`);
  bookings.rows.forEach(b => {
    console.log(`  - ID: ${b.id.slice(-6)} | Status: ${b.status} | CreatedAt: ${b.createdAt}`);
  });

  // Check if auth service has the mock OTP for dev
  const authCheck = await pool.query(`SELECT id, phone, role FROM users WHERE phone = '+919999999999'`);
  console.log('\n=== USER AUTH STATUS ===');
  console.log(JSON.stringify(authCheck.rows, null, 2));
}

main().catch(console.error).finally(() => pool.end());
