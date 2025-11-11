/**
 * MySQL to Firebase Migration Script
 * This script migrates your existing MySQL data to Firebase Firestore
 */

const { db } = require('./firebaseConfig');
const bcrypt = require('bcryptjs');

// Your MySQL data extracted from the SQL dump
const mysqlData = {
  admins: [
    {
      id: '1',
      Name: 'System Administrator',
      Email: 'admin@phambilimaafrica.com',
      Phone: null,
      Password: 'Phambili@2023', // This will be hashed
      Role: 'main_admin',
      First_Login: true,
      Is_Active: true,
      Last_Login: null,
      Login_Attempts: 0,
      Locked_Until: null,
      Created_By: null,
      createdAt: new Date('2025-11-07T15:45:21'),
      updatedAt: new Date('2025-11-07T15:45:21')
    }
  ],
  
  customers: [
    {
      id: '11',
      Full_Name: 'Musa',
      Email: 'm@gmail.com',
      Password: '$2b$10$BN8x7EAiO3d6f/G0Ymzikuoe/UTln4p20uA4sCETXDvOSLfkn0SCC', // Already hashed
      Phone: null,
      Address: null,
      createdAt: new Date('2025-11-09T16:16:19'),
      updatedAt: new Date('2025-11-09T16:16:19')
    }
  ],
  
  services: [
    {
      id: '1',
      Name: 'Office Cleaning',
      Description: 'Boost your workplace productivity and professionalism with our expert office cleaning services tailored to your needs.',
      Duration: 60,
      Is_Available: true,
      Image_URL: '/upload/services/image-1762381271337-218348372.jpg',
      Category: 'Residential & Commercial',
      createdAt: new Date('2025-11-08T19:34:40'),
      updatedAt: new Date('2025-11-08T19:34:40')
    }
  ],
  
  // Empty tables - structure preserved for future data
  bookings: [],
  products: [],
  orders: [],
  payments: [],
  gallery: []
};

/**
 * Hash password if it's plain text
 */
async function hashPasswordIfNeeded(password) {
  // Check if password is already hashed (bcrypt hashes start with $2b$)
  if (password.startsWith('$2b$') || password.startsWith('$2a$')) {
    return password;
  }
  // Hash plain text password
  return await bcrypt.hash(password, 10);
}

/**
 * Migrate admins to Firebase
 */
async function migrateAdmins() {
  console.log('\n📊 Migrating Admins...');
  
  for (const admin of mysqlData.admins) {
    try {
      // Hash password if needed
      const hashedPassword = await hashPasswordIfNeeded(admin.Password);
      
      const adminData = {
        Name: admin.Name,
        Email: admin.Email,
        Phone: admin.Phone,
        Password: hashedPassword,
        Role: admin.Role,
        First_Login: admin.First_Login,
        Is_Active: admin.Is_Active,
        Last_Login: admin.Last_Login,
        Login_Attempts: admin.Login_Attempts,
        Locked_Until: admin.Locked_Until,
        Created_By: admin.Created_By,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      };
      
      // Use the MySQL ID as the document ID
      await db.collection('admins').doc(admin.id).set(adminData);
      console.log(`✅ Migrated admin: ${admin.Email}`);
    } catch (error) {
      console.error(`❌ Error migrating admin ${admin.Email}:`, error.message);
    }
  }
}

/**
 * Migrate customers to Firebase
 */
async function migrateCustomers() {
  console.log('\n📊 Migrating Customers...');
  
  for (const customer of mysqlData.customers) {
    try {
      const customerData = {
        Full_Name: customer.Full_Name,
        Email: customer.Email,
        Password: customer.Password, // Already hashed
        Phone: customer.Phone,
        Address: customer.Address,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt
      };
      
      // Use the MySQL ID as the document ID
      await db.collection('customers').doc(customer.id).set(customerData);
      console.log(`✅ Migrated customer: ${customer.Email}`);
    } catch (error) {
      console.error(`❌ Error migrating customer ${customer.Email}:`, error.message);
    }
  }
}

