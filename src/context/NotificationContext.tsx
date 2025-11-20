"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getNotifications, 
  getUnreadNotificationCount,
  Notification,
  isRequestCooldownActive
} from '../services/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  unreadCount: number;
  notifications: Notification[];
  lastChecked: Date | null;
  markAsRead: () => void;
  refreshNotifications: () => Promise<void>;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { authReady, isAuthenticated } = useAuth();
  const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';

  // Polling configuration
  const DEFAULT_POLL_INTERVAL = Number(process.env.NEXT_PUBLIC_NOTIFICATION_POLL_MS) || 60000; // 60s default
  const maxBackoff = 10 * 60 * 1000; // 10 minutes

  // Backoff and lifecycle refs
  const failureCountRef = React.useRef(0);
  const activeRef = React.useRef(true);
  const pollTimerRef = React.useRef<number | null>(null);

  // Load last checked time from localStorage on mount
  useEffect(() => {
    const storedLastChecked = localStorage.getItem('formhook_last_checked');
    
    if (storedLastChecked) {
      setLastChecked(new Date(storedLastChecked));
    }
  }, []);

  // Refresh notifications from backend
  const refreshNotifications = async () => {
    if (isLoading) return;
    // Guard: don't fetch until auth is ready and user is authenticated
    if (!authReady || !isAuthenticated) {
      if (isDev) console.log('[Notifications] Auth not ready or not authenticated; skipping fetch');
      return;
    }

    // Respect client-side cooldown/backoff to avoid repeated requests
    if (isRequestCooldownActive()) {
      console.log('[Notifications] Skipping fetch due to client-side cooldown/backoff');
      return;
    }

    setIsLoading(true);
    try {
      if (isDev) console.log('[Notifications] Fetching from API...');
      
      // Fetch notifications and unread count in parallel
      const [notificationsData, unreadCountData] = await Promise.all([
        getNotifications({ limit: 100 }), // Get latest 100 notifications
        getUnreadNotificationCount()
      ]);

      if (isDev) console.log('[Notifications] Received:', {
        notifications: notificationsData.notifications?.length || 0,
        unreadCount: unreadCountData
      });

      // Update state with API data
      if (notificationsData.notifications) {
        setNotifications(notificationsData.notifications);
      }
      
      setUnreadCount(unreadCountData || notificationsData.unread || 0);
      // Reset failure count on success
      failureCountRef.current = 0;

    } catch (error) {
      // Log but do not spam prod logs
      if (isDev) console.error('[Notifications] Error fetching:', error);
      // Increment failure counter for backoff
      failureCountRef.current = Math.min(16, (failureCountRef.current || 0) + 1);
      // Don't throw error - fail gracefully
    } finally {
      setIsLoading(false);
    }
  };

  // Mark all notifications as read
  const markAsRead = () => {
    const now = new Date();
    setUnreadCount(0);
    setLastChecked(now);
    localStorage.setItem('formhook_last_checked', now.toISOString());
    console.log('[Notifications] Marked all as read');
  };

  // Initial load and periodic refresh
  useEffect(() => {
    activeRef.current = true;

    // Start polling only when auth ready and user authenticated
    const startPolling = () => {
      // Kick off an initial immediate refresh after a short delay
      const startDelay = 1000;
      pollTimerRef.current = window.setTimeout(async function poll() {
        if (!activeRef.current) return;
        if (!authReady || !isAuthenticated) {
          if (isDev) console.log('[Notifications] Auth not ready or not authenticated; pausing polling');
          return;
        }

        // If tab is hidden, back off and schedule later
        if (typeof document !== 'undefined' && document.hidden) {
          if (isDev) console.log('[Notifications] Document hidden; skipping this poll cycle');
          // schedule next check later
          const nextHiddenDelay = Math.min(maxBackoff, DEFAULT_POLL_INTERVAL * 3);
          pollTimerRef.current = window.setTimeout(poll, nextHiddenDelay);
          return;
        }

        await refreshNotifications();

        // Determine next interval using exponential backoff on failures
        const failures = failureCountRef.current || 0;
        const backoff = failures > 0 ? Math.min(maxBackoff, DEFAULT_POLL_INTERVAL * Math.pow(2, failures)) : DEFAULT_POLL_INTERVAL;
        const next = Math.max(5000, backoff); // at least 5s
        pollTimerRef.current = window.setTimeout(poll, next);
      }, startDelay);
    };

    if (!authReady || !isAuthenticated) {
      if (isDev) console.log('[Notifications] User not authenticated; skipping notification polling');
      return;
    }

    startPolling();

    return () => {
      activeRef.current = false;
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current as number);
        pollTimerRef.current = null;
      }
    };
  // Re-run when auth state changes
  }, [authReady, isAuthenticated]);

  const contextValue: NotificationContextType = {
    unreadCount,
    notifications,
    lastChecked,
    markAsRead,
    refreshNotifications,
    isLoading
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};
