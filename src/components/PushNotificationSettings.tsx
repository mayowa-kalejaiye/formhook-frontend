import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Bell, BellOff, Check, X } from 'lucide-react';
import {
  isPushNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  testNotification,
  getSubscriptionJSON
} from '../utils/pushNotifications';
import { subscribeToPush, unsubscribeFromPush, getVapidPublicKey } from '../services/api';
import { useToast } from '../hooks/use-toast';

export default function PushNotificationSettings() {
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // VAPID public key - hardcoded as fallback
  const VAPID_PUBLIC_KEY = 'BFmPO84FW8CdRE3UFwSaAWxe1_PzRUegDGCfRG5ggqws2WDWCAmI7xutf3JQrwFLSsNjjRD_VJ8xNqbR9O8CFMw';
  const [vapidKey, setVapidKey] = useState<string>(VAPID_PUBLIC_KEY);

  // Check support and permission on mount
  useEffect(() => {
    const checkStatus = async () => {
      const supported = isPushNotificationSupported();
      setIsSupported(supported);

      if (supported) {
        const currentPermission = getNotificationPermission();
        setPermission(currentPermission);

        // Check if already subscribed
        const subscription = await getSubscriptionJSON();
        setIsSubscribed(!!subscription);

        // Fetch VAPID key from backend (optional - falls back to hardcoded)
        try {
          const key = await getVapidPublicKey();
          if (key) {
            setVapidKey(key);
            console.log('[PushSettings] Using VAPID key from backend');
          }
        } catch (error) {
          console.log('[PushSettings] Using fallback VAPID key');
        }
      }
    };

    checkStatus();
  }, []);

  // Handle enable push notifications
  const handleEnable = async () => {
    setIsLoading(true);
    try {
      // 1. Request permission
      const newPermission = await requestNotificationPermission();
      setPermission(newPermission);

      if (newPermission !== 'granted') {
        toast({
          title: 'Permission Denied',
          description: 'Please allow notifications in your browser settings',
          variant: 'destructive'
        });
        return;
      }

      // 2. Register service worker
      await registerServiceWorker();

      // 3. Subscribe to push notifications
      if (!vapidKey) {
        toast({
          title: 'Configuration Error',
          description: 'VAPID key not available. Please contact support.',
          variant: 'destructive'
        });
        return;
      }

      const subscription = await subscribeToPushNotifications(vapidKey);

      if (subscription) {
        // 4. Send subscription to backend
        await subscribeToPush(subscription);

        setIsSubscribed(true);
        toast({
          title: 'Success!',
          description: 'Push notifications enabled',
        });

        // Show a test notification
        setTimeout(() => {
          testNotification();
        }, 1000);
      }
    } catch (error: any) {
      console.error('[PushSettings] Enable failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to enable push notifications',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle disable push notifications
  const handleDisable = async () => {
    setIsLoading(true);
    try {
      // Get current subscription to send endpoint to backend
      const subscriptionJSON = await getSubscriptionJSON();
      
      if (subscriptionJSON && (subscriptionJSON as any).endpoint) {
        await unsubscribeFromPush((subscriptionJSON as any).endpoint);
      }

      // Unsubscribe from browser
      const success = await unsubscribeFromPushNotifications();

      if (success) {
        setIsSubscribed(false);
        toast({
          title: 'Disabled',
          description: 'Push notifications turned off',
        });
      }
    } catch (error: any) {
      console.error('[PushSettings] Disable failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to disable push notifications',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle test notification
  const handleTest = () => {
    testNotification();
    toast({
      title: 'Test Sent',
      description: 'Check your notifications',
    });
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Browser push notifications are not supported in your browser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            To receive push notifications, please use a modern browser like Chrome, Firefox, Edge, or Safari.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
          {isSubscribed && (
            <Badge variant="default" className="ml-2">
              <Check className="h-3 w-3 mr-1" />
              Enabled
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Receive real-time notifications in your browser
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permission Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <p className="font-medium text-sm">Permission Status</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {permission === 'granted' && 'Notifications allowed'}
              {permission === 'denied' && 'Notifications blocked'}
              {permission === 'default' && 'Not requested yet'}
            </p>
          </div>
          <Badge variant={
            permission === 'granted' ? 'default' : 
            permission === 'denied' ? 'destructive' : 
            'secondary'
          }>
            {permission === 'granted' && <Check className="h-3 w-3 mr-1" />}
            {permission === 'denied' && <X className="h-3 w-3 mr-1" />}
            {permission}
          </Badge>
        </div>

        {/* Description */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-2">Get instant notifications for:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>New form submissions</li>
            <li>Webhook delivery failures</li>
            <li>Security alerts</li>
            <li>Important milestones</li>
          </ul>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {!isSubscribed ? (
            <Button
              onClick={handleEnable}
              disabled={isLoading || permission === 'denied'}
              className="flex-1"
            >
              <Bell className="h-4 w-4 mr-2" />
              {isLoading ? 'Enabling...' : 'Enable Push Notifications'}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={isLoading}
                className="flex-1"
              >
                Test Notification
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisable}
                disabled={isLoading}
                className="flex-1"
              >
                <BellOff className="h-4 w-4 mr-2" />
                Disable
              </Button>
            </>
          )}
        </div>

        {/* Help Text for Denied Permission */}
        {permission === 'denied' && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Notifications are blocked.</strong> To enable them:
            </p>
            <ol className="text-xs text-red-700 dark:text-red-300 mt-2 ml-4 list-decimal space-y-1">
              <li>Click the lock icon in your browser&rsquo;s address bar</li>
              <li>Find &quot;Notifications&quot; in the permissions list</li>
              <li>Change it to &quot;Allow&quot;</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
