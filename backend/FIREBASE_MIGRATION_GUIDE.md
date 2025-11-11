# Firebase Migration Guide

This guide will help you migrate your backend from MySQL/phpMyAdmin to Firebase.

## Prerequisites

1. **Firebase Account**: Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. **Node.js**: Ensure you have Node.js installed (v14 or higher)

## Step 1: Set Up Firebase Project

### 1.1 Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter your project name
4. Enable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Firestore Database
1. In your Firebase project, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode" or "Start in test mode" (for development)
4. Select your database location
5. Click "Enable"

### 1.3 Enable Firebase Storage
1. In your Firebase project, go to "Storage"
2. Click "Get started"
3. Review the security rules
4. Click "Done"

### 1.4 Get Service Account Key
1. Go to Project Settings (gear icon) > Service Accounts
2. Click "Generate new private key"
3. Save the JSON file as `serviceAccountKey.json` in your backend folder
4. **IMPORTANT**: Add `serviceAccountKey.json` to your `.gitignore` file

## Step 2: Update Environment Variables

Create or update your `.env` file in the backend folder:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-client-email@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-client-email
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# JWT Secret (keep your existing one)
JWT_SECRET=your-jwt-secret-key

# Server Configuration
PORT=5000
NODE_ENV=development
```

**Note**: You can find all these values in your `serviceAccountKey.json` file.

## Step 3: Install Dependencies

Run the following command in your backend folder:

```bash
pnpm install
```

This will install the new Firebase dependencies:
- `firebase` - Firebase client SDK
- `firebase-admin` - Firebase Admin SDK for server-side operations

## Step 4: Migrate Your Data

### Option A: Manual Migration (Recommended for small datasets)

1. Export your MySQL data to JSON format
2. Use the Firebase Console to import data into Firestore collections

### Option B: Automated Migration Script

Create a migration script to transfer data from MySQL to Firebase:

```javascript
// migration-script.js (example)
const mysql = require('mysql2/promise');
const { db } = require('./firebaseConfig');

async function migrateData() {
  // Connect to MySQL
  const connection = await mysql.createConnection({
    host: 'your-mysql-host',
    user: 'your-mysql-user',
    password: 'your-mysql-password',
    database: 'your-database-name'
  });

  // Migrate Customers
  const [customers] = await connection.execute('SELECT * FROM Customers');
  for (const customer of customers) {
    await db.collection('customers').doc(customer.ID.toString()).set({
      Full_Name: customer.Full_Name,
      Email: customer.Email,
      Password: customer.Password,
      Phone: customer.Phone,
      Address: customer.Address,
      createdAt: customer.Created_At || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  // Repeat for other collections...
  console.log('Migration complete!');
  await connection.end();
}

migrateData();
```

## Step 5: Update Controllers

Replace the old controllers with Firebase-enabled versions:

1. **Backup your current controllers** (rename them with `.old` extension)
2. **Replace imports**: Change from Sequelize models to Firebase services

Example:
```javascript
// Old (MySQL/Sequelize)
const { Customer, Admin } = require('../models');

// New (Firebase)
const customerService = require('../firebase-services/customerService');
const adminService = require('../firebase-services/adminService');
```

3. **Update method calls**: Replace Sequelize methods with Firebase service methods

Example:
```javascript
// Old
const customer = await Customer.findOne({ where: { Email } });

// New
const customer = await customerService.findByEmail(Email);
```

## Step 6: Update File Uploads

Replace local file storage with Firebase Storage:

```javascript
// Old (local storage)
const filePath = path.join(__dirname, 'public/upload', folder, filename);
fs.writeFileSync(filePath, fileBuffer);

// New (Firebase Storage)
const storageService = require('../firebase-services/storageService');
const fileUrl = await storageService.uploadFile(fileBuffer, filename, folder);
```

## Step 7: Update Firestore Security Rules

In Firebase Console, go to Firestore Database > Rules and set appropriate security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access only to authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // More specific rules for production
    match /customers/{customerId} {
      allow read, write: if request.auth.uid == customerId;
    }
    
    match /admins/{adminId} {
      allow read, write: if request.auth.token.admin == true;
    }
  }
}
```

## Step 8: Update Storage Security Rules

In Firebase Console, go to Storage > Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true; // Public read access
      allow write: if request.auth != null; // Only authenticated users can upload
    }
  }
}
```

## Step 9: Test Your Application

1. Start your server:
```bash
pnpm run dev
```

2. Test the following endpoints:
   - Registration: `POST /api/auth/register`
   - Login: `POST /api/auth/login`
   - Get profile: `GET /api/auth/profile`
   - File upload: Test product/service image uploads

3. Check Firebase Console to verify data is being saved correctly

## Step 10: Update Frontend (if needed)

Your frontend should continue to work without changes since the API endpoints remain the same. However, you may want to:

1. Update image URLs to use Firebase Storage URLs
2. Handle any differences in response formats

## Collections Structure in Firestore

Your Firestore database will have the following collections:

- `customers` - Customer accounts
- `admins` - Admin accounts
- `services` - Service listings
- `products` - Product listings
- `bookings` - Service bookings
- `orders` - Product orders
- `payments` - Payment records
- `gallery` - Gallery images

## Troubleshooting

### Error: "Could not load the default credentials"
- Make sure `serviceAccountKey.json` exists in your backend folder
- Or ensure all Firebase environment variables are set correctly in `.env`

### Error: "Permission denied"
- Check your Firestore security rules
- Ensure you're using the correct authentication

### Files not uploading
- Verify Firebase Storage is enabled
- Check Storage security rules
- Ensure the storage bucket name is correct in your `.env`

## Rollback Plan

If you need to rollback to MySQL:

1. Rename controllers back (remove `.old` extension)
2. Update `package.json` to use MySQL dependencies
3. Update `server.js` to use `sequelize` instead of `firebaseConfig`
4. Run `pnpm install`

## Benefits of Firebase

✅ **No server management** - Firebase handles scaling automatically
✅ **Real-time updates** - Get live data updates
✅ **Better security** - Built-in authentication and security rules
✅ **Global CDN** - Fast file delivery worldwide
✅ **Cost-effective** - Pay only for what you use
✅ **Easy backups** - Automated backups available

## Next Steps

1. Set up Firebase Authentication for better user management
2. Implement Cloud Functions for server-side logic
3. Add Firebase Analytics for user insights
4. Set up Firebase Hosting for your frontend

## Support

For issues or questions:
- Firebase Documentation: https://firebase.google.com/docs
- Firebase Support: https://firebase.google.com/support

---

**Important**: Remember to keep your `serviceAccountKey.json` and `.env` files secure and never commit them to version control!
