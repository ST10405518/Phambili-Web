# 📊 MySQL to Firebase Data Migration Guide

## Overview

This guide will help you migrate your existing MySQL data to Firebase Firestore.

---

## 📋 Your Current MySQL Data

Based on your SQL dump, you have:

### ✅ Data to Migrate:
- **1 Admin**: System Administrator (admin@phambilimaafrica.com)
- **1 Customer**: Musa (m@gmail.com)
- **1 Service**: Office Cleaning

### 📦 Empty Tables (Structure Only):
- Bookings
- Products
- Orders
- Payments
- Gallery

---

## 🚀 Quick Migration (Automated)

### Step 1: Run the Migration Script

```bash
cd /Users/musawenkosibhebhe/Downloads/Phambili_Ma-AfricaWeb-master-5/backend
node migrate-mysql-to-firebase.js
```

### Expected Output:

```
🚀 Starting MySQL to Firebase Migration...
==================================================

📊 Migrating Admins...
✅ Migrated admin: admin@phambilimaafrica.com

📊 Migrating Customers...
✅ Migrated customer: m@gmail.com

📊 Migrating Services...
✅ Migrated service: Office Cleaning

📊 Creating empty collections...
✅ Created collection: bookings
✅ Created collection: products
✅ Created collection: orders
✅ Created collection: payments
✅ Created collection: gallery

🔍 Verifying migration...
✅ Admins: 1 documents
✅ Customers: 1 documents
✅ Services: 1 documents
✅ Bookings: 1 documents (placeholder)
✅ Products: 1 documents (placeholder)
✅ Orders: 1 documents (placeholder)
✅ Payments: 1 documents (placeholder)
✅ Gallery: 1 documents (placeholder)

==================================================
🎉 Migration completed successfully!

📋 Summary:
   - Admins: 1 migrated
   - Customers: 1 migrated
   - Services: 1 migrated
   - Empty collections created: bookings, products, orders, payments, gallery

✅ Your Firebase database is now ready!
```

---

## 🔐 Login Credentials After Migration

### Admin Account:
- **Email**: `admin@phambilimaafrica.com`
- **Password**: `Phambili@2023`
- **Role**: Main Admin

### Customer Account:
- **Email**: `m@gmail.com`
- **Password**: (Your original password - already hashed in database)

---

## 🔍 Verify Migration in Firebase Console

### Step 1: Open Firebase Console
Go to: https://console.firebase.google.com/project/phambili-ma-africa-9c4ca/firestore

### Step 2: Check Collections

You should see these collections:

#### 1. **admins** Collection
```
Document ID: 1
Fields:
  - Name: "System Administrator"
  - Email: "admin@phambilimaafrica.com"
  - Password: (hashed)
  - Role: "main_admin"
  - Is_Active: true
  - createdAt: timestamp
```

#### 2. **customers** Collection
```
Document ID: 11
Fields:
  - Full_Name: "Musa"
  - Email: "m@gmail.com"
  - Password: (hashed)
  - createdAt: timestamp
```

#### 3. **services** Collection
```
Document ID: 1
Fields:
  - Name: "Office Cleaning"
  - Description: "Boost your workplace productivity..."
  - Duration: 60
  - Is_Available: true
  - Image_URL: "/upload/services/image-1762381271337-218348372.jpg"
  - Category: "Residential & Commercial"
  - createdAt: timestamp
```

#### 4. **Empty Collections** (with placeholder)
- bookings
- products
- orders
- payments
- gallery

---

## 🧪 Test Your Migration

### Test 1: Admin Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "Email": "admin@phambilimaafrica.com",
    "Password": "Phambili@2023"
  }'
```

**Expected**: Success with admin token

### Test 2: Customer Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "Email": "m@gmail.com",
    "Password": "YOUR_ORIGINAL_PASSWORD"
  }'
```

**Expected**: Success with customer token

### Test 3: Get Services

```bash
curl http://localhost:5000/api/public/services
```

**Expected**: Array with "Office Cleaning" service

---

## 📝 Field Mapping (MySQL → Firebase)

### MySQL → Firebase Field Names

