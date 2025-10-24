# Notifications API Integration

## Overview

The notification system has been fully integrated with real API endpoints, replacing all hardcoded mock data with live backend connections. The system now provides real-time notifications across all aspects of the FormHook platform.

## Architecture

### Data Flow

```
Backend API → API Service Layer → Notification Context → UI Components
     ↓              ↓                    ↓                    ↓
  Events      fetchWithAuth()    useState/useEffect    Notifications Page
  Generated   + Cache Layer       Auto-refresh          + Dashboard Badge
```

### Key Components

1. **API Service Layer** (`src/services/api.ts`)
   - All notification CRUD operations
   - Caching with TTL (30 seconds for notifications)
   - Error handling and fallbacks
   - Type-safe interfaces

2. **Notification Context** (`src/context/NotificationContext.tsx`)
   - Global state management
   - Auto-refresh every 30 seconds
   - Unread count tracking
   - Optimistic UI updates

3. **Notifications Page** (`src/pages/notifications.tsx`)
   - Full CRUD operations
   - Email-like interface
   - Real-time updates
   - Advanced filtering

4. **Dashboard Integration** (`src/pages/dashboard.tsx`)
   - Displays unread count from context
   - No local state management
   - Real-time badge updates

## API Endpoints

### Implemented Endpoints

All endpoints are defined in `src/services/api.ts`:

#### GET `/notifications`
Fetch user notifications with pagination and filtering

**Query Parameters:**
- `limit` (number): Max notifications to return
- `offset` (number): Pagination offset
- `type` (string): Filter by notification type
- `read` (boolean): Filter by read status
- `archived` (boolean): Include/exclude archived

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif-123",
      "type": "submission",
      "priority": "medium",
      "title": "New form submission",
      "message": "Contact Form received a new submission",
      "timestamp": "2025-10-24T10:30:00Z",
      "read": false,
      "archived": false,
      "metadata": {
        "formId": "form-456",
        "formName": "Contact Form",
        "submissionId": "sub-789"
      }
    }
  ],
  "total": 42,
  "unread": 5
}
```

#### GET `/notifications/unread-count`
Get count of unread notifications (fast endpoint for badges)

**Response:**
```json
{
  "count": 5
}
```

#### POST `/notifications/{id}/read`
Mark specific notification as read

**Response:**
```json
{
  "success": true
}
```

#### POST `/notifications/mark-all-read`
Mark all notifications as read

**Response:**
```json
{
  "success": true
}
```

#### POST `/notifications/{id}/archive`
Archive a notification (hide from main view)

**Response:**
```json
{
  "success": true
}
```

#### DELETE `/notifications/{id}`
Permanently delete a notification

**Response:**
```json
{
  "success": true
}
```

#### GET `/notifications/preferences`
Get user notification preferences

**Response:**
```json
{
  "email_notifications": true,
  "webhook_failures": true,
  "security_alerts": true,
  "milestone_alerts": true,
  "submission_alerts": true
}
```

#### PUT `/notifications/preferences`
Update notification preferences

**Request Body:**
```json
{
  "email_notifications": true,
  "webhook_failures": true,
  "security_alerts": false
}
```

**Response:**
```json
{
  "success": true
}
```

## Notification Types

### 1. Submission Notifications (`submission`)

**When Created:**
- Form receives new submission

**Metadata:**
- `formId`: Form identifier
- `formName`: Human-readable form name
- `submissionId`: Submission identifier
- `ipAddress`: Submitter IP (optional)
- `userAgent`: Browser info (optional)

**Priority:** Medium

**Backend Implementation:**
```python
async def create_submission_notification(submission):
    notification = {
        "user_id": submission.form.owner_id,
        "type": "submission",
        "priority": "medium",
        "title": f"New submission for {submission.form.name}",
        "message": f"Received submission from {submission.email or 'Anonymous'}",
        "metadata": {
            "formId": submission.form_id,
            "formName": submission.form.name,
            "submissionId": submission.id,
            "ipAddress": submission.ip_address
        }
    }
    await db.notifications.insert(notification)
