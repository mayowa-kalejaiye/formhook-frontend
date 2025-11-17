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
      console.log('[Notifications] Auth not ready or not authenticated; skipping fetch');
      return;
    }

    // Respect client-side cooldown/backoff to avoid repeated requests
    if (isRequestCooldownActive()) {
      console.log('[Notifications] Skipping fetch due to client-side cooldown/backoff');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[Notifications] Fetching from API...');
      
      // Fetch notifications and unread count in parallel
      const [notificationsData, unreadCountData] = await Promise.all([
        getNotifications({ limit: 100 }), // Get latest 100 notifications
        getUnreadNotificationCount()
      ]);

      console.log('[Notifications] Received:', {
        notifications: notificationsData.notifications?.length || 0,
        unreadCount: unreadCountData
      });

      // Update state with API data
      if (notificationsData.notifications) {
        setNotifications(notificationsData.notifications);
      }
      
      setUnreadCount(unreadCountData || notificationsData.unread || 0);

    } catch (error) {
      console.error('[Notifications] Error fetching:', error);
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
    // Wait for auth to be initialized before starting notification polling
    if (!authReady) return;
    if (!isAuthenticated) {
      console.log('[Notifications] User not authenticated; skipping notification polling');
      return;
    }

    // Initial check after auth ready
    const initialTimer = setTimeout(() => {
      refreshNotifications();
    }, 2000);

    // Then check every 30 seconds
    const interval = setInterval(() => {
      if (!authReady || !isAuthenticated) {
        console.log('[Notifications] Auth changed; stopping notification polling');
        clearInterval(interval);
        return;
      }
      refreshNotifications();
    }, 30000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
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
