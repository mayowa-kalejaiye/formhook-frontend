"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getNotifications, 
  getUnreadNotificationCount,
  Notification 
} from '../services/api';

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
    // Check if user is logged in
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      console.log('[Notifications] No auth token, skipping notification fetch');
      return;
    }

    // Initial check after component mounts
    const initialTimer = setTimeout(() => {
      refreshNotifications();
    }, 2000); // Wait 2 seconds for auth to be ready

    // Then check every 30 seconds
    const interval = setInterval(() => {
      refreshNotifications();
    }, 30000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

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
