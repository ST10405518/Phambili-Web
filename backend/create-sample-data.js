/**
 * Create sample data for all collections
 * This will make all collections visible in Firebase Console
 */

const { db } = require('./firebaseConfig');

async function createSampleData() {
  try {
    console.log('🚀 Creating sample data for all collections...\n');

    // 1. Sample Product
    console.log('📦 Creating sample product...');
    const productRef = await db.collection('products').add({
      Name: 'All-Purpose Cleaner',
      Description: 'Eco-friendly all-purpose cleaning solution. Safe for all surfaces.',
      Price: 49.99,
      Stock_Quantity: 100,
      Category: 'Cleaning Supplies',
      Is_Available: true,
      Image_URL: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Product created:', productRef.id);

    // 2. Sample Booking
    console.log('\n📅 Creating sample booking...');
    const bookingRef = await db.collection('bookings').add({
      Customer_ID: '11', // Musa's ID
      Service_ID: '1', // Office Cleaning
      Date: '2025-11-15',
      Time: '10:00',
      Status: 'requested',
      Address: '123 Main Street, Johannesburg, 2000',
      Special_Instructions: 'Please call before arriving',
      Property_Type: 'Residential',
      Property_Size: 'Medium',
      Cleaning_Frequency: 'One-time',
      Quoted_Amount: null,
      admin_notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Booking created:', bookingRef.id);

    // 3. Sample Order
    console.log('\n🛒 Creating sample order...');
    const orderRef = await db.collection('orders').add({
      Customer_ID: '11',
      Product_ID: productRef.id,
      Quantity: 2,
      Total_Amount: 99.98,
      Status: 'pending',
      Payment_Status: 'unpaid',
      Delivery_Address: '123 Main Street, Johannesburg, 2000',
      Order_Date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Order created:', orderRef.id);

    // 4. Sample Payment
    console.log('\n💳 Creating sample payment...');
    const paymentRef = await db.collection('payments').add({
      Booking_ID: bookingRef.id,
      Customer_ID: '11',
      Amount: 500.00,
      Payment_Method: 'credit_card',
      Payment_Status: 'pending',
      Transaction_ID: null,
      Payment_Date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Payment created:', paymentRef.id);

    // 5. Sample Gallery Item
    console.log('\n🖼️  Creating sample gallery item...');
    const galleryRef = await db.collection('gallery').add({
      filename: 'Office Cleaning Project',
      description: 'Professional office cleaning service completed',
      url: '/images/sample-gallery.jpg',
      category: 'Commercial',
      media_type: 'image',
      is_active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Gallery item created:', galleryRef.id);

    console.log('\n✅ All sample data created successfully!');
    console.log('\n📊 Summary:');
    console.log('   - 1 Product');
    console.log('   - 1 Booking');
    console.log('   - 1 Order');
    console.log('   - 1 Payment');
    console.log('   - 1 Gallery item');
    console.log('\n🎉 All collections should now be visible in Firebase Console!');
    console.log('🔗 Visit: https://console.firebase.google.com/project/phambili-ma-africa-9c4ca/firestore');

  } catch (error) {
    console.error('❌ Error creating sample data:', error.message);
    console.error(error);
  }
}

createSampleData()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
