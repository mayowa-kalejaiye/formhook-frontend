# Notifications System

## Overview
The FormHook notification system provides users with a centralized hub to track all important activity across their forms, similar to an email inbox interface.

## Features

### 📧 Email-Like Interface
- **Split View Layout**: List view on the left, detail view on the right (like Gmail/Outlook)
- **Read/Unread Status**: Visual indicators for new notifications
- **Archive Functionality**: Move old notifications to archive
- **Search & Filter**: Find notifications by content, type, or form name

### 🔔 Notification Types

1. **Form Submissions** (`submission`)
   - Alerts when new form data is received
   - Shows form name and submitter info
   - Link to view full submission details
   - Priority: Medium

2. **Email Notifications** (`email`)
   - Copies of emails sent to users (confirmation emails, etc.)
   - Shows recipient, subject, and full email body
   - Tracks email delivery status
   - Priority: Low

3. **Webhook Deliveries** (`webhook`)
   - Success/failure status of webhook calls
   - Shows webhook URL and error details if failed
   - Helps debug integration issues
   - Priority: High (if failed)

4. **System Events** (`system`)
   - Form creation, updates, deletions
   - Settings changes
   - API token generation/revocation
   - Priority: Low

5. **Security Alerts** (`security`)
   - Login from new device
   - Password changes
   - API token usage
   - Priority: Urgent

6. **Milestones** (`milestone`)
   - Form reaches X submissions (100, 500, 1000, etc.)
   - Monthly/weekly usage summaries
   - Growth achievements
   - Priority: Medium

### 🎯 Key Features

#### Real-Time Updates
- Notifications are polled every 30 seconds via `NotificationContext`
- Unread count updates automatically
- Badge appears in sidebar navigation

#### Smart Filtering
- **Status Filter**: All / Unread / Read / Archived
- **Type Filter**: Filter by notification type
- **Search**: Full-text search across title, message, and metadata

#### Rich Metadata
Each notification includes contextual information:
- Form name and ID
- Timestamp with relative formatting ("2h ago")
- Priority level (low, medium, high, urgent)
- Actionable links (view form, view submission)

#### Email-Style Detail View
When clicking a notification:
- Full message and metadata displayed
- Email body shown in formatted box
- Webhook URLs and status codes
- Quick actions (Archive, View Form)

## Data Structure

```typescript
interface Notification {
  id: string;
  type: 'submission' | 'webhook' | 'system' | 'email' | 'security' | 'milestone';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  archived: boolean;
  metadata?: {
    formId?: string;
    formName?: string;
    submissionId?: string;
    webhookUrl?: string;
    status?: string;
    emailTo?: string;
    emailSubject?: string;
    emailBody?: string;
  };
}
```

## Backend Integration (TODO)

Currently, the notifications page uses:
- **Real data**: Form submissions from `NotificationContext`
- **Mock data**: Email, webhook, system, security, and milestone notifications

### Backend Endpoints Needed

```
GET /api/notifications
  - Returns all notifications for authenticated user
  - Supports pagination, filtering, search
  - Response: { notifications: Notification[], total: number, unread: number }

POST /api/notifications/{id}/read
  - Mark notification as read
  - Returns updated notification

POST /api/notifications/mark-all-read
  - Mark all notifications as read
  - Returns updated unread count

POST /api/notifications/{id}/archive
  - Archive a notification
  - Returns success status

DELETE /api/notifications/{id}
  - Delete a notification permanently
  - Returns success status
```

### Webhook to Notification Flow

When backend detects events, it should create notifications:

```python
# Example: Webhook failure handler
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
            "status": "failed"
        }
    }
    await create_notification(notification)
```

## User Experience

### Notification Bell Badge
- Shows unread count in sidebar navigation
- Red badge with number (up to 99+)
- Visible on both desktop and mobile
- Clicking navigates to `/notifications`

### Auto-Refresh
- Checks for new notifications every 30 seconds
- Manual refresh button available
- Shows loading spinner during refresh

### Persistence
- Last checked time stored in localStorage
- Known submission IDs tracked to detect new entries
- Unread count persists across sessions

## Future Enhancements

1. **Real-time WebSocket Updates**: Instant notifications without polling
2. **Push Notifications**: Browser notifications for urgent alerts
3. **Email Digests**: Daily/weekly summary emails
4. **Custom Rules**: User-defined notification preferences
5. **Notification Preferences**: Mute specific types, set quiet hours
6. **Bulk Actions**: Select multiple notifications for bulk archive/delete
7. **Smart Grouping**: Group related notifications (e.g., multiple submissions from same form)
8. **Notification Templates**: Customizable notification formats
9. **Export**: Download notification history as CSV/JSON
10. **Analytics**: Track notification engagement (open rate, time to action)

## Technical Notes

- Built with React, Next.js, TypeScript
- Uses `NotificationContext` for state management
- Leverages shadcn/ui components (Card, Badge, Tabs, etc.)
- Responsive design with mobile-optimized layout
- Dark mode support
- Accessible with proper ARIA labels

## Files

- `src/pages/notifications.tsx` - Main notification page
- `src/context/NotificationContext.tsx` - Notification state management
- `src/components/DashboardNav.tsx` - Navigation with badge
- `docs/NOTIFICATIONS.md` - This documentation

## Related Features

- [Dashboard](../src/pages/dashboard.tsx) - Shows recent activity
- [Forms](../src/pages/forms/) - Form management
- [Submissions](../src/pages/submissions.tsx) - View form data
- [Webhooks](../src/pages/forms/[formId].tsx) - Webhook configuration
