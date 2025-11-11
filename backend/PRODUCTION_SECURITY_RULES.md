# 🔐 Production Security Rules for Firebase

## Overview

Before deploying to production, you MUST update your Firebase security rules. The default "test mode" rules allow anyone to read/write your data!

---

## ⚠️ CRITICAL: Current Status

If you set up Firebase in "test mode", your current rules expire after 30 days and allow **anyone** to access your data!

**Check your rules NOW**: https://console.firebase.google.com/project/phambili-ma-africa-9c4ca/firestore/rules

---

## 🔥 Firestore Security Rules

### Step 1: Go to Firestore Rules

1. Open [Firebase Console](https://console.firebase.google.com/project/phambili-ma-africa-9c4ca/firestore/rules)
2. Click on "Firestore Database" → "Rules"

### Step 2: Replace with Production Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isSignedIn() && 
             exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    // Public read access for services and products
    match /services/{serviceId} {
      allow read: if true; // Anyone can view services
      allow write: if isAdmin(); // Only admins can modify
    }
    
    match /products/{productId} {
      allow read: if true; // Anyone can view products
      allow write: if isAdmin(); // Only admins can modify
    }
    
    // Gallery - public read, admin write
    match /gallery/{galleryId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Customers - users can only access their own data
    match /customers/{customerId} {
      allow read: if isOwner(customerId) || isAdmin();
      allow create: if true; // Allow registration
      allow update: if isOwner(customerId) || isAdmin();
      allow delete: if isAdmin();
    }
    
    // Admins - only admins can access
    match /admins/{adminId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }
    
    // Bookings - customers can access their own, admins can access all
    match /bookings/{bookingId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn();
      allow delete: if isAdmin();
    }
    
    // Orders - customers can access their own, admins can access all
    match /orders/{orderId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn();
      allow delete: if isAdmin();
    }
    
    // Payments - restricted access
    match /payments/{paymentId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // Health check collection (for server startup)
    match /_health_check/{document} {
      allow read, write: if true;
    }
  }
}
```

### Step 3: Publish Rules

Click "Publish" to activate the new rules.

---

## 📁 Firebase Storage Security Rules

### Step 1: Go to Storage Rules

1. Open [Firebase Console](https://console.firebase.google.com/project/phambili-ma-africa-9c4ca/storage/rules)
2. Click on "Storage" → "Rules"

### Step 2: Replace with Production Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isSignedIn() && 
             firestore.get(/databases/(default)/documents/admins/$(request.auth.uid)).data != null;
    }
    
    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }
    
    function isValidSize() {
      return request.resource.size < 10 * 1024 * 1024; // 10MB
    }
    
    // Products - public read, admin write
    match /products/{imageId} {
      allow read: if true; // Anyone can view
      allow write: if isAdmin() && isImage() && isValidSize();
      allow delete: if isAdmin();
    }
    
    // Services - public read, admin write
    match /services/{imageId} {
      allow read: if true; // Anyone can view
      allow write: if isAdmin() && isImage() && isValidSize();
      allow delete: if isAdmin();
    }
    
    // Gallery - public read, admin write
    match /gallery/{imageId} {
      allow read: if true; // Anyone can view
      allow write: if isAdmin() && isImage() && isValidSize();
      allow delete: if isAdmin();
    }
    
    // General uploads - authenticated users only
    match /general/{imageId} {
      allow read: if true;
      allow write: if isSignedIn() && isImage() && isValidSize();
      allow delete: if isAdmin();
    }
    
    // Deny all other paths
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 3: Publish Rules

Click "Publish" to activate the new rules.

---

## 🧪 Testing Your Rules

### Test Firestore Rules

```bash
# Try to read services (should work)
curl http://localhost:5000/api/public/services

# Try to create service without auth (should fail)
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -d '{"Name":"Test","Duration":60}'

# Try to create service with admin auth (should work)
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"Name":"Test","Duration":60}'
```

### Test Storage Rules

1. Try uploading without authentication (should fail)
2. Try uploading with admin authentication (should work)
3. Try accessing uploaded images (should work for everyone)

---

## 🔒 Additional Security Measures

### 1. Environment Variables

Ensure these are set securely:

```env
# NEVER commit these to git!
JWT_SECRET=use-a-strong-random-secret-here
FIREBASE_PRIVATE_KEY="..."
```

### 2. Rate Limiting

Your backend already has rate limiting via `express-rate-limit`. Verify it's configured:

```javascript
// In server.js or middleware/security.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 3. CORS Configuration

