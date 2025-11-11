# Service Availability Debug Guide

## Issue
Booking fails with "This service is currently unavailable" error.

## Possible Causes

### 1. Service `Is_Available` Field Issues
- Field might be `undefined`
- Field might be stored as string instead of boolean
- Field might be `false` or `0`

### 2. Debug Steps

#### Check Service in Admin Dashboard
1. Go to admin dashboard
2. Click "Services" tab
3. Find the service you're trying to book
4. Check if the toggle shows it as "Available" (green) or "Unavailable" (gray)
5. If unavailable, click the toggle to enable it

#### Check Backend Logs
When you try to book, the backend now logs:
```
🔍 SERVICE AVAILABILITY CHECK: {
  Name: 'Service Name',
  Is_Available: <actual_value>,
  Type: 'boolean' or 'string' or 'number',
  IsAvailable: true or false
}
```

Look for this in your backend terminal to see the actual value.

#### Manual Service Check (via API)
```bash
# Get all services
curl http://localhost:5001/api/services

# Look for your service and check Is_Available field
```

### 3. Quick Fix - Enable Service via Admin

**Option A: Via Admin Dashboard**
1. Login to admin dashboard
2. Go to Services tab
3. Find the service
4. Click the eye icon (toggle availability)
5. Should turn green = available

**Option B: Via API (if you know the service ID)**
```bash
curl -X PATCH http://localhost:5001/api/admin/services/YOUR_SERVICE_ID/availability \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"isAvailable": true}'
```

### 4. Code Fix Applied

The booking controller now accepts multiple formats:
- Boolean: `true` or `false`
- String: `"true"` or `"false"`
- Number: `1` or `0`

**File**: `backend/controllers/bookingController.js`
```javascript
// More lenient availability check
const isAvailable = service.Is_Available === true || 
                    service.Is_Available === 'true' || 
                    service.Is_Available === 1;
```

### 5. Verify Service Creation

When creating a service, `Is_Available` defaults to `true`:
```javascript
Is_Available: Is_Available !== undefined ? Is_Available : true
```

So new services should be available by default.

## Next Steps

1. **Check the backend logs** when you try to book - look for the debug output
2. **Check the admin dashboard** - verify the service shows as available
3. **Try toggling** the service off and on again in admin dashboard
4. **Report back** what the debug log shows for `Is_Available` value and type

## If Service Shows as Available but Still Fails

There might be another issue. Check:
- Service ID is correct
- Service exists in database
- No other validation errors
- Backend logs for other error messages
