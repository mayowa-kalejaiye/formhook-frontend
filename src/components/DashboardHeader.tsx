"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from './ui/button';
import {
  Bell,
  ChevronDown,
  MessageSquare,
  AlertTriangle,
  Inbox,
  FileJson,
  FileSpreadsheet,
  FileText,
  Download,
  User,
  Settings,
  LogOut,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import NavigationControls from './NavigationControls';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { getDashboardSummary } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { safeReplace } from '../lib/navigation';
import { useNotifications } from '../context/NotificationContext';

export default function DashboardHeader() {
  const [recentSubmissions, setRecentSubmissions] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const {
    planLabel,
    submissionsLimit,
    submissionsUsed,
    submissionsPercent,
  } = useSubscription();
  const router = useRouter();
  const hasUsageMetrics = typeof submissionsLimit === 'number' && typeof submissionsUsed === 'number';
  const planUsageLabel = submissionsLimit
    ? hasUsageMetrics
      ? `${submissionsUsed.toLocaleString()} / ${submissionsLimit.toLocaleString()} submissions`
      : `${submissionsLimit.toLocaleString()} submissions limit`
    : 'Unlimited submissions';
  // Get initials from email
  const getInitials = (email: string) => {
    if (!email) return 'U';
    const parts = email.split('@')[0];
    if (parts.length >= 2) {
      return (parts[0] + parts[1]).toUpperCase().slice(0, 2);
    }
    return parts.slice(0, 2).toUpperCase();
  };

  // Generate consistent color based on email
  const getAvatarColor = (email: string) => {
    if (!email) return 'bg-slate-600';
    const colors = [
      'bg-blue-600',
      'bg-purple-600',
      'bg-pink-600',
      'bg-indigo-600',
      'bg-teal-600',
      'bg-cyan-600',
      'bg-emerald-600',
      'bg-violet-600',
    ];
    const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const handleLogout = async () => {
    await logout();
    safeReplace(router, '/login');
  };

  const handleExport = async (format: 'json' | 'csv' | 'txt') => {
    setIsExporting(true);
    try {
      const data = await getDashboardSummary(30); // Get last 30 days of data
      
      let content: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          content = JSON.stringify(data, null, 2);
          filename = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;
        case 'csv':
          // Convert data to CSV format
          const headers = ['Metric', 'Value'];
          const rows = [
            ['Total Forms', data.total_forms || 0],
            ['Total Submissions', data.total_submissions || 0],
            ['Webhook Total', data.webhook_stats?.total || 0],
            ['Webhook Delivered', data.webhook_stats?.delivered || 0],
            ['Webhook Failed', data.webhook_stats?.failed || 0],
          ];
          content = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
          filename = `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
        case 'txt':
          // Convert data to plain text format
          content = `Dashboard Export - ${new Date().toISOString().split('T')[0]}\n\n`;
          content += `Total Forms: ${data.total_forms || 0}\n`;
          content += `Total Submissions: ${data.total_submissions || 0}\n`;
          content += `Webhook Total: ${data.webhook_stats?.total || 0}\n`;
          content += `Webhook Delivered: ${data.webhook_stats?.delivered || 0}\n`;
          content += `Webhook Failed: ${data.webhook_stats?.failed || 0}\n`;
          filename = `dashboard-export-${new Date().toISOString().split('T')[0]}.txt`;
          mimeType = 'text/plain';
          break;
      }

      // Create and trigger download
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="fixed top-14 md:top-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 md:ml-64">
      <div className="flex h-16 items-center justify-between px-6">
        <NavigationControls />

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex min-w-0 max-w-sm flex-col items-end text-xs text-slate-500 mr-4">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-100">{planLabel || 'Free'}</span>
          <div className="flex w-full flex-wrap items-center justify-end gap-x-2 gap-y-1">
            <span>{planUsageLabel}</span>
            {typeof submissionsPercent === 'number' && (
              <span className={submissionsPercent >= 80 ? 'text-amber-600 font-semibold' : ''}>{submissionsPercent}%</span>
            )}
          </div>
          </div>

          <div className="flex items-center gap-6 mr-6">
            <Link
            href="/webhooks"
            className="relative inline-flex items-center text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-full p-2 transition-colors"
            title="Failed Webhooks"
          >
            <AlertTriangle className="h-5 w-5" />
          </Link>
          <div className="relative">
            <Link 
              href="/notifications" 
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
            </Link>
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <div className="relative">
            <Link 
              href="/submissions" 
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Submissions"
            >
              <Inbox className="h-5 w-5" />
            </Link>
            {recentSubmissions > 0 && (
              <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-medium text-white">
                {recentSubmissions}
              </span>
            )}
          </div>
        </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
                  <div className={`h-7 w-7 rounded-full ${getAvatarColor(user?.email || '')} flex items-center justify-center text-white text-sm font-semibold`}>
                    {getInitials(user?.email || '')}
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-800 text-slate-900 dark:text-slate-100">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">My Account</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate" title={user?.email}>
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/account" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Account Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Preferences</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-1.5 text-sm"
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <Download className="h-3.5 w-3.5 animate-pulse" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      Share
                      <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-800 text-slate-900 dark:text-slate-100">
                <DropdownMenuLabel>Export Dashboard</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport('json')} className="cursor-pointer">
                  <FileJson className="mr-2 h-4 w-4" />
                  <span>Export as JSON</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  <span>Export as CSV</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('txt')} className="cursor-pointer">
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Export as Text</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
