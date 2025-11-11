# Firebase Storage CORS Configuration Guide

## Issue
Images uploaded to Firebase Storage cannot be displayed in the browser due to CORS (Cross-Origin Resource Sharing) policy blocking access.

**Error Message:**
```
Access to image at 'https://storage.googleapis.com/phambili-ma-africa-9c4ca.firebasestorage.app/...' 
from origin 'http://localhost:8000' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solution Options

### Option 1: Use Firebase Storage Rules (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `phambili-ma-africa-9c4ca`
3. Click **Storage** in the left sidebar
4. Click the **Rules** tab
5. Replace the rules with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      // Allow public read access to all files
      allow read: if true;
      
      // Allow authenticated users to write
      allow write: if request.auth != null;
    }
  }
}
```

6. Click **Publish**

### Option 2: Configure CORS via Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `phambili-ma-africa-9c4ca`
3. Open Cloud Shell (icon at top right)
4. Create a file called `cors.json`:

```bash
cat > cors.json << 'EOF'
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"]
  }
]
EOF
```

5. Apply CORS configuration:

```bash
gsutil cors set cors.json gs://phambili-ma-africa-9c4ca.firebasestorage.app
```

6. Verify CORS configuration:

```bash
gsutil cors get gs://phambili-ma-africa-9c4ca.firebasestorage.app
```

### Option 3: Make Files Public During Upload (Already Implemented)

The backend code already makes files public during upload. If images still don't load:

1. Go to Firebase Console → Storage
2. Click on a file
3. Click the **Permissions** tab
4. Ensure `allUsers` has the `Storage Object Viewer` role

## Testing

After applying the fix:

1. Hard refresh your browser (Cmd+Shift+R on Mac, Ctrl+Shift+F5 on Windows)
2. Try uploading a new service with an image
3. The image should now display correctly

## Current Status

✅ Image upload to Firebase Storage is working
✅ Images are being made public during upload
❌ CORS policy is blocking image display (needs fix above)

## Files Modified

- `backend/cors.json` - CORS configuration file (created)
- `backend/firebase-services/storageService.js` - Already makes files public
- `backend/controllers/serviceController.js` - Handles image upload gracefully
