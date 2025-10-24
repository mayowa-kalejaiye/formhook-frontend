/**
 * Browser Push Notifications Utility
 * Handles Web Push API integration for real-time notifications
 */

// Check if browser supports push notifications
export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// Get current notification permission status
export function getNotificationPermission(): NotificationPermission {
  if (!isPushNotificationSupported()) return 'denied';
  return Notification.permission;
}

// Request notification permission from user
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[PushNotifications] Permission status:', permission);
    return permission;
  } catch (error) {
    console.error('[PushNotifications] Error requesting permission:', error);
    throw error;
  }
}

// Register service worker for push notifications
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushNotificationSupported()) {
    console.warn('[PushNotifications] Service workers not supported');
    return null;
  }

  try {
    // Register the service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('[PushNotifications] Service worker registered:', registration);

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    
    return registration;
  } catch (error) {
    console.error('[PushNotifications] Service worker registration failed:', error);
    return null;
  }
}

// Subscribe to push notifications
export async function subscribeToPushNotifications(
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported');
  }

  try {
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('[PushNotifications] Already subscribed:', subscription);
      return subscription;
    }

    // Subscribe to push notifications
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
    });

    console.log('[PushNotifications] New subscription created:', subscription);
    return subscription;
  } catch (error) {
    console.error('[PushNotifications] Subscription failed:', error);
    throw error;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const success = await subscription.unsubscribe();
      console.log('[PushNotifications] Unsubscribed:', success);
      return success;
    }

    return false;
  } catch (error) {
    console.error('[PushNotifications] Unsubscribe failed:', error);
    return false;
  }
}

// Show a local browser notification
export function showLocalNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (!isPushNotificationSupported()) {
    console.warn('[PushNotifications] Cannot show notification - not supported');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.warn('[PushNotifications] Cannot show notification - permission not granted');
    return;
  }

  try {
    // Show notification using service worker if available
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, {
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        ...options
      });
    }).catch(error => {
      // Fallback to regular notification
      console.warn('[PushNotifications] Service worker notification failed, using fallback:', error);
      new Notification(title, options);
    });
  } catch (error) {
    console.error('[PushNotifications] Failed to show notification:', error);
  }
}

// Convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// Helper to get subscription in JSON format for backend
export async function getSubscriptionJSON(): Promise<object | null> {
  if (!isPushNotificationSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      return subscription.toJSON();
    }
    
    return null;
  } catch (error) {
    console.error('[PushNotifications] Failed to get subscription:', error);
    return null;
  }
}

// Test notification (for debugging)
export function testNotification(): void {
  showLocalNotification('Test Notification', {
    body: 'This is a test notification from FormHook',
    icon: '/icon-192x192.png',
    tag: 'test-notification',
    requireInteraction: false
  });
}
