#!/usr/bin/env node

/**
 * Update Firebase Storage Rules to Allow Public Read Access
 * This fixes the CORS issue preventing images from displaying
 */

const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin (uses existing serviceAccountKey.json)
if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'phambili-ma-africa-9c4ca.firebasestorage.app'
  });
}

const storageRules = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      // Allow public read access to all files
      allow read: if true;
      
      // Allow authenticated users to write
      allow write: if request.auth != null;
    }
  }
}`;

async function updateStorageRules() {
  console.log('🔧 Updating Firebase Storage Rules...\n');
  
  try {
    // Save rules to file for reference
    fs.writeFileSync('storage.rules', storageRules);
    console.log('✅ Storage rules saved to storage.rules');
    
    console.log('\n⚠️  IMPORTANT: Firebase Admin SDK cannot directly update Storage rules.');
    console.log('You need to apply these rules manually via Firebase Console:\n');
    console.log('1. Go to: https://console.firebase.google.com/');
    console.log('2. Select project: phambili-ma-africa-9c4ca');
    console.log('3. Click: Storage → Rules');
    console.log('4. Copy the rules from the file: storage.rules');
    console.log('5. Paste and click Publish\n');
    
    console.log('📄 Rules to apply:');
    console.log('─'.repeat(60));
    console.log(storageRules);
    console.log('─'.repeat(60));
    
    console.log('\n✅ After applying rules, images will display correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateStorageRules();