Update CORS for production domains:

```javascript
// In server.js
app.use(cors({
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    // Remove localhost in production
  ],
  credentials: true
}));
```

### 4. HTTPS Only

Ensure your production server uses HTTPS:

```javascript
// Add to server.js for production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### 5. Helmet Configuration

Your server already uses Helmet. Verify it's properly configured:

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "https://storage.googleapis.com"],
      // Add other directives as needed
    }
  }
}));
```

---

## 📊 Security Checklist

Before going to production:

### Firebase Security
- [ ] Updated Firestore security rules
- [ ] Updated Storage security rules
- [ ] Tested rules with authenticated and unauthenticated requests
- [ ] Removed test mode expiration

### Application Security
- [ ] Strong JWT_SECRET in production
- [ ] CORS limited to production domains
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Helmet configured
- [ ] Environment variables secured

### Credentials
- [ ] `serviceAccountKey.json` NOT in git
- [ ] `.env` NOT in git
- [ ] Production secrets stored securely (e.g., environment variables in hosting platform)

### Monitoring
- [ ] Firebase Console monitoring enabled
- [ ] Error logging configured
- [ ] Usage alerts set up
- [ ] Budget alerts configured

---

## 🚨 Common Security Mistakes to Avoid

### ❌ DON'T:
1. Leave test mode rules in production
2. Commit `serviceAccountKey.json` to git
3. Use weak JWT secrets
4. Allow unlimited file uploads
5. Skip input validation
6. Expose error details to clients
7. Use `allow read, write: if true` in production

### ✅ DO:
1. Use proper authentication checks
2. Validate all inputs
3. Limit file sizes and types
4. Use HTTPS everywhere
5. Monitor Firebase usage
6. Set up budget alerts
7. Regularly review security rules

---

## 📈 Monitoring & Alerts

### Set Up Firebase Alerts

1. Go to [Firebase Console](https://console.firebase.google.com/project/phambili-ma-africa-9c4ca)
2. Click "Usage and billing"
3. Set up alerts for:
   - Storage usage
   - Database reads/writes
   - Bandwidth usage
   - Budget limits

### Monitor Security Events

Check Firebase Console regularly for:
- Failed authentication attempts
- Unusual access patterns
- Spike in reads/writes
- Storage usage trends

---

## 🔄 Regular Security Maintenance

### Monthly Tasks:
- [ ] Review Firebase usage logs
- [ ] Check for unusual activity
- [ ] Update dependencies
- [ ] Review security rules

### Quarterly Tasks:
- [ ] Audit user permissions
- [ ] Review admin accounts
- [ ] Test disaster recovery
- [ ] Update security documentation

---

## 📞 Security Resources

- **Firebase Security Rules**: https://firebase.google.com/docs/rules
- **Security Best Practices**: https://firebase.google.com/docs/rules/best-practices
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/

---

## 🆘 If You're Hacked

1. **Immediately** disable Firebase access
2. Rotate all secrets (JWT_SECRET, Firebase keys)
3. Review Firebase audit logs
4. Update security rules
5. Notify affected users
6. Contact Firebase support

---

## ✅ Quick Security Test

Run this after updating rules:

```bash
# Should work (public read)
curl http://localhost:5000/api/public/services

# Should fail (no auth)
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -d '{"Name":"Test"}'

# Should work (with admin token)
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"Name":"Test","Duration":60}'
```

---

**Security is not optional!** Update these rules before deploying to production! 🔒
