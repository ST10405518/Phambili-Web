require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db } = require('../firebaseConfig');

async function seedFirebaseAdmin() {
  try {
    console.log('🔄 Starting Firebase admin seeding...');

    const adminEmail = 'admin@phambili.com';
    const adminPassword = 'Admin123!'; // Change this to your desired password

    // Check if admin already exists
    const adminsRef = db.collection('admins');
    const existingAdmin = await adminsRef.where('Email', '==', adminEmail).get();
    
    if (!existingAdmin.empty) {
      console.log('⚠️  Admin already exists. Skipping creation.');
      console.log('ℹ️  Existing admin email:', adminEmail);
      console.log('ℹ️  Use this email to login to the admin dashboard');
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create admin document
    const adminData = {
      Name: 'System Administrator',
      Email: adminEmail,
      Password: hashedPassword,
      First_Login: true,
      Role: 'main_admin',
      Created_At: new Date().toISOString(),
      Created_By: null,
      Is_Active: true
    };

    await adminsRef.add(adminData);

    console.log('✅ Firebase admin created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔐 Password:', adminPassword);
    console.log('🚨 IMPORTANT: Change this password after first login!');
    console.log('');
    console.log('🌐 Login at: http://localhost:8000/admin-dashboard.html');

  } catch (error) {
    console.error('❌ Admin seeding failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedFirebaseAdmin()
  .then(() => {
    console.log('✅ Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
