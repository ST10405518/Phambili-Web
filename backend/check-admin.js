/**
 * Check admin data in Firebase
 */

const { db } = require('./firebaseConfig');
const bcrypt = require('bcryptjs');

async function checkAdmin() {
  try {
    console.log('🔍 Checking admin data in Firebase...\n');
    
    // Get admin document
    const adminDoc = await db.collection('admins').doc('1').get();
    
    if (!adminDoc.exists) {
      console.log('❌ Admin document not found!');
      return;
    }
    
    const adminData = adminDoc.data();
    console.log('📊 Admin Data:');
    console.log('  Email:', adminData.Email);
    console.log('  Name:', adminData.Name);
    console.log('  Role:', adminData.Role);
    console.log('  Password (hashed):', adminData.Password);
    console.log('  Password starts with $2b$:', adminData.Password?.startsWith('$2b$'));
    console.log('  Password length:', adminData.Password?.length);
    
    // Test password comparison
    const testPassword = 'Phambili@2023';
    console.log('\n🔐 Testing password:', testPassword);
    
    const isValid = await bcrypt.compare(testPassword, adminData.Password);
    console.log('  Password valid:', isValid);
    
    if (!isValid) {
      console.log('\n⚠️  Password does not match!');
      console.log('  This means the password was not hashed correctly during migration.');
      console.log('\n✅ Solution: Re-hash the password...');
      
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('  New hash:', newHash);
      
      // Update the admin password
      await db.collection('admins').doc('1').update({
        Password: newHash
      });
      
      console.log('\n✅ Admin password updated successfully!');
      console.log('  You can now login with:');
      console.log('  Email: admin@phambilimaafrica.com');
      console.log('  Password: Phambili@2023');
    } else {
      console.log('\n✅ Password is correct!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAdmin()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
