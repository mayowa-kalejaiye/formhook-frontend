"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getForms, getSubmissions } from '../services/api';

interface NotificationContextType {
  unreadCount: number;
  lastChecked: Date | null;
  submissions: any[];
  markAsRead: () => void;
  checkForNewSubmissions: () => Promise<void>;
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
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [knownSubmissionIds, setKnownSubmissionIds] = useState<Set<string>>(new Set());

  // Load last checked time from localStorage on mount
  useEffect(() => {
    const storedLastChecked = localStorage.getItem('formhook_last_checked');
    const storedKnownIds = localStorage.getItem('formhook_known_submissions');
    
    if (storedLastChecked) {
      setLastChecked(new Date(storedLastChecked));
    }
    
    if (storedKnownIds) {
      try {
        const ids = JSON.parse(storedKnownIds);
        setKnownSubmissionIds(new Set(ids));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Check for new submissions across all forms
  const checkForNewSubmissions = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      console.log('[Notifications] Checking for new submissions...');
      
      // Get all forms first
      const forms = await getForms();
      if (!forms || !Array.isArray(forms)) {
        console.log('[Notifications] No forms found');
        return;
      }

      let allSubmissions: any[] = [];
      let newSubmissionsCount = 0;

      // Get submissions for each form
      for (const form of forms) {
        try {
          const formSubmissions = await getSubmissions(form.id, { limit: 50 });
          let submissionsArray: any[] = [];
          
          // Handle different response formats
          if (Array.isArray(formSubmissions)) {
            submissionsArray = formSubmissions;
          } else if (formSubmissions?.submissions && Array.isArray(formSubmissions.submissions)) {
            submissionsArray = formSubmissions.submissions;
          } else if (formSubmissions?.results && Array.isArray(formSubmissions.results)) {
            submissionsArray = formSubmissions.results;
          }

          // Add form name to each submission for context
          const enrichedSubmissions = submissionsArray.map(sub => ({
            ...sub,
            form_name: form.name,
            form_id: form.id
          }));

          allSubmissions.push(...enrichedSubmissions);

          // Check for new submissions (not in known IDs)
          for (const submission of enrichedSubmissions) {
            const submissionId = submission.id?.toString() || 
                               `${submission.form_id}-${submission.created_at}`;
            
            if (!knownSubmissionIds.has(submissionId)) {
              // Only count as new if it's after last checked time
              const submissionDate = new Date(
                submission.created_at || 
                submission.submitted_at || 
                submission.date || 
                new Date()
              );
              
              if (!lastChecked || submissionDate > lastChecked) {
                newSubmissionsCount++;
              }
            }
          }

        } catch (error) {
          console.error(`[Notifications] Error fetching submissions for form ${form.id}:`, error);
        }
      }

      // Sort all submissions by date (newest first)
      allSubmissions.sort((a, b) => {
        const dateA = new Date(a.created_at || a.submitted_at || a.date || 0);
        const dateB = new Date(b.created_at || b.submitted_at || b.date || 0);
        return dateB.getTime() - dateA.getTime();
      });

      // Update known submission IDs
      const newKnownIds = new Set<string>();
      allSubmissions.forEach(sub => {
        const submissionId = sub.id?.toString() || `${sub.form_id}-${sub.created_at}`;
        newKnownIds.add(submissionId);
      });

      console.log('[Notifications] Found submissions:', {
        total: allSubmissions.length,
        newCount: newSubmissionsCount,
        previouslyKnown: knownSubmissionIds.size
      });

      setSubmissions(allSubmissions);
      setKnownSubmissionIds(newKnownIds);
      setUnreadCount(prev => Math.max(0, prev + newSubmissionsCount));

      // Store known IDs
      localStorage.setItem('formhook_known_submissions', JSON.stringify(Array.from(newKnownIds)));

    } catch (error) {
      console.error('[Notifications] Error checking for submissions:', error);
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

  // Auto-check for new submissions every 30 seconds
  useEffect(() => {
    // Initial check after component mounts
    const initialTimer = setTimeout(() => {
      checkForNewSubmissions();
    }, 2000); // Wait 2 seconds for auth to be ready

    // Then check every 30 seconds
    const interval = setInterval(() => {
      checkForNewSubmissions();
    }, 30000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  const contextValue: NotificationContextType = {
    unreadCount,
    lastChecked,
    submissions,
    markAsRead,
    checkForNewSubmissions,
    isLoading
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};