Most fields remain the same, but note these changes:

| MySQL | Firebase | Notes |
|-------|----------|-------|
| `id` (int) | Document ID (string) | Auto-increment becomes Firebase ID |
| `created_at` | `createdAt` | Timestamp |
| `updated_at` | `updatedAt` | Timestamp |
| `is_available` | `Is_Available` | Boolean |
| `image_url` | `Image_URL` | String |

---

## 🔄 Adding More Data

### Option 1: Via Frontend
- Login as admin
- Use the admin dashboard to add:
  - More services
  - Products
  - Manage bookings

### Option 2: Via Firebase Console
1. Go to Firestore
2. Select a collection
3. Click "Add Document"
4. Fill in the fields

### Option 3: Via API
Use your backend API endpoints:
```bash
# Add a service
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "Name": "Deep Cleaning",
    "Description": "Thorough cleaning service",
    "Duration": 120,
    "Category": "Residential"
  }'
```

---

## ⚠️ Important Notes

### 1. Image URLs
Your service has this image URL:
```
/upload/services/image-1762381271337-218348372.jpg
```

This is a **local file path**. You have two options:

**Option A: Keep the image locally** (temporary)
- Copy the image to: `backend/public/upload/services/`
- It will be served by your backend

**Option B: Upload to Firebase Storage** (recommended)
- Upload the image via admin dashboard
- Firebase will generate a new URL
- Update the service with the new URL

### 2. Password Security
- Admin password is plain text in SQL: `Phambili@2023`
- Migration script will hash it automatically
- Customer password is already hashed (good!)

### 3. Empty Collections
- Placeholder documents created to initialize collections
- You can delete placeholders after adding real data
- Or leave them (they won't affect anything)

---

## 🐛 Troubleshooting

### Issue: Migration script fails

**Error**: "Cannot find module"
```bash
cd backend
pnpm install
```

**Error**: "Firebase credentials"
- Check `.env` file exists
- Check `serviceAccountKey.json` exists

### Issue: Login doesn't work after migration

**Admin login fails**:
- Try password: `Phambili@2023`
- Check Firebase Console for admin document
- Verify email is exactly: `admin@phambilimaafrica.com`

**Customer login fails**:
- Use the original MySQL password
- Password hash was preserved from MySQL

### Issue: Service image doesn't show

**Solution**:
1. Copy image from old server to `backend/public/upload/services/`
2. Or upload new image via admin dashboard
3. Or update Image_URL to use Firebase Storage URL

---

## 📊 Migration Checklist

- [ ] Run migration script
- [ ] Verify data in Firebase Console
- [ ] Test admin login
- [ ] Test customer login
- [ ] Test viewing services
- [ ] Copy/upload service images
- [ ] Add more services (if needed)
- [ ] Add products (if needed)
- [ ] Test creating bookings
- [ ] Test creating orders

---

## 🎯 Next Steps After Migration

### 1. Add More Content
- Add more services via admin dashboard
- Add products
- Upload gallery images

### 2. Update Service Image
- Upload the Office Cleaning image to Firebase Storage
- Or copy it to `backend/public/upload/services/`

### 3. Test All Features
- Create a test booking
- Create a test order
- Test payment flow

### 4. Clean Up
- Remove placeholder documents (optional)
- Update any hardcoded IDs in frontend

---

## 🔐 Security Reminder

After migration, update Firebase security rules (see `PRODUCTION_SECURITY_RULES.md`):

1. Go to Firebase Console
2. Update Firestore rules
3. Update Storage rules
4. Test with authenticated and unauthenticated requests

---

## 📞 Support

If migration fails:
1. Check backend terminal for errors
2. Check Firebase Console for data
3. Verify credentials in `.env`
4. Try manual data entry via Firebase Console

---

## ✅ Success Indicators

You'll know migration succeeded when:
- ✅ Firebase Console shows all collections
- ✅ Admin login works
- ✅ Customer login works
- ✅ Services appear on frontend
- ✅ No database errors in backend logs

---

**Ready to migrate? Run the script now!** 🚀

```bash
cd backend
node migrate-mysql-to-firebase.js
```