```

### 2. Webhook Notifications (`webhook`)

**When Created:**
- Webhook delivery succeeds/fails
- Webhook retry attempted
- Webhook configuration changed

**Metadata:**
- `formId`: Form identifier
- `formName`: Form name
- `webhookUrl`: Target webhook URL
- `status`: 'success' | 'failed' | 'retrying'
- `error`: Error message (if failed)

**Priority:** High (for failures), Low (for successes)

**Backend Implementation:**
```python
async def on_webhook_failure(form_id, webhook_url, error):
    notification = {
        "user_id": form.owner_id,
        "type": "webhook",
        "priority": "high",
        "title": "Webhook delivery failed",
        "message": f"Failed to deliver webhook to {webhook_url}",
        "metadata": {
            "formId": form_id,
            "formName": form.name,
            "webhookUrl": webhook_url,
            "status": "failed",
            "error": str(error)
        }
    }
    await db.notifications.insert(notification)
```

### 3. Email Notifications (`email`)

**When Created:**
- Confirmation email sent to submitter
- Notification email sent to form owner
- Email delivery failed

**Metadata:**
- `emailTo`: Recipient email
- `emailSubject`: Email subject line
- `emailBody`: Full email content
- `formId`: Related form (optional)
- `status`: 'sent' | 'failed'

**Priority:** Low (for sent), High (for failed)

### 4. System Notifications (`system`)

**When Created:**
- Form created/updated/deleted
- API token generated/revoked
- Account settings changed

**Metadata:**
- `formId`: Related form (if applicable)
- `formName`: Form name (if applicable)
- Action details

**Priority:** Low

### 5. Security Notifications (`security`)

**When Created:**
- New login from unknown device
- Password changed
- API token used
- Failed login attempts (brute force)
- Two-factor authentication enabled/disabled

**Metadata:**
- `ipAddress`: Login IP
- `userAgent`: Browser/device info
- `location`: Geographic location (if available)

**Priority:** Urgent (always)

**Backend Implementation:**
```python
async def on_login(user_id, ip_address, user_agent):
    # Check if this is a new device
    is_new_device = await check_new_device(user_id, ip_address, user_agent)
    
    if is_new_device:
        notification = {
            "user_id": user_id,
            "type": "security",
            "priority": "urgent",
            "title": "New login detected",
            "message": f"Someone logged into your account from {ip_address}",
            "metadata": {
                "ipAddress": ip_address,
                "userAgent": user_agent
            }
        }
        await db.notifications.insert(notification)
```

### 6. Milestone Notifications (`milestone`)

**When Created:**
- Form reaches X submissions (100, 500, 1000, 5000, 10000)
- Monthly usage milestones
- Account anniversary

**Metadata:**
- `formId`: Form that reached milestone
- `formName`: Form name
- `milestone`: Milestone value (e.g., "100")
- `metric`: What was measured (e.g., "submissions")

**Priority:** Medium

**Backend Implementation:**
```python
async def check_milestone(form_id, submission_count):
    milestones = [100, 500, 1000, 5000, 10000]
    
    for milestone in milestones:
        if submission_count == milestone:
            notification = {
                "user_id": form.owner_id,
                "type": "milestone",
                "priority": "medium",
                "title": f"Milestone reached! 🎉",
                "message": f"Your {form.name} just received its {milestone}th submission!",
                "metadata": {
                    "formId": form_id,
                    "formName": form.name,
                    "milestone": str(milestone),
                    "metric": "submissions"
                }
            }
            await db.notifications.insert(notification)
```

## Frontend Implementation

### Notification Context

The context provides:
- `unreadCount`: Number of unread notifications
- `notifications`: Array of all notifications
- `refreshNotifications()`: Manual refresh
- `isLoading`: Loading state

**Usage:**
```typescript
import { useNotifications } from '../context/NotificationContext';

function MyComponent() {
  const { unreadCount, refreshNotifications } = useNotifications();
  
  return (
    <div>
      <Badge>{unreadCount}</Badge>
      <button onClick={refreshNotifications}>Refresh</button>
    </div>
  );
}
```

### API Service Functions

All functions handle errors gracefully and return sensible defaults:

```typescript
// Get notifications
const data = await getNotifications({ 
  limit: 100, 
  type: 'submission',
  read: false 
});
// data = { notifications: [], total: 0, unread: 0 } if error

// Mark as read
await markNotificationAsRead('notif-123');
// Throws error on failure - catch in component

