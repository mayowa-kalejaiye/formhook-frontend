# Browser Push Notifications Implementation

## ✅ Status Check

### Change Password Functionality
**Status:** ✅ **FULLY FUNCTIONAL - NOT HARDCODED**

The change password feature is properly implemented:
- **Frontend:** `src/pages/account.tsx` (line 255-297)
- **API Service:** `src/services/api.ts` (line 724-746)
- **Endpoint:** `POST /user/change-password`
- **Validation:** 
  - Checks if new passwords match
  - Requires minimum 8 characters
  - Requires current password for verification
- **Security:** Uses `fetchWithAuth()` with JWT token

**Request Format:**
```json
{
  "current_password": "old_password",
  "new_password": "new_password"
}
```

---

## 🔔 Push Notifications

### Overview
Browser push notifications provide real-time alerts even when the user doesn't have the website open. This implementation uses the Web Push API and service workers.

### Architecture

```
User Browser                     FormHook Frontend              Backend Server
     │                                  │                              │
     ├──1. Enable Push────────────────>│                              │
     │                                  ├──2. Request Permission       │
     │<─────────────────────────────────┤                              │
     │                                  │                              │
     ├──3. Permission Granted────────>│                              │
     │                                  ├──4. Register Service Worker │
     │                                  ├──5. Subscribe to Push       │
     │                                  │                              │
     │                                  ├──6. Send Subscription───────>│
     │                                  │                              │
     │                                  │      7. Store Subscription   │
     │                                  │      8. Event Occurs         │
     │<─────────────────────────────────┼──────9. Send Push Message───┤
     │                                  │                              │
     10. Show Notification             │                              │
```

### Files Created

1. **`src/utils/pushNotifications.ts`**
   - Core push notification utilities
   - Browser API wrappers
   - Permission management
   - Subscription handling

2. **`public/sw.js`**
   - Service worker for push events
   - Notification display logic
   - Click/close event handlers
   - Offline support (optional)

3. **`src/components/PushNotificationSettings.tsx`**
   - UI component for managing push notifications
   - Enable/disable toggle
   - Test notification button
   - Permission status display

4. **`public/manifest.json`**
   - PWA manifest for icons
   - App metadata

### VAPID Public Key

The public key is hardcoded in the frontend for reliability:

```typescript
// In src/components/PushNotificationSettings.tsx
const VAPID_PUBLIC_KEY = 'BFmPO84FW8CdRE3UFwSaAWxe1_PzRUegDGCfRG5ggqws2WDWCAmI7xutf3JQrwFLSsNjjRD_VJ8xNqbR9O8CFMw';
```

The component will try to fetch the key from the backend first, but will use this hardcoded fallback if the endpoint is not available yet.

### API Endpoints Added

#### 1. `POST /notifications/push/subscribe`
Store user's push subscription

**Request:**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

**Response:**
```json
{
  "success": true
}
```

#### 2. `POST /notifications/push/unsubscribe`
Remove user's push subscription

**Request:**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

**Response:**
```json
{
  "success": true
}
```

#### 3. `GET /notifications/push/vapid-key`
Get VAPID public key for subscription

**Response:**
```json
{
  "publicKey": "BEl62iUYgUivxIkv69yViEuiBIa-Ib..."
}
```

### Backend Requirements

#### 1. VAPID Keys Generation

VAPID (Voluntary Application Server Identification) keys are required for web push.

**Generate Keys (Node.js):**
```javascript
const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
```

**Store in Environment:**
```bash
VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa...
VAPID_PRIVATE_KEY=bdSiGcITKnyQxqkWvOq3HEJP...
VAPID_SUBJECT=mailto:admin@formhook.com
```

#### 2. Database Schema

```sql
CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
```

#### 3. Backend Implementation (Python/FastAPI Example)

```python
from pywebpush import webpush, WebPushException
import json

# Store subscription
@app.post("/notifications/push/subscribe")
async def subscribe_to_push(
    subscription: dict,
    current_user: User = Depends(get_current_user)
):
    await db.push_subscriptions.insert({
        "user_id": current_user.id,
        "endpoint": subscription["endpoint"],
        "p256dh": subscription["keys"]["p256dh"],
        "auth": subscription["keys"]["auth"]
    })
    return {"success": True}

# Send push notification
async def send_push_notification(user_id: str, notification_data: dict):
    # Get all subscriptions for user
    subscriptions = await db.push_subscriptions.find({"user_id": user_id})
    
    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub["endpoint"],
                    "keys": {
                        "p256dh": sub["p256dh"],
                        "auth": sub["auth"]
                    }
                },
                data=json.dumps(notification_data),
                vapid_private_key=os.getenv("VAPID_PRIVATE_KEY"),
                vapid_claims={
                    "sub": os.getenv("VAPID_SUBJECT")
                }
            )
            
            # Update last_used
            await db.push_subscriptions.update(
                {"id": sub["id"]},
                {"last_used": datetime.now()}
            )
        except WebPushException as e:
            print(f"Push failed: {e}")
            # If subscription expired/invalid, remove it
            if e.response.status_code in [404, 410]:
                await db.push_subscriptions.delete({"id": sub["id"]})

# Trigger push on events
@app.post("/forms/{form_id}/submissions")
async def create_submission(form_id: str, data: dict):
    # ... create submission ...
    
    # Send push notification to form owner
    await send_push_notification(
        form.owner_id,
        {
            "title": f"New submission for {form.name}",
            "message": f"Received submission from {data.get('email', 'Anonymous')}",
            "type": "submission",
            "metadata": {
                "formId": form_id,
                "submissionId": submission.id
            },
            "url": f"/forms/{form_id}",
            "icon": "/icon-192x192.png"
        }
    )
```

