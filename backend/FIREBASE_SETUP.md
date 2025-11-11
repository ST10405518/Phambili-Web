# Quick Firebase Setup Guide

## 🚀 Quick Start (5 minutes)

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" → Enter project name → Create

### 2. Enable Firestore
1. Click "Firestore Database" in left menu
2. Click "Create database"
3. Choose "Test mode" (for development) → Next
4. Select location → Enable

### 3. Enable Storage
1. Click "Storage" in left menu
2. Click "Get started"
3. Use default rules → Done

### 4. Get Credentials
1. Click ⚙️ (Settings) → Project settings
2. Go to "Service accounts" tab
3. Click "Generate new private key"
4. Save as `serviceAccountKey.json` in backend folder

### 5. Install Dependencies
```bash
cd backend
pnpm install
```

### 6. Configure Environment
Copy the example env file:
```bash
cp .env.firebase.example .env
```

Then edit `.env` with your Firebase credentials from `serviceAccountKey.json`:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
JWT_SECRET=your-secret-key
```

### 7. Start Server
```bash
pnpm run dev
```

You should see:
```
✅ Firebase Firestore connection established successfully.
🚀 Server started on port 5000
🔥 Using Firebase Firestore as database
📁 Using Firebase Storage for file uploads
```

## 📊 Firestore Collections

Your database will have these collections:
- `customers` - User accounts
- `admins` - Admin accounts  
- `services` - Service listings
- `products` - Product catalog
- `bookings` - Service bookings
- `orders` - Product orders
- `payments` - Payment records
- `gallery` - Gallery images

## 🔐 Security Rules (Production)

### Firestore Rules
Go to Firestore → Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read, authenticated write
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Storage Rules
Go to Storage → Rules:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 🔄 Migrating Existing Data

If you have existing MySQL data, use this script:

```javascript
// migrate.js
const mysql = require('mysql2/promise');
const { db } = require('./firebaseConfig');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  // Migrate customers
  const [customers] = await connection.execute('SELECT * FROM Customers');
  for (const customer of customers) {
    await db.collection('customers').add({
      Full_Name: customer.Full_Name,
      Email: customer.Email,
      Password: customer.Password,
      Phone: customer.Phone,
      Address: customer.Address,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  console.log(`Migrated ${customers.length} customers`);
  await connection.end();
}

migrate().catch(console.error);
```

Run with: `node migrate.js`

## 🧪 Testing

Test your endpoints:

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"Full_Name":"Test User","Email":"test@example.com","Password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"Email":"test@example.com","Password":"password123"}'
```

## 🐛 Troubleshooting

### "Could not load default credentials"
- Ensure `serviceAccountKey.json` exists in backend folder
- Or check all env variables are set correctly

### "Permission denied"
- Update Firestore security rules to allow access
- For development, use test mode

### "Storage bucket not found"
- Verify `FIREBASE_STORAGE_BUCKET` in `.env`
- Ensure Storage is enabled in Firebase Console

## 📚 Key Differences from MySQL

| MySQL/Sequelize | Firebase |
|----------------|----------|
| `Customer.findOne()` | `customerService.findByEmail()` |
| `Customer.create()` | `customerService.create()` |
| `customer.update()` | `customerService.update(id, data)` |
| `customer.destroy()` | `customerService.delete(id)` |
| Local file storage | Firebase Storage URLs |
| Auto-increment IDs | Firebase-generated IDs |

## 🎯 Next Steps

1. ✅ Test all API endpoints
2. ✅ Migrate existing data
3. ✅ Update frontend image URLs
4. ✅ Set production security rules
5. ✅ Enable Firebase Authentication (optional)
6. ✅ Set up Cloud Functions (optional)

## 📞 Support

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- [Storage Guide](https://firebase.google.com/docs/storage)

---

**Remember**: Never commit `serviceAccountKey.json` or `.env` to git!