// Archive
await archiveNotification('notif-123');
// Throws error on failure - catch in component

// Delete
await deleteNotification('notif-123');
// Throws error on failure - catch in component
```

### Caching Strategy

Notifications use short TTL cache (30 seconds):
- Reduces API calls during rapid UI interactions
- Ensures data freshness
- Automatic invalidation on mutations

```typescript
// Cache is automatically invalidated when:
await markNotificationAsRead(id);      // Invalidates /notifications
await archiveNotification(id);         // Invalidates /notifications
await deleteNotification(id);          // Invalidates /notifications
await markAllNotificationsAsRead();    // Invalidates /notifications
```

## Testing

### Manual Testing Checklist

1. **Notification Creation**
   - [ ] Submit form → notification appears
   - [ ] Webhook fails → notification appears
   - [ ] Form created → notification appears
   - [ ] Login from new device → notification appears
   - [ ] Milestone reached → notification appears

2. **Notification Actions**
   - [ ] Mark as read → badge count decreases
   - [ ] Archive → disappears from main view
   - [ ] Delete → permanently removed
   - [ ] Mark all read → all marked

3. **Filtering**
   - [ ] Filter by type works
   - [ ] Filter by read/unread works
   - [ ] Search finds notifications
   - [ ] Archived tab shows only archived

4. **Real-time Updates**
   - [ ] Badge updates every 30 seconds
   - [ ] Refresh button works
   - [ ] Context refreshes automatically

## Backend Requirements

### Database Schema

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('submission', 'webhook', 'system', 'email', 'security', 'milestone')),
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE,
    archived BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_type ON notifications(user_id, type);
CREATE INDEX idx_notifications_timestamp ON notifications(user_id, timestamp DESC);
```

### Notification Preferences Schema

```sql
CREATE TABLE notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    webhook_failures BOOLEAN DEFAULT TRUE,
    security_alerts BOOLEAN DEFAULT TRUE,
    milestone_alerts BOOLEAN DEFAULT TRUE,
    submission_alerts BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Performance Considerations

### Optimizations

1. **Pagination**: Limit 100 notifications per request
2. **Caching**: 30-second TTL for reads
3. **Indexing**: Database indexes on user_id, read, type, timestamp
4. **Lazy Loading**: Fetch details only when selected
5. **Debouncing**: Auto-refresh checks every 30 seconds (not on every render)

### Scaling

For high-volume scenarios:
- Use message queue (RabbitMQ, Redis) for notification creation
- Implement notification batching (group similar notifications)
- Add notification expiry (auto-delete after 90 days)
- Use WebSocket for real-time updates (instead of polling)

## Future Enhancements

1. **Real-time WebSocket Updates** - Instant notifications
2. **Push Notifications** - Browser notifications API
3. **Email Digests** - Daily/weekly summaries
4. **Notification Grouping** - "5 new submissions" instead of 5 separate
5. **Smart Filtering** - AI-powered priority sorting
6. **Custom Rules** - User-defined notification triggers
7. **Notification Templates** - Customizable notification formats
8. **Bulk Actions** - Select multiple, perform action
9. **Export** - Download notification history
10. **Analytics** - Track notification engagement

## Files Modified

### New Files
- `src/pages/notifications.tsx` - Main notifications page

### Modified Files
- `src/services/api.ts` - Added notification API functions
- `src/context/NotificationContext.tsx` - Updated to use real API
- `src/components/DashboardNav.tsx` - Added notification badge
- `src/pages/dashboard.tsx` - Integrated notification context

### Documentation
- `docs/NOTIFICATIONS.md` - System overview
- `docs/NOTIFICATIONS-API-INTEGRATION.md` - This document

## Environment Variables

No new environment variables required. Uses existing:
- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL

## Deployment Notes

1. Ensure backend implements all notification endpoints
2. Run database migrations for notification tables
3. Configure notification preferences defaults
4. Set up background jobs for milestone checking
5. Monitor notification creation rate
6. Set up alerts for failed webhook notifications

## Support

For issues or questions:
- Check backend logs for API errors
- Verify JWT token is valid
- Check browser console for frontend errors
- Ensure CORS is configured correctly
- Verify database indexes exist
