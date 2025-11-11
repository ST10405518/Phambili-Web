# 🔧 Troubleshooting Guide

## ✅ Current Status

- ✅ **Backend**: Running on http://localhost:5000
- ✅ **CORS**: Fixed and configured
- ⚠️ **Frontend**: Missing image files
- ⚠️ **Script Error**: `originalText is not defined`

---

## 🚨 Issue 1: CORS Error (FIXED)

### Error:
```
Access to fetch at 'http://localhost:5000/api/auth/register' from origin 'http://localhost:8000' 
has been blocked by CORS policy
```

### ✅ Solution:
**Already fixed!** Backend now allows:
- `http://localhost:8000`
- `http://127.0.0.1:8000`
- Plus other common ports

### Verify:
```bash
curl http://localhost:5000/api/health
```

Should return: `{"status":"OK"}`

---

## 🖼️ Issue 2: Missing Images

### Error:
```
Failed to load resource: the server responded with a status of 404 (File not found)
```

### Missing Files:
- `/frontend/images/PM-LogoB.png` - Logo
- `/frontend/images/user.png` - User icon
- `/frontend/images/shopping-bag.png` - Cart icon
- `/frontend/images/menu.png` - Menu icon

### ✅ Quick Fix - Use Font Awesome Icons

Add to `<head>` in all HTML files:
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

Replace icons:
```html
<!-- User Icon -->
<i class="fas fa-user"></i>

<!-- Cart Icon -->
<i class="fas fa-shopping-bag"></i>

<!-- Menu Icon -->
<i class="fas fa-bars"></i>
```

See `frontend/MISSING_IMAGES_FIX.md` for complete guide.

---

## 🐛 Issue 3: JavaScript Error

### Error:
```javascript
ReferenceError: originalText is not defined at script.js:2420
```

### Location:
`frontend/js/script.js` line 2420

### ✅ Fix:
The variable `originalText` is used before being defined. Add this at the top of the function:

```javascript
// Around line 2380-2420 in script.js
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent; // ← ADD THIS LINE
    
    try {
      // ... rest of the code
    } catch (error) {
      // ... error handling
    } finally {
      submitBtn.textContent = originalText; // ← This line was failing
    }
  });
}
```

---

## 🔄 Issue 4: Carousel Not Found

### Error:
```
❌ No carousel elements found
```

### Cause:
The page doesn't have a carousel element, but the script is looking for it.

### ✅ Fix:
This is just a warning. Either:
1. Add a carousel to your page, or
2. Wrap the carousel code in a check:

```javascript
const carousel = document.querySelector('.carousel');
if (carousel) {
  // Initialize carousel
} else {
  console.log('ℹ️ No carousel on this page');
}
```

---

## 📋 Complete Startup Checklist

### 1. Start Backend
```bash
cd /Users/musawenkosibhebhe/Downloads/Phambili_Ma-AfricaWeb-master-5/backend
node server.js
```

**Expected output:**
```
✅ Firebase Firestore connection established successfully.
🚀 Server started on port 5000
✅ All 10 routes loaded successfully
```

### 2. Start Frontend
```bash
cd /Users/musawenkosibhebhe/Downloads/Phambili_Ma-AfricaWeb-master-5/frontend
python3 -m http.server 8000
```

**Or use Live Server in VS Code**

### 3. Test Backend
```bash
curl http://localhost:5000/api/health
```

### 4. Open Frontend
Open: http://localhost:8000

### 5. Check Browser Console
- No CORS errors ✅
- Image 404s (expected until you add icons) ⚠️
- JavaScript errors (fix originalText issue) ⚠️

---

## 🧪 Testing Your Setup

### Test 1: Health Check
```bash
curl http://localhost:5000/api/health
```
**Expected**: `{"status":"OK",...}`

### Test 2: Public Services
```bash
curl http://localhost:5000/api/public/services
```
**Expected**: JSON array of services (may be empty)

### Test 3: Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "Full_Name": "Test User",
    "Email": "test@example.com",
    "Password": "password123"
  }'
```
**Expected**: Success message with user data

### Test 4: Frontend Access
Open http://localhost:8000 in browser
**Expected**: Page loads (with missing image warnings)

---

## 🔍 Common Issues & Solutions

### Backend Won't Start

**Issue**: `Error: Cannot find module`
```bash
cd backend
pnpm install
```

**Issue**: `Port 5000 already in use`
```bash
lsof -ti:5000 | xargs kill -9
```

**Issue**: `Firebase credentials error`
- Check `backend/.env` exists
- Check `backend/serviceAccountKey.json` exists

### Frontend Issues

**Issue**: CORS errors
- ✅ Already fixed! Restart backend if needed

**Issue**: Images not loading
- See `frontend/MISSING_IMAGES_FIX.md`
- Use Font Awesome icons (recommended)

**Issue**: JavaScript errors
- Fix `originalText` undefined error (see above)
- Check browser console for details

### API Not Working

**Issue**: 404 errors on API calls
- Check backend is running: `curl http://localhost:5000/api/health`
- Check URL in frontend: should be `http://localhost:5000/api`

**Issue**: 401 Unauthorized
- User not logged in
- Token expired
- Check localStorage for token

**Issue**: 500 Internal Server Error
- Check backend terminal for error logs
- Check Firebase Console for database issues

---

## 📊 Quick Diagnostic

Run these commands to check everything:

```bash
# 1. Check if backend is running
curl http://localhost:5000/api/health

# 2. Check if frontend is accessible
curl http://localhost:8000

# 3. Check backend logs
# Look at terminal where you ran: node server.js

# 4. Check Firebase connection
# Backend should show: "✅ Firebase Firestore connection established"

# 5. Check browser console
# Open DevTools (F12) and check for errors
```

---

## 🆘 Still Having Issues?

### Check These:

1. **Backend Running?**
   ```bash
   lsof -i:5000
   ```
   Should show node process

2. **Frontend Running?**
   ```bash
   lsof -i:8000
   ```
   Should show python or node process

3. **Firebase Credentials?**
   ```bash
   ls backend/.env backend/serviceAccountKey.json
   ```
   Both files should exist

4. **Node Modules Installed?**
   ```bash
   ls backend/node_modules
   ```
   Should have many folders

5. **Browser Console?**
   - Open DevTools (F12)
   - Check Console tab
   - Check Network tab

---

## ✅ Success Checklist

- [x] Backend starts without errors
- [x] Backend shows "Firebase Firestore connection established"
- [x] `curl http://localhost:5000/api/health` returns OK
- [x] CORS errors fixed
- [ ] Fix `originalText` JavaScript error
- [ ] Add icons (Font Awesome recommended)
- [ ] Frontend loads in browser
- [ ] Can register new user
- [ ] Can login
- [ ] Can view services/products

---

## 🎯 Priority Fixes

### High Priority (Do Now):
1. ✅ Backend running - DONE
2. ✅ CORS fixed - DONE
3. ⏳ Fix `originalText` error in script.js
4. ⏳ Add Font Awesome for icons

### Medium Priority (Do Soon):
5. Test user registration
6. Test user login
7. Add actual logo image or design

### Low Priority (Optional):
8. Fix carousel warning
9. Optimize images
10. Add more features

---

## 📞 Quick Reference

- **Backend URL**: http://localhost:5000
- **Frontend URL**: http://localhost:8000
- **API Base**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health
- **Firebase Console**: https://console.firebase.google.com/project/phambili-ma-africa-9c4ca

---

**Your backend is working! Just need to fix the frontend icons and JavaScript error.** 🚀
