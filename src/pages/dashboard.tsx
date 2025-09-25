"use client";
import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, AreaChart, Area, CartesianGrid, Legend } from 'recharts';
import { ChartBarStackedAnalytics } from '../components/ChartBarStackedAnalytics';
import { ChartAreaInteractiveBackend } from '../components/ChartAreaInteractiveBackend';
import { getDashboardAnalytics, getDashboardSummary, getSubmissions } from '../services/api';
import MetricCard from '../components/dashboard/MetricCard';
import WelcomeBlock from '../components/dashboard/WelcomeBlock';
import DashboardSummaryWidget from '../components/dashboard/DashboardSummaryWidget';
import DashboardNav from '../components/DashboardNav';
import BottomGradientRadial from '../components/BottomGradientRadial';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import ToastView from '../components/ToastView';
import { useForms } from '../context/FormsContext';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import AuthLayout from '../components/AuthLayout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  FileText, 
  BarChart3, 
  Webhook, 
  Bell, 
  Users, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  Search, 
  Plus, 
  Download, 
  RefreshCcw, 
  ExternalLink,
  Calendar,
  Clock,
  Target,
  Zap
} from 'lucide-react';

// Simple avatar component for email initials
function EmailAvatar({ email }: { email: string }) {
  const getInitials = (email: string) => {
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
  };

  const getAvatarColor = (email: string) => {
    if (!email) return 'from-gray-400 to-gray-600';
    const colors = [
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600', 
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-indigo-400 to-indigo-600',
      'from-teal-400 to-teal-600',
      'from-orange-400 to-orange-600',
      'from-red-400 to-red-600'
    ];
    const index = email.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className={`h-10 w-10 rounded-full bg-gradient-to-r ${getAvatarColor(email)} flex items-center justify-center shadow-sm`}>
      <span className="text-white font-semibold text-sm">
        {getInitials(email)}
      </span>
    </div>
  );
}

