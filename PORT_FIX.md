# ✅ PORT CONFLICT FIXED!

## 🔧 Problem: macOS AirPlay Using Port 5000

Your backend couldn't start because **macOS AirPlay Receiver** was using port 5000.

---

## ✅ Solution: Changed to Port 5001

### What Was Changed:

1. **Backend Port**: Changed from 5000 → 5001
   - File: `backend/.env`
   - Line: `PORT=5001`

2. **Frontend API URL**: Updated to match
   - File: `frontend/js/script.js`
   - Line: `this.baseURL = 'http://localhost:5001/api'`

---

## 🚀 Your New URLs

### Backend:
- **API Base**: http://localhost:5001/api
- **Health Check**: http://localhost:5001/api/health
- **Login**: http://localhost:5001/api/auth/login
- **Services**: http://localhost:5001/api/public/services

### Frontend:
- **Website**: http://localhost:8000 (unchanged)

---

## ✅ Everything Works Now!

### Test Results:
```bash
# Health check
curl http://localhost:5001/api/health
✅ {"status":"OK"}

# Services
curl http://localhost:5001/api/public/services
✅ Returns "Office Cleaning" service
```

---

## 🔄 How to Restart

### Backend:
```bash
cd backend
node server.js
```

**Expected output:**
```
🚀 Server started on port 5001
✅ Firebase Firestore connection established
```

### Frontend:
```bash
cd frontend
python3 -m http.server 8000
```

---

## 🧪 Test Your Website Now

### 1. Refresh Your Browser
- Go to: http://localhost:8000
- Hard refresh: `Cmd + Shift + R`

### 2. Test Login
- Go to: http://localhost:8000/login.html
- Try admin login:
  - Email: `admin@phambilimaafrica.com`
  - Password: `Phambili@2023`

### 3. Test Registration
- Go to: http://localhost:8000/login.html
- Click "Sign Up"
- Fill in the form
- Submit

### 4. View Services
- Go to: http://localhost:8000/services.html
- You should see "Office Cleaning"

---

## 🐛 If Services Still Don't Load

### Clear Browser Cache:
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

### Or:
```bash
# In Chrome/Safari
Cmd + Shift + Delete
→ Clear cached images and files
```

---

## 📝 Why This Happened

macOS uses port 5000 for **AirPlay Receiver** by default.

### To Permanently Disable AirPlay on Port 5000:
1. System Settings → General → AirDrop & Handoff
2. Turn off "AirPlay Receiver"

**Or just use port 5001** (recommended - no system changes needed)

---

## ✅ Status

- ✅ Backend running on port 5001
- ✅ Frontend updated to use port 5001
- ✅ Services loading correctly
- ✅ Login/Register should work now

---

## 🎯 Next Steps

1. **Refresh your browser** (hard refresh!)
2. **Test login** with admin credentials
3. **Test registration** with a new account
4. **View services** - should load instantly

---

**Your website should work perfectly now!** 🎉

**Backend**: http://localhost:5001  
**Frontend**: http://localhost:8000