### Frontend Usage

#### Enable Push Notifications

The component is already integrated into `/notifications` page. Users can:

1. Click "Enable Push Notifications" button
2. Allow permission in browser prompt
3. Service worker registers automatically
4. Subscription sent to backend
5. Test notification shown

#### Notification Data Format

When backend sends push notifications, use this format:

```json
{
  "title": "New Form Submission",
  "message": "Contact Form received a new submission",
  "type": "submission",
  "icon": "/icon-192x192.png",
  "badge": "/badge-72x72.png",
  "tag": "submission-123",
  "url": "/forms/form-456",
  "metadata": {
    "formId": "form-456",
    "submissionId": "sub-789"
  },
  "requireInteraction": false
}
```

### Service Worker Events

The service worker handles:

1. **Push Event** - Incoming notification
2. **Notification Click** - User clicks notification
3. **Notification Close** - User dismisses notification
4. **Install** - First time service worker installs
5. **Activate** - Service worker activates
6. **Fetch** - Optional offline support

### Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Yes | Full support |
| Firefox | ✅ Yes | Full support |
| Edge | ✅ Yes | Full support |
| Safari | ⚠️ Partial | macOS/iOS 16.4+ |
| Opera | ✅ Yes | Full support |
| IE | ❌ No | Not supported |

### Testing

#### Manual Testing

1. **Enable Notifications:**
   - Go to `/notifications`
   - Click "Enable Push Notifications"
   - Allow permission
   - See test notification

2. **Test from Backend:**
   ```bash
   curl -X POST https://your-backend.com/admin/test-push \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": "user-123",
       "title": "Test Notification",
       "message": "This is a test"
     }'
   ```

3. **Check Service Worker:**
   - Open DevTools → Application → Service Workers
   - Should see "sw.js" registered and active

4. **View Push Subscription:**
   - DevTools → Application → Service Workers → Push Messaging
   - Should show subscription details

#### Automated Testing

```javascript
// Test notification permission
describe('Push Notifications', () => {
  it('should request permission', async () => {
    const permission = await requestNotificationPermission();
    expect(['granted', 'denied', 'default']).toContain(permission);
  });

  it('should subscribe to push', async () => {
    const subscription = await subscribeToPushNotifications(VAPID_KEY);
    expect(subscription).toHaveProperty('endpoint');
  });
});
```

### Security Considerations

1. **VAPID Keys:** Keep private key secret, never expose in frontend
2. **User Consent:** Always request permission, respect user choice
3. **Rate Limiting:** Limit push notifications to avoid spam
4. **Subscription Validation:** Verify subscriptions belong to authenticated users
5. **Content Security:** Validate notification content before sending
6. **Privacy:** Don't include sensitive data in push payloads

### Performance

- **Service Worker:** Lightweight, minimal impact
- **Push Messages:** < 4KB payload limit
- **Battery Impact:** Minimal, browser handles efficiently
- **Network:** Uses browser's push service (FCM, etc.)

### Troubleshooting

#### "Push notifications not supported"
- Check browser compatibility
- Ensure HTTPS (required for service workers)
- Check browser settings

#### "Permission denied"
- User blocked notifications
- Guide user to browser settings
- Show instructions in UI

#### "Service worker failed to register"
- Check `public/sw.js` exists
- Verify HTTPS connection
- Check browser console for errors

#### "Subscription failed"
- Verify VAPID key is correct
- Check network connection
- Ensure service worker is active

#### "Push not received"
- Check backend logs for send errors
- Verify subscription is stored correctly
- Test with browser DevTools

### Future Enhancements

1. **Rich Notifications:** Images, actions, progress bars
2. **Notification Channels:** Categorize notification types
3. **Quiet Hours:** Don't send during user's sleep time
4. **Smart Batching:** Group similar notifications
5. **Priority Levels:** Urgent vs normal notifications
6. **Multi-device Sync:** Dismiss on one device = dismiss all
7. **Analytics:** Track notification engagement
8. **A/B Testing:** Test different notification styles

### Resources

- [Web Push API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [VAPID Spec](https://datatracker.ietf.org/doc/html/rfc8292)
- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)

### Support

For issues:
- Check browser console for errors
- Verify service worker is registered
- Test with different browsers
- Check backend push sending logs
- Ensure VAPID configuration is correct

---

## Summary

✅ **Change Password:** Fully functional, using real API endpoint  
✅ **Push Notifications:** Complete implementation with:
- Frontend utilities
- Service worker
- UI component
- Backend API requirements
- Security best practices
- Testing guide
- Troubleshooting help

**Ready for production** pending backend VAPID setup and push sending implementation.
