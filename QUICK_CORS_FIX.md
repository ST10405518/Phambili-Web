# 🚀 Quick CORS Fix - 2 Minutes

## The Problem
Images upload but don't display ❌

## The Solution (Choose One)

### ⭐ EASIEST: Firebase Console (Recommended)

1. Open: https://console.firebase.google.com/
2. Select: `phambili-ma-africa-9c4ca`
3. Click: **Storage** → **Rules**
4. Paste this:

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

5. Click: **Publish**
6. Wait: 1-2 minutes
7. Refresh browser: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+F5** (Windows)

### ✅ Done! Images should now display.

---

## Alternative: Google Cloud Shell

```bash
# 1. Open Cloud Shell at console.cloud.google.com
# 2. Run these commands:

cat > cors.json << 'EOF'
[
  {
    "origin": ["*"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set cors.json gs://phambili-ma-africa-9c4ca.firebasestorage.app
```

---

## Verify It Works

1. Go to admin dashboard
2. Upload a service with an image
3. Image should display immediately
4. No more CORS errors in console

---

## Still Not Working?

1. Wait 2-3 minutes for rules to propagate
2. Clear browser cache completely
3. Try incognito/private window
4. Check Firebase Console → Storage → Rules shows your new rules
