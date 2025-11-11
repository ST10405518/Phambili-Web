/**
 * Check all Firebase collections
 */

const { db } = require('./firebaseConfig');

async function checkDatabase() {
  try {
    console.log('🔍 Checking Firebase database...\n');
    
    const collections = [
      'admins',
      'customers',
      'services',
      'products',
      'bookings',
      'orders',
      'payments',
      'gallery'
    ];
    
    for (const collectionName of collections) {
      try {
        const snapshot = await db.collection(collectionName).get();
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log(`\n📊 ${collectionName.toUpperCase()}:`);
        console.log(`   Total documents: ${docs.length}`);
        
        if (docs.length > 0) {
          console.log(`   Documents:`);
          docs.forEach((doc, index) => {
            if (index < 5) { // Show first 5
              const preview = JSON.stringify(doc).substring(0, 100);
              console.log(`   - ${doc.id}: ${preview}...`);
            }
          });
          if (docs.length > 5) {
            console.log(`   ... and ${docs.length - 5} more`);
          }
        } else {
          console.log(`   ⚠️  EMPTY COLLECTION`);
        }
      } catch (error) {
        console.error(`   ❌ Error reading ${collectionName}:`, error.message);
      }
    }
    
    console.log('\n✅ Database check complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
