require('dotenv').config();
const { db } = require('../firebaseConfig');

async function clearAllProducts() {
  try {
    console.log('🔄 Starting to clear all products from Firebase...');

    const productsRef = db.collection('products');
    const snapshot = await productsRef.get();
    
    if (snapshot.empty) {
      console.log('ℹ️  No products found in database');
      return;
    }

    console.log(`📋 Found ${snapshot.size} products to delete`);

    // Delete all products
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      console.log(`  - Deleting product: ${doc.data().Name} (ID: ${doc.id})`);
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log('✅ All products deleted successfully!');
    console.log('🎉 Database is now clean - ready for fresh data');

  } catch (error) {
    console.error('❌ Failed to clear products:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the function
clearAllProducts()
  .then(() => {
    console.log('✅ Cleanup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });
