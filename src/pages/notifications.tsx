import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AuthLayout from '../components/AuthLayout';
import DashboardNav from '../components/DashboardNav';
import BottomGradientRadial from '../components/BottomGradientRadial';
import PushNotificationSettings from '../components/PushNotificationSettings';
import { useNotifications } from '../context/NotificationContext';
import { 
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  archiveNotification as apiArchiveNotification,
  deleteNotification as apiDeleteNotification,
  Notification
} from '../services/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useToast, showApiError } from '../hooks/use-toast';
import { 
  Bell, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText,
  Webhook,
  Settings,
  TrendingUp,
  UserCheck,
  Trash2,
  Filter,
  Search,
  MailOpen,
  Eye,
  Archive,
  RefreshCw
} from 'lucide-react';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

// Notification type definitions
type NotificationType = 'submission' | 'webhook' | 'system' | 'email' | 'security' | 'milestone';

export default function NotificationsPage() {
  const router = useRouter();
  const { unreadCount, refreshNotifications, isLoading: contextLoading } = useNotifications();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'archived'>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Load notifications from API
  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await getNotifications({ 
        limit: 200,
        archived: filter === 'archived' ? true : undefined
      });
      
      console.log('[NotificationsPage] Loaded notifications:', data);
      
      if (data.notifications && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('[NotificationsPage] Error loading notifications:', error);
      showApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load notifications on mount and when filter changes
  useEffect(() => {
    loadNotifications();
  }, [filter]);

  // Filter notifications
  const filteredNotifications = notifications.filter(notif => {
    // Status filter
    if (filter === 'unread' && notif.read) return false;
    if (filter === 'read' && !notif.read) return false;
    if (filter === 'archived' && !notif.archived) return false;
    if (filter !== 'archived' && notif.archived) return false;

    // Type filter
    if (typeFilter !== 'all' && notif.type !== typeFilter) return false;

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        notif.title.toLowerCase().includes(query) ||
        notif.message.toLowerCase().includes(query) ||
        notif.metadata?.formName?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Mark notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      
      // Refresh context
      refreshNotifications();
    } catch (error) {
      console.error('[NotificationsPage] Error marking as read:', error);
      showApiError(error);
    }
  };

  // Archive notification
  const handleArchive = async (id: string) => {
    try {
      await apiArchiveNotification(id);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, archived: true } : n))
      );
      
      toast({
        title: 'Archived',
        description: 'Notification archived successfully'
      });
      
      // Refresh context
      refreshNotifications();
    } catch (error) {
      console.error('[NotificationsPage] Error archiving:', error);
      showApiError(error);
    }
  };

  // Delete notification
  const handleDelete = async (id: string) => {
    try {
      await apiDeleteNotification(id);
      
      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      // Clear selection if deleted notification was selected
      if (selectedNotification?.id === id) {
        setSelectedNotification(null);
      }
      
      toast({
        title: 'Deleted',
        description: 'Notification deleted successfully'
      });
      
      // Refresh context
      refreshNotifications();
    } catch (error) {
      console.error('[NotificationsPage] Error deleting:', error);
      showApiError(error);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      
      // Update all notifications to read
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      
      toast({
        title: 'Success',
        description: 'All notifications marked as read'
      });
      
      // Refresh context
      refreshNotifications();
    } catch (error) {
      console.error('[NotificationsPage] Error marking all as read:', error);
      showApiError(error);
    }
  };

  // Refresh notifications
  const handleRefresh = async () => {
    await loadNotifications();
    await refreshNotifications();
    toast({
      title: 'Refreshed',
      description: 'Notifications updated'
    });
  };

  // Get icon for notification type
  const getNotificationIcon = (type: NotificationType, priority: string) => {
    const iconClass = priority === 'urgent' 
      ? 'text-red-500' 
      : priority === 'high' 
      ? 'text-orange-500' 
      : priority === 'medium'
      ? 'text-blue-500'
      : 'text-gray-500';

    switch (type) {
      case 'submission':
        return <FileText className={`h-5 w-5 ${iconClass}`} />;
      case 'webhook':
        return <Webhook className={`h-5 w-5 ${iconClass}`} />;
      case 'email':
        return <Mail className={`h-5 w-5 ${iconClass}`} />;
      case 'system':
        return <Settings className={`h-5 w-5 ${iconClass}`} />;
      case 'security':
        return <AlertTriangle className={`h-5 w-5 ${iconClass}`} />;
      case 'milestone':
        return <TrendingUp className={`h-5 w-5 ${iconClass}`} />;
      default:
        return <Bell className={`h-5 w-5 ${iconClass}`} />;
    }
  };

  // Format timestamp
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <AuthLayout>
      <BottomGradientRadial>
        <div className="flex flex-col md:ml-56 transition-all duration-300 ease-in-out">
          <DashboardNav />
          
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                  <Bell className="h-8 b-8 text-black" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-purple-800 dark:text-purple-200 tracking-tight">
                    Notifications
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    Stay updated with your form activity
                  </p>
                </div>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading || contextLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${(isLoading || contextLoading) ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllRead}
                  disabled={filteredNotifications.filter(n => !n.read).length === 0}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark all read
                </Button>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Type Filter */}
                <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="submission">Submissions</SelectItem>
                    <SelectItem value="email">Emails</SelectItem>
                    <SelectItem value="webhook">Webhooks</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="milestone">Milestones</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Tabs */}
              <Tabs value={filter} onValueChange={(value: any) => setFilter(value)} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-4">
                  <TabsTrigger value="all">
                    All ({notifications.filter(n => !n.archived).length})
                  </TabsTrigger>
                  <TabsTrigger value="unread">
                    Unread ({notifications.filter(n => !n.read && !n.archived).length})
                  </TabsTrigger>
                  <TabsTrigger value="read">
                    Read ({notifications.filter(n => n.read && !n.archived).length})
                  </TabsTrigger>
                  <TabsTrigger value="archived">
                    Archived ({notifications.filter(n => n.archived).length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Push Notification Settings */}
            <div className="mb-6">
              <PushNotificationSettings />
            </div>

            {/* Notifications List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* List View */}
              <div className="lg:col-span-2 space-y-3">
                {filteredNotifications.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Bell className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-gray-500 text-center">
                        {searchQuery ? 'No notifications match your search' : 'No notifications found'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        !notification.read ? 'border-l-4 border-l-purple-500 bg-purple-50/50 dark:bg-purple-900/10' : ''
                      } ${selectedNotification?.id === notification.id ? 'ring-2 ring-purple-500' : ''}`}
                      onClick={() => {
                        setSelectedNotification(notification);
                        if (!notification.read) {
                          handleMarkAsRead(notification.id);
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className="flex-shrink-0 p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                            {getNotificationIcon(notification.type, notification.priority)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                {notification.title}
                              </h3>
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            {/* Metadata badges */}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {notification.type}
                              </Badge>
                              {notification.metadata?.formName && (
                                <Badge variant="secondary" className="text-xs">
                                  {notification.metadata.formName}
                                </Badge>
                              )}
                              {notification.priority === 'urgent' && (
                                <Badge variant="destructive" className="text-xs">
                                  Urgent
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex-shrink-0 flex items-center gap-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                              >
                                <MailOpen className="h-4 w-4" />
                              </Button>
                            )}
                            {!notification.archived && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArchive(notification.id);
                                }}
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(notification.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Detail View (Email-like) */}
              <div className="lg:col-span-1">
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Notification Details
                    </CardTitle>
                    <CardDescription>
                      Select a notification to view details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedNotification ? (
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                          <div className="p-3 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900">
                            {getNotificationIcon(selectedNotification.type, selectedNotification.priority)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100">
                              {selectedNotification.title}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              {selectedNotification.timestamp.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Message */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Message
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedNotification.message}
                          </p>
                        </div>

                        {/* Metadata */}
                        {selectedNotification.metadata && (
                          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Additional Details
                            </h4>
                            
                            {selectedNotification.metadata.formName && (
                              <div>
                                <span className="text-xs text-gray-500">Form:</span>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {selectedNotification.metadata.formName}
                                </p>
                              </div>
                            )}

                            {selectedNotification.metadata.emailTo && (
                              <div>
                                <span className="text-xs text-gray-500">Recipient:</span>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {selectedNotification.metadata.emailTo}
                                </p>
                              </div>
                            )}

                            {selectedNotification.metadata.emailSubject && (
                              <div>
                                <span className="text-xs text-gray-500">Subject:</span>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {selectedNotification.metadata.emailSubject}
                                </p>
                              </div>
                            )}

                            {selectedNotification.metadata.emailBody && (
                              <div>
                                <span className="text-xs text-gray-500">Email Body:</span>
                                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                  {selectedNotification.metadata.emailBody}
                                </div>
                              </div>
                            )}

                            {selectedNotification.metadata.webhookUrl && (
                              <div>
                                <span className="text-xs text-gray-500">Webhook URL:</span>
                                <p className="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                                  {selectedNotification.metadata.webhookUrl}
                                </p>
                              </div>
                            )}

                            {selectedNotification.metadata.status && (
                              <div>
                                <span className="text-xs text-gray-500">Status:</span>
                                <Badge
                                  variant={selectedNotification.metadata.status === 'failed' ? 'destructive' : 'default'}
                                  className="ml-2"
                                >
                                  {selectedNotification.metadata.status}
                                </Badge>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                          {selectedNotification.metadata?.formId && (
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => router.push(`/forms/${selectedNotification.metadata?.formId}`)}
                            >
                              View Form
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleArchive(selectedNotification.id)}
                          >
                            Archive
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">
                          Select a notification to view its details
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </BottomGradientRadial>
    </AuthLayout>
  );
}
