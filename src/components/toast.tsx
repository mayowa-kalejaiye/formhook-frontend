import React from 'react';
import { motion } from 'framer-motion';

export type NotificationType = 'success' | 'info' | 'warning' | 'error' | 'loading';
export type NotificationPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'bottom-center';

interface NotificationProps {
  type: NotificationType;
  title: string;
  message?: string;
  showIcon?: boolean;
  duration?: number;
  onClose: () => void;
}

const typeStyles: Record<NotificationType, string> = {
  success: 'bg-green-500 text-white',
  info: 'bg-blue-500 text-white',
  warning: 'bg-yellow-500 text-white',
  error: 'bg-red-500 text-white',
  loading: 'bg-gray-500 text-white',
};

const typeIcons: Record<NotificationType, React.ReactNode> = {
  success: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
  ),
  info: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01" /></svg>
  ),
  warning: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" /></svg>
  ),
  error: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
  ),
  loading: (
    <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeOpacity=".25" /><path d="M4 12a8 8 0 018-8" /></svg>
  ),
};

const Notification: React.FC<NotificationProps> = ({ type, title, message, showIcon = true, duration = 4000, onClose }) => {
  React.useEffect(() => {
    if (type !== 'loading') {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [type, duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-2 px-4 py-3 rounded-lg shadow-lg ${typeStyles[type]} relative`}
      role="alert"
    >
      {showIcon && <span>{typeIcons[type]}</span>}
      <div className="flex-1">
        <div className="font-semibold text-sm">{title}</div>
        {message && <div className="text-xs mt-0.5 opacity-90">{message}</div>}
      </div>
      <button
        onClick={onClose}
        className="ml-2 text-white/70 hover:text-white text-lg font-bold focus:outline-none"
        aria-label="Close notification"
      >
        ×
      </button>
    </motion.div>
  );
};

export default Notification;
