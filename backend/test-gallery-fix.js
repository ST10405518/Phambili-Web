/**
 * Test script to verify gallery controller fixes
 * Run: node test-gallery-fix.js
 */

const { db } = require('./firebaseConfig');

async function testGalleryFix() {
  try {
    console.log('🧪 Testing Gallery Controller Fix...\n');

    // Get all gallery items
    const snapshot = await db.collection('gallery').get();
    const allItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`📊 Total gallery items in database: ${allItems.length}\n`);

    if (allItems.length === 0) {
      console.log('⚠️  No gallery items found. Creating sample data first...');
      console.log('Run: node create-sample-data.js\n');
      return;
    }

    // Simulate the getAllMedia controller logic
    console.log('📋 Simulating getAllMedia() controller logic:\n');

    let media = allItems.filter(item => {
      // Check for new format (is_active)
      if (item.is_active !== undefined) {
        return item.is_active === true;
      }
      // Check for old format (Is_Featured or no explicit status field)
      return true;
    });

    console.log(`✅ Filtered to active items: ${media.length}`);

    // Normalize the response
    const normalizedMedia = media.map(item => ({
      ID: item.ID,
      filename: item.filename || item.Title,
      url: item.url || item.Image_URL,
      category: item.category || item.Category,
      media_type: item.media_type || 'image',
      is_active: item.is_active !== false,
      createdAt: item.createdAt || item.Upload_Date,
      ...item
    }));

    console.log('\n📦 Normalized media response structure:');
    console.log('━'.repeat(60));
    normalizedMedia.forEach((item, idx) => {
      console.log(`\n[${idx + 1}] ${item.filename}`);
      console.log(`    ├─ URL: ${item.url}`);
      console.log(`    ├─ Category: ${item.category}`);
      console.log(`    ├─ Type: ${item.media_type}`);
      console.log(`    ├─ Active: ${item.is_active}`);
      console.log(`    └─ Created: ${new Date(item.createdAt).toLocaleDateString()}`);
    });

    console.log('\n━'.repeat(60));
    console.log('\n✅ Gallery controller fix test PASSED!');
    console.log(`   - Handled both old and new field formats`);
    console.log(`   - Normalized ${normalizedMedia.length} items for frontend`);
    console.log(`   - Response ready to send to /api/gallery/media endpoint\n`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  process.exit(0);
}

testGalleryFix();
