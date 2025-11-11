# 🚀 Quick Start - Firebase Migration

## ⚡ 5-Minute Setup

### 1. Create Firebase Project (2 min)
```
1. Go to: https://console.firebase.google.com/
2. Click "Add project"
3. Enter name → Create
4. Enable Firestore Database (Test mode)
5. Enable Storage
6. Download service account key → Save as serviceAccountKey.json
```

### 2. Install & Configure (2 min)
```bash
cd backend
pnpm install
cp .env.firebase.example .env
# Edit .env with your Firebase credentials
```

### 3. Start Server (1 min)
```bash
pnpm run dev
```

✅ Look for: "Firebase Firestore connection established successfully"

---

## 📝 Quick Reference

### Environment Variables (.env)
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
JWT_SECRET=your-secret-key
```

### Service Methods
```javascript
// Customer
await customerService.create(data)
await customerService.findById(id)
await customerService.findByEmail(email)
await customerService.findAll()
await customerService.update(id, data)
await customerService.delete(id)

// Same pattern for:
// adminService, serviceService, productService
// bookingService, orderService, paymentService, galleryService
```

### File Upload
```javascript
const { upload, uploadToFirebase } = require('../middleware/firebaseUpload');

router.post('/upload', 
  upload.single('image'),
  uploadToFirebase('products'),
  controller.create
);

// In controller
const imageUrl = req.firebaseFileUrl;
```

---

## 🔧 Controller Update Pattern

### Before (MySQL)
```javascript
const { Customer } = require('../models');
const customer = await Customer.findByPk(id);
await customer.update(data);
```

### After (Firebase)
```javascript
const customerService = require('../firebase-services/customerService');
const customer = await customerService.findById(id);
await customerService.update(id, data);
```

---

## 📚 Full Documentation

- **Setup**: `FIREBASE_SETUP.md`
- **Migration**: `FIREBASE_MIGRATION_GUIDE.md`
- **Controllers**: `CONTROLLER_UPDATE_GUIDE.md`
- **Summary**: `MIGRATION_SUMMARY.md`

---

## 🆘 Troubleshooting

**"Could not load credentials"**
→ Check `serviceAccountKey.json` exists

**"Permission denied"**
→ Use Test mode in Firestore rules

**"Bucket not found"**
→ Check `FIREBASE_STORAGE_BUCKET` in `.env`

---

## ✅ Next Steps

1. ✅ Set up Firebase project
2. ✅ Install dependencies
3. ✅ Test connection
4. ⏳ Migrate data (if needed)
5. ⏳ Update controllers
6. ⏳ Test all endpoints
7. ⏳ Deploy

**Estimated Time**: 1-2 hours total

---

**Need help?** Read the detailed guides in the backend folder!