// Simple avatar component for form names
function FormAvatar({ name }: { name: string }) {
  const getInitials = (name: string) => {
    if (!name) return '?';
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    if (!name) return 'from-gray-400 to-gray-600';
    const colors = [
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600', 
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-indigo-400 to-indigo-600',
      'from-teal-400 to-teal-600',
      'from-orange-400 to-orange-600',
      'from-red-400 to-red-600'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className={`h-10 w-10 rounded-lg bg-gradient-to-r ${getAvatarColor(name)} flex items-center justify-center shadow-sm`}>
      <span className="text-white font-semibold text-sm">
        {getInitials(name)}
      </span>
    </div>
  );
}

// Trend chart using recharts, styled with shadcn Card
const trendLabels = {
  today: 'today',
  yesterday: 'yesterday',
  '7d': 'last 7 days',
  '14d': 'last 2 weeks',
} as const;
type TrendRange = keyof typeof trendLabels;

function ModernTrendChart({ data, trendRange, chartType, onChartTypeChange, onTrendRangeChange }: {
  data: { date: string; count: number }[];
  trendRange: TrendRange;
  chartType: 'bar' | 'line' | 'area';
  onChartTypeChange: (type: 'bar' | 'line' | 'area') => void;
  onTrendRangeChange: (range: TrendRange) => void;
}) {
  const hasData = Array.isArray(data) && data.length > 0;
  
  return (
    <Card className="w-full bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
      <CardHeader className="pb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Submissions Trend
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {trendRange === 'today' && 'Track your form submissions for today'}
              {trendRange === 'yesterday' && 'Yesterday\'s form submission activity'}
              {trendRange === '7d' && 'Submission trends over the last week'}
              {trendRange === '14d' && 'Two weeks of submission analytics'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Select value={trendRange} onValueChange={(value) => onTrendRangeChange(value as TrendRange)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="14d">Last 2 Weeks</SelectItem>
              </SelectContent>
            </Select>
            <Select value={chartType} onValueChange={(value) => onChartTypeChange(value as 'bar' | 'line' | 'area')}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Chart type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {hasData ? (
              chartType === 'bar' ? (
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} 
                    contentStyle={{ 
                      background: '#fff', 
                      borderRadius: 12, 
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Bar dataKey="count" fill="url(#barGradient)" radius={[4, 4, 0, 0]}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              ) : chartType === 'line' ? (
                <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#fff', 
                      borderRadius: 12, 
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    dot={{ r: 6, fill: '#6366f1' }}
                    activeDot={{ r: 8, fill: '#8b5cf6' }}
                  />
                </LineChart>
              ) : (
                <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#fff', 
                      borderRadius: 12, 
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#6366f1" 
                    fill="url(#areaGradient)" 
                    strokeWidth={3} 
                  >
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                  </Area>
                </AreaChart>
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 w-20 h-20 flex items-center justify-center mx-auto">
                    <BarChart3 className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white text-lg font-semibold mb-1">No data available</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Data will appear here once you have form submissions</p>
                  </div>
                </div>
              </div>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentSubmissionsCard({ submissions, loading }: { submissions: any[]; loading: boolean }) {
  if (loading) {
    return (
      <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Recent Submissions</CardTitle>
          <CardDescription>Latest form submissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Recent Submissions
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Latest form submissions from your users
            </CardDescription>
          </div>
          <Button asChild className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 bg-transparent flex items-center gap-2 text-sm px-3 py-2 h-8">
            <Link href="/submissions">
              <ExternalLink className="h-4 w-4" />
              View All
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {submissions && submissions.length > 0 ? (
          <div className="space-y-4">
            {submissions.slice(0, 5).map((sub, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                <div className="flex items-center space-x-4">
                  <EmailAvatar email={sub.email || ''} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{sub.form_name || 'Untitled Form'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{sub.email || 'No email'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={sub.status === 'success' ? 'default' : 'destructive'} className="mb-1">
                    {sub.status || 'unknown'}
                  </Badge>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {sub.date ? new Date(sub.date).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 w-24 h-24 flex items-center justify-center mx-auto">
              <Activity className="h-12 w-12 text-gray-400 dark:text-gray-500" />
            </div>
            <div>
              <p className="text-gray-900 dark:text-white text-lg font-semibold mb-1">No submissions yet</p>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Form submissions will appear here once users start filling out your forms</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionsCard() {
  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-2xl">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Quick Actions</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          Common tasks to manage your forms
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
          <Link href="/forms/new" className="flex items-center gap-2 justify-center">
            <Plus className="h-4 w-4" />
            Create New Form
          </Link>
        </Button>
        <Button asChild className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white border-0">
          <Link href="/forms" className="flex items-center gap-2 justify-center">
            <FileText className="h-4 w-4" />
            Manage Forms
          </Link>
        </Button>
        <Button asChild className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white border-0">
          <Link href="/webhooks" className="flex items-center gap-2 justify-center">
            <Webhook className="h-4 w-4" />
            Configure Webhooks
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function DashboardContent({
  user,
  forms,
  loading,
  error,
  notificationCount,
  setNotificationCount,
  recentSubmissions,
  search,
  setSearch,
  toastViewRef,
  totalForms,
  totalSubmissions,
  webhookSuccessRate,
  trendData,
  trendRange,
  setTrendRange,
  trendChartType,
  setTrendChartType,
  analytics,
  analyticsRange,
  setAnalyticsRange,
  refreshing,
  setRefreshing,
}) {
  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const displayTotalForms = Array.isArray(forms) ? forms.length : 0;

  return (
    <>
      <DashboardNav notificationCount={notificationCount} />
      
      <div className="space-y-8">
        {/* Welcome Section */}
        <WelcomeBlock
          username={user?.name || user?.email?.split('@')[0] || 'User'}
          userEmail={user?.email}
          stats={{
            submissions: totalSubmissions,
            failedWebhooks: Math.round((100 - webhookSuccessRate) * totalSubmissions / 100)
          }}
        />

        {/* Dashboard Summary Widget */}
        <DashboardSummaryWidget
          totalForms={displayTotalForms}
          totalSubmissions={totalSubmissions}
          recentSubmissions={recentSubmissions}
          webhookSuccessRate={webhookSuccessRate}
          activeWebhooks={Math.floor(webhookSuccessRate * totalSubmissions / 100)}
          failedWebhooks={Math.floor((100 - webhookSuccessRate) * totalSubmissions / 100)}
          loading={loading}
          onRefresh={handleRefresh}
        />

        {/* Metrics Overview - Legacy (can be removed if preferred) */}
        {false && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              icon={FileText}
              label="Total Forms"
              value={displayTotalForms}
              loading={loading}
              tooltip="Number of forms you have created"
            />
            <MetricCard
              icon={BarChart3}
              label="Total Submissions"
              value={totalSubmissions.toLocaleString()}
              loading={loading}
              tooltip="All submissions received across your forms"
            />
            <MetricCard
              icon={Target}
              label="Success Rate"
              value={`${webhookSuccessRate}%`}
              loading={loading}
              tooltip="Percentage of successful webhook deliveries"
            />
            <MetricCard
              icon={Bell}
              label="Notifications"
              value={notificationCount}
              loading={loading}
              tooltip="Unread notifications and alerts"
            />
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ModernTrendChart
              data={trendData}
              trendRange={trendRange}
              chartType={trendChartType}
              onChartTypeChange={setTrendChartType}
              onTrendRangeChange={setTrendRange}
            />
          </div>
          <div>
            <QuickActionsCard />
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="space-y-6">
          <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Submissions vs Errors Analytics
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Detailed breakdown of successful submissions and errors over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartBarStackedAnalytics
                data={analytics.length ? analytics : [{ 
                  date: '2025-09-22T12:00:00.000Z', 
                  value1: 0, 
                  value2: 0, 
                  label1: 'Submissions', 
                  label2: 'Errors' 
                }]}
                title="Submissions vs Errors"
                description="Stacked bar chart of submissions and errors by day."
                label1="Submissions"
                label2="Errors"
                color1="#6366f1"
                color2="#f43f5e"
              />
            </CardContent>
          </Card>

          <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">
                Interactive Analytics Dashboard
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Advanced analytics with customizable time ranges and metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartAreaInteractiveBackend range={analyticsRange} setRange={setAnalyticsRange} />
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentSubmissionsCard submissions={recentSubmissions} loading={loading} />
          
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-2xl">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    Your Forms
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    Quick overview of your active forms
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 bg-transparent text-sm px-3 py-2 h-8" onClick={handleRefresh} disabled={refreshing}>
                    <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-2 h-8">
                    <Link href="/forms">View All</Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : forms && forms.length > 0 ? (
                <div className="space-y-4">
                  {forms.slice(0, 4).map((form, i) => (
                    <div key={form.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center space-x-4">
                        <FormAvatar name={form.name} />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{form.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {form.created_at ? new Date(form.created_at).toLocaleDateString() : 'Recently created'}
                          </p>
                        </div>
                      </div>
                      <Button asChild className="bg-transparent hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border-0 text-sm px-3 py-2 h-8">
                        <Link href={`/forms/${form.id}`} className="flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          View
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-full p-8 w-20 h-20 flex items-center justify-center mx-auto border border-indigo-200 dark:border-indigo-800">
                    <FileText className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white text-lg font-semibold mb-2">No forms yet</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">Create your first form to get started</p>
                    <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
                      <Link href="/forms/new" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create Form
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ToastView ref={toastViewRef} />
    </>
  );
}

function DashboardPageImpl() {
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();
  const { user } = useAuth ? useAuth() : { user: null };
  const { forms, isLoading: loading, error } = useForms ? useForms() : { forms: [], isLoading: false, error: null };
  const { isCollapsed } = useSidebar();
  
  const [refreshing, setRefreshing] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3); // Sample notification count
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const toastViewRef = useRef<any>(null);
  const [totalForms, setTotalForms] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [webhookSuccessRate, setWebhookSuccessRate] = useState(100);
  const [trendData, setTrendData] = useState<{ date: string; count: number }[]>([]);
  const [trendRange, setTrendRange] = useState<TrendRange>('7d');
  const [trendChartType, setTrendChartType] = useState<'bar' | 'line' | 'area'>('area');
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [analyticsRange, setAnalyticsRange] = useState('7d');

  useEffect(() => {
    setHydrated(true);
    
    // Suppress annoying browser extension errors in console
    const originalError = console.error;
    console.error = (...args) => {
      // Filter out known browser extension errors
      const message = args[0]?.toString() || '';
      if (message.includes('content_script.bundle.js') || 
          message.includes('chrome-extension://') ||
          message.includes('monica') ||
          message.includes('permission error')) {
        return; // Don't log these
      }
      originalError.apply(console, args);
    };
    
    return () => {
      console.error = originalError; // Cleanup
    };
  }, []);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace('/login');
    }
  }, [hydrated, user, router]);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      
      try {
        console.log('[Dashboard] Fetching dashboard summary from /dashboard/summary endpoint...');
        
        // Use the actual dashboard summary endpoint
        const summaryRes = await getDashboardSummary(30); // Get last 30 days
        console.log('[Dashboard] Dashboard summary response:', summaryRes);
        
        if (summaryRes) {
          // Update state with API response data
          setTotalForms(summaryRes.total_forms || 0);
          setTotalSubmissions(summaryRes.total_submissions || 0);
          setRecentSubmissions(summaryRes.recent_submissions || []);
          
          // Set webhook success rate based on webhook stats
          if (summaryRes.webhook_stats && summaryRes.webhook_stats.total > 0) {
            const successRate = (summaryRes.webhook_stats.delivered / summaryRes.webhook_stats.total) * 100;
            setWebhookSuccessRate(Math.round(successRate));
          } else {
            setWebhookSuccessRate(100); // Default if no webhook data
          }
          
          // Set trend data from the summary
          if (summaryRes.trend && Array.isArray(summaryRes.trend)) {
            setTrendData(summaryRes.trend.map(item => ({
              date: item.date,
              count: item.count
            })));
          }
          
          console.log('[Dashboard] Successfully updated dashboard with API data:', {
            totalForms: summaryRes.total_forms,
            totalSubmissions: summaryRes.total_submissions,
            recentSubmissions: summaryRes.recent_submissions?.length || 0,
            webhookStats: summaryRes.webhook_stats
          });
        } else {
          console.warn('[Dashboard] Dashboard summary returned empty response');
          throw new Error('Empty response from dashboard summary');
        }
        
        // Try to get additional analytics data (optional)
        try {
          const analyticsRes = await getDashboardAnalytics({ range: analyticsRange });
          console.log('[Dashboard] Dashboard analytics response:', analyticsRes);
          setAnalytics(analyticsRes.analytics || []);
        } catch (analyticsErr) {
          console.log('[Dashboard] Analytics data not available (this is ok):', analyticsErr);
          setAnalytics([]);
        }
        
      } catch (err) {
        console.error('[Dashboard] Dashboard summary API error:', err);
        
        // Show specific error message
        toastViewRef.current?.addNotification(
          'error',
          'Dashboard Error',
          `Failed to load dashboard data: ${err.message || 'Unknown error'}. Please check your authentication and try again.`,
          true,
          8000
        );
        
        // Fallback: try to calculate from forms data if available
        if (forms && Array.isArray(forms) && forms.length > 0) {
          console.log('[Dashboard] Falling back to calculating from forms data...');
          setTotalForms(forms.length);
          
          // Try to get submission count from individual forms
          let totalSubmissionsCount = 0;
          for (const form of forms) {
            try {
              const submissionsRes = await getSubmissions(form.id);
              if (submissionsRes && submissionsRes.submissions) {
                totalSubmissionsCount += submissionsRes.submissions.length;
              } else if (Array.isArray(submissionsRes)) {
                totalSubmissionsCount += submissionsRes.length;
              }
            } catch (submissionErr) {
              console.warn(`[Dashboard] Could not fetch submissions for form ${form.id}:`, submissionErr);
            }
          }
          
          setTotalSubmissions(totalSubmissionsCount);
          setWebhookSuccessRate(0);
          setTrendData([]);
          setRecentSubmissions([]);
          
          console.log('[Dashboard] Fallback calculation complete:', {
            totalForms: forms.length,
            totalSubmissions: totalSubmissionsCount
          });
        } else {
          // Complete fallback
          setTotalForms(0);
          setTotalSubmissions(0);
          setWebhookSuccessRate(0);
          setTrendData([]);
          setRecentSubmissions([]);
        }
        
        setAnalytics([]);
      }
    }
    
    fetchDashboardData();
  }, [analyticsRange, user, forms]);

  useEffect(() => {
    if (error) {
      toastViewRef.current?.addNotification(
        'error',
        'Forms Error',
        typeof error === 'string' ? error : 'Failed to load forms.',
        true,
        4000
      );
    }
  }, [error]);

  return (
    <AuthLayout>
      <BottomGradientRadial>
        <div className={`min-h-screen flex flex-col ${isCollapsed ? 'md:ml-16' : 'md:ml-56'} transition-all duration-300 ease-in-out`}>
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
            {(!hydrated || !user) ? (
              <div className="flex items-center justify-center h-full min-h-[60vh]">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                  <span className="text-gray-600 text-lg font-medium">
                    {!hydrated ? 'Loading dashboard...' : 'Redirecting to login...'}
                  </span>
                </div>
              </div>
            ) : (
              <DashboardContent
                user={user}
                forms={forms}
                loading={loading}
                error={error}
                notificationCount={notificationCount}
                setNotificationCount={setNotificationCount}
                recentSubmissions={recentSubmissions}
                search={search}
                setSearch={setSearch}
                toastViewRef={toastViewRef}
                totalForms={totalForms}
                totalSubmissions={totalSubmissions}
                webhookSuccessRate={webhookSuccessRate}
                trendData={trendData}
                trendRange={trendRange}
                setTrendRange={setTrendRange}
                trendChartType={trendChartType}
                setTrendChartType={setTrendChartType}
                analytics={analytics}
                analyticsRange={analyticsRange}
                setAnalyticsRange={setAnalyticsRange}
                refreshing={refreshing}
                setRefreshing={setRefreshing}
              />
            )}
          </main>
        </div>
      </BottomGradientRadial>
    </AuthLayout>
  );
}

const DashboardPage = dynamic(() => Promise.resolve(DashboardPageImpl), { ssr: false });
export default DashboardPage;