/**
 * Migrate services to Firebase
 */
async function migrateServices() {
  console.log('\n📊 Migrating Services...');
  
  for (const service of mysqlData.services) {
    try {
      const serviceData = {
        Name: service.Name,
        Description: service.Description,
        Duration: service.Duration,
        Is_Available: service.Is_Available,
        Image_URL: service.Image_URL,
        Category: service.Category,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt
      };
      
      // Use the MySQL ID as the document ID
      await db.collection('services').doc(service.id).set(serviceData);
      console.log(`✅ Migrated service: ${service.Name}`);
    } catch (error) {
      console.error(`❌ Error migrating service ${service.Name}:`, error.message);
    }
  }
}

/**
 * Create empty collections for future data
 */
async function createEmptyCollections() {
  console.log('\n📊 Creating empty collections...');
  
  const collections = ['bookings', 'products', 'orders', 'payments', 'gallery'];
  
  for (const collectionName of collections) {
    try {
      // Create a placeholder document to initialize the collection
      const placeholderRef = db.collection(collectionName).doc('_placeholder');
      await placeholderRef.set({
        _placeholder: true,
        createdAt: new Date(),
        note: 'This is a placeholder document. It can be deleted once real data is added.'
      });
      console.log(`✅ Created collection: ${collectionName}`);
    } catch (error) {
      console.error(`❌ Error creating collection ${collectionName}:`, error.message);
    }
  }
}

/**
 * Verify migration
 */
async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  try {
    // Check admins
    const adminsSnapshot = await db.collection('admins').get();
    console.log(`✅ Admins: ${adminsSnapshot.size} documents`);
    
    // Check customers
    const customersSnapshot = await db.collection('customers').get();
    console.log(`✅ Customers: ${customersSnapshot.size} documents`);
    
    // Check services
    const servicesSnapshot = await db.collection('services').get();
    console.log(`✅ Services: ${servicesSnapshot.size} documents`);
    
    // Check other collections
    const bookingsSnapshot = await db.collection('bookings').get();
    console.log(`✅ Bookings: ${bookingsSnapshot.size} documents`);
    
    const productsSnapshot = await db.collection('products').get();
    console.log(`✅ Products: ${productsSnapshot.size} documents`);
    
    const ordersSnapshot = await db.collection('orders').get();
    console.log(`✅ Orders: ${ordersSnapshot.size} documents`);
    
    const paymentsSnapshot = await db.collection('payments').get();
    console.log(`✅ Payments: ${paymentsSnapshot.size} documents`);
    
    const gallerySnapshot = await db.collection('gallery').get();
    console.log(`✅ Gallery: ${gallerySnapshot.size} documents`);
    
  } catch (error) {
    console.error('❌ Error verifying migration:', error.message);
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 Starting MySQL to Firebase Migration...');
  console.log('=' .repeat(50));
  
  try {
    // Migrate data
    await migrateAdmins();
    await migrateCustomers();
    await migrateServices();
    
    // Create empty collections
    await createEmptyCollections();
    
    // Verify migration
    await verifyMigration();
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Admins: ${mysqlData.admins.length} migrated`);
    console.log(`   - Customers: ${mysqlData.customers.length} migrated`);
    console.log(`   - Services: ${mysqlData.services.length} migrated`);
    console.log(`   - Empty collections created: bookings, products, orders, payments, gallery`);
    console.log('\n✅ Your Firebase database is now ready!');
    console.log('\n🔐 Admin Login:');
    console.log(`   Email: admin@phambilimaafrica.com`);
    console.log(`   Password: Phambili@2023`);
    console.log('\n👤 Customer Login:');
    console.log(`   Email: m@gmail.com`);
    console.log(`   Password: (original password from MySQL)`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('\n✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
