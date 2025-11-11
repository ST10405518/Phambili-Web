/**
 * Fix admin login - disable first login requirement
 */

const { db } = require('./firebaseConfig');

async function fixAdminLogin() {
  try {
    console.log('🔧 Fixing admin login...\n');
    
    // Update admin to disable first login requirement
    await db.collection('admins').doc('1').update({
      First_Login: false,
      Is_Active: true
    });
    
    console.log('✅ Admin updated successfully!');
    console.log('\n📋 Admin Login Credentials:');
    console.log('  Email: admin@phambilimaafrica.com');
    console.log('  Password: Phambili@2023');
    console.log('\n✅ You can now login without password reset requirement!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixAdminLogin()
  .then(() => {
    console.log('\n✅ Fix complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
