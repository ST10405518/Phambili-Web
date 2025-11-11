/**
 * Remove placeholder documents from Firebase collections
 */

const { db } = require('./firebaseConfig');

async function removePlaceholders() {
  try {
    console.log('🧹 Removing placeholder documents...\n');
    
    const collections = ['bookings', 'products', 'orders', 'payments', 'gallery'];
    
    for (const collectionName of collections) {
      try {
        const placeholderDoc = await db.collection(collectionName).doc('_placeholder').get();
        
        if (placeholderDoc.exists) {
          await db.collection(collectionName).doc('_placeholder').delete();
          console.log(`✅ Removed placeholder from: ${collectionName}`);
        } else {
          console.log(`ℹ️  No placeholder in: ${collectionName}`);
        }
      } catch (error) {
        console.error(`❌ Error removing placeholder from ${collectionName}:`, error.message);
      }
    }
    
    console.log('\n✅ Placeholder cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

removePlaceholders()
  .then(() => {
    console.log('\n✅ Cleanup complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
