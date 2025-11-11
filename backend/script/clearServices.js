require('dotenv').config();
const { db } = require('../firebaseConfig');

async function clearAllServices() {
  try {
    console.log('🔄 Starting to clear all services from Firebase...');

    const servicesRef = db.collection('services');
    const snapshot = await servicesRef.get();
    
    if (snapshot.empty) {
      console.log('ℹ️  No services found in database');
      return;
    }

    console.log(`📋 Found ${snapshot.size} services to delete`);

    // Delete all services
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      console.log(`  - Deleting service: ${doc.data().Name} (ID: ${doc.id})`);
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log('✅ All services deleted successfully!');
    console.log('🎉 Database is now clean - ready for fresh data');

  } catch (error) {
    console.error('❌ Failed to clear services:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the function
clearAllServices()
  .then(() => {
    console.log('✅ Cleanup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });
