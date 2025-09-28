import React from 'react';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/router';
import { useNotifications } from '../context/NotificationContext';

interface NotificationBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ 
  className = '', 
  size = 'md',
  showLabel = false 
}) => {
  const { unreadCount, markAsRead, isLoading } = useNotifications();
  const router = useRouter();

  const handleClick = () => {
    // Mark as read when clicked
    markAsRead();
    // Navigate to submissions page
    router.push('/submissions');
  };

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-10 w-10'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const badgeSizes = {
    sm: 'h-4 w-4 text-xs',
    md: 'h-5 w-5 text-xs',
    lg: 'h-6 w-6 text-sm'
  };

  return (
    <button
      onClick={handleClick}
      className={`
        relative inline-flex items-center justify-center 
        ${sizeClasses[size]} 
        ${showLabel ? 'gap-2 px-3 py-2' : 'rounded-full'} 
        hover:bg-gray-100 dark:hover:bg-gray-700 
        transition-colors duration-200
        ${className}
      `}
      title={`${unreadCount} new submissions`}
    >
      <div className="relative">
        <Bell className={`${iconSizes[size]} text-gray-600 dark:text-gray-300`} />
        
        {unreadCount > 0 && (
          <div className={`
            absolute -top-1 -right-1 
            ${badgeSizes[size]}
            bg-red-500 text-white rounded-full 
            flex items-center justify-center font-bold
            animate-pulse
            min-w-fit px-1
          `}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
        
        {isLoading && (
          <div className={`
            absolute -top-1 -right-1 
            ${badgeSizes[size]}
            bg-blue-500 text-white rounded-full 
            flex items-center justify-center
            animate-spin
          `}>
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        )}
      </div>
      
      {showLabel && (
        <span className="text-sm font-medium">
          {unreadCount > 0 ? `${unreadCount} New` : 'Submissions'}
        </span>
      )}
    </button>
  );
};
