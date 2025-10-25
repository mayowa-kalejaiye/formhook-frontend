import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Dynamic Chart Components
import dynamic from 'next/dynamic';
import { ChartBarStackedAnalytics } from '../components/ChartBarStackedAnalytics';
import { ChartAreaInteractiveBackend } from '../components/ChartAreaInteractiveBackend';

// Dynamic Recharts Components
const DynamicResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const DynamicBarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const DynamicBar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const DynamicXAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const DynamicYAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const DynamicTooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const DynamicLineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false });
const DynamicLine = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });
const DynamicAreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const DynamicArea = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const DynamicCartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });

// Components
import DashboardHeader from '../components/DashboardHeader';
import { getDashboardSummary, getSubmissions, getFormAnalytics } from '../services/api';
import MetricCard from '../components/dashboard/MetricCard';
import WelcomeBlock from '../components/dashboard/WelcomeBlock';
import DashboardSummaryWidget from '../components/dashboard/DashboardSummaryWidget';
import RecentActivities from '../components/dashboard/RecentActivities';
import DashboardNav from '../components/DashboardNav';
import BottomGradientRadial from '../components/BottomGradientRadial';
import { useNotifications } from '../context/NotificationContext';
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
  Zap,
  Code
} from 'lucide-react';

// Professional avatar component for email initials
function EmailAvatar({ email }: { email: string }) {
  const getInitials = (email: string, name: string) => {
    // Always return "F" for FormHook branding
    return "F";
  };

  return (
    <div className="h-10 w-10 rounded-md bg-slate-600 dark:bg-slate-700 flex items-center justify-center border border-slate-300 dark:border-slate-600">
      <span className="text-white font-semibold text-sm">
        F
      </span>
    </div>
  );
}

// Professional avatar component for form names
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
    if (!name) return 'bg-slate-400 dark:bg-slate-600';
    // Professional slate-based colors only
    const colors = [
      'bg-slate-500 dark:bg-slate-600',
      'bg-slate-600 dark:bg-slate-700', 
      'bg-slate-700 dark:bg-slate-800',
      'bg-slate-500 dark:bg-slate-600',
      'bg-slate-600 dark:bg-slate-700',
      'bg-slate-700 dark:bg-slate-800',
      'bg-slate-500 dark:bg-slate-600',
      'bg-slate-600 dark:bg-slate-700'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className={`h-10 w-10 rounded-md ${getAvatarColor(name)} flex items-center justify-center border border-slate-300 dark:border-slate-600`}>
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
    <Card className="pro-card">
      <CardHeader className="pb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Submissions Trend
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
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
          <DynamicResponsiveContainer width="100%" height="100%">
            {hasData ? (
              chartType === 'bar' ? (
                <DynamicBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <DynamicCartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <DynamicXAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <DynamicYAxis 
                    allowDecimals={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <DynamicTooltip 
                    cursor={{ fill: 'rgba(71, 85, 105, 0.1)' }} 
                    contentStyle={{ 
                      background: '#fff', 
                      borderRadius: 8, 
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <DynamicBar dataKey="count" fill="#64748b" radius={[4, 4, 0, 0]} />
                </DynamicBarChart>
              ) : chartType === 'line' ? (
                <DynamicLineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <DynamicCartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <DynamicXAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <DynamicYAxis 
                    allowDecimals={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <DynamicTooltip 
                    contentStyle={{ 
                      background: '#fff', 
                      borderRadius: 8, 
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <DynamicLine 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#64748b" 
                    strokeWidth={2} 
                    dot={{ r: 4, fill: '#64748b' }}
                    activeDot={{ r: 6, fill: '#475569' }}
                  />
                </DynamicLineChart>
              ) : (
                <DynamicAreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <DynamicCartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <DynamicXAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <DynamicYAxis 
                    allowDecimals={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <DynamicTooltip 
                    contentStyle={{ 
                      background: '#fff', 
                      borderRadius: 8, 
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <DynamicArea 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#64748b" 
                    fill="rgba(100, 116, 139, 0.1)" 
                    strokeWidth={2} 
                  />
                </DynamicAreaChart>
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-md p-6 w-20 h-20 flex items-center justify-center mx-auto">
                    <BarChart3 className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div>
                    <p className="text-slate-900 dark:text-slate-100 text-lg font-semibold mb-1">No data available</p>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Data will appear here once you have form submissions</p>
                  </div>
                </div>
              </div>
            )}
          </DynamicResponsiveContainer>
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
    <Card className="pro-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Recent Submissions
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Latest form submissions from your users
            </CardDescription>
          </div>
          <Button asChild className="pro-btn-secondary flex items-center gap-2 text-sm px-3 py-2 h-8">
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
              <div key={i} className="flex items-center justify-between p-4 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors">
                <div className="flex items-center space-x-4">
                  <EmailAvatar email={sub.email || ''} />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{sub.form_name || 'Untitled Form'}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{sub.email || 'No email'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={sub.status === 'success' ? 'default' : 'destructive'} className="mb-1">
                    {sub.status || 'unknown'}
                  </Badge>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {sub.date ? new Date(sub.date).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-md p-6 w-24 h-24 flex items-center justify-center mx-auto">
              <Activity className="h-12 w-12 text-slate-400 dark:text-slate-500" />
            </div>
            <div>
              <p className="text-slate-900 dark:text-slate-100 text-lg font-semibold mb-1">No submissions yet</p>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Form submissions will appear here once users start filling out your forms</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// function QuickActionsCard() {
//   return (
//     <Card className="pro-card">
//       <CardHeader className="border-b border-slate-200 dark:border-slate-700">
//         <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">Quick Actions</CardTitle>
//         <CardDescription className="text-slate-600 dark:text-slate-400">
//           Common tasks to manage your forms
//         </CardDescription>
//       </CardHeader>
//       <CardContent className="space-y-3 pt-6">
//         <Button asChild className="pro-btn-primary w-full">
//           <Link href="/forms/new" className="flex items-center gap-2 justify-center">
//             <Plus className="h-4 w-4" />
//             Create New Form
//           </Link>
//         </Button>
//         <Button asChild className="pro-btn-secondary w-full">
//           <Link href="/forms" className="flex items-center gap-2 justify-center">
//             <FileText className="h-4 w-4" />
//             Manage Forms
//           </Link>
//         </Button>
//         <Button asChild className="pro-btn-secondary w-full">
//           <Link href="/webhooks" className="flex items-center gap-2 justify-center">
//             <Webhook className="h-4 w-4" />
//             Configure Webhooks
//           </Link>
//         </Button>
//         <Button asChild className="pro-btn-secondary w-full">
//           <Link href="/api-integration" className="flex items-center gap-2 justify-center">
//             <Code className="h-4 w-4" />
//             API Integration Guide
//           </Link>
//         </Button>
//       </CardContent>
//     </Card>
//   );
// }

function TopFormsCard({ forms, loading }: { forms?: any[]; loading?: boolean }) {
  const top = (forms || []).slice().sort((a: any, b: any) => (b.submission_count || 0) - (a.submission_count || 0)).slice(0, 6);

  return (
    <Card className="pro-card">
      <CardHeader className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">Top Forms</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Forms with the most submissions (descending)</CardDescription>
          </div>
          <Button asChild className="pro-btn-secondary text-sm px-3 py-2 h-8">
            <Link href="/forms">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : top && top.length > 0 ? (
          <div className="space-y-4">
            {top.map((form: any) => (
              <div key={form.id} className="flex items-center justify-between p-4 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors">
                <div className="flex items-center space-x-4">
                  <FormAvatar name={form.name} />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{form.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{(form.submission_count || 0).toLocaleString()} submissions</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {form.recent_submissions ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">{form.recent_submissions} recent</Badge>
                  ) : null}
                  <Button asChild className="pro-btn-secondary text-sm px-3 py-2 h-8">
                    <Link href={`/forms/${form.id}`} className="flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      View
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-md p-8 w-20 h-20 flex items-center justify-center mx-auto">
              <Users className="h-10 w-10 text-slate-400 dark:text-slate-500" />
            </div>
            <div>
              <p className="text-slate-900 dark:text-slate-100 text-lg font-semibold mb-2">No forms yet</p>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Create your first form to get started</p>
            </div>
          </div>
        )}
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
  recentSubmissions,
  recentLoading,
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
  interactiveAnalytics,
  analyticsRange,
  setAnalyticsRange,
  refreshing,
  setRefreshing,
  previousPeriodForms,
  previousPeriodSubmissions,
}) {
  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const displayTotalForms = Array.isArray(forms) ? forms.length : 0;

  return (
    <div className="bg-slate-50 dark:bg-slate-900">
      <DashboardNav />
      
      <div className="w-full">
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[120px] md:pt-8 pb-8">

        {/* Dashboard Summary Widget - Overview Stats Only */}
        <DashboardSummaryWidget
          totalForms={displayTotalForms}
          totalSubmissions={totalSubmissions}
          recentSubmissions={recentSubmissions}
          webhookSuccessRate={webhookSuccessRate}
          activeWebhooks={Math.floor(webhookSuccessRate * totalSubmissions / 100)}
          failedWebhooks={Math.floor((100 - webhookSuccessRate) * totalSubmissions / 100)}
          loading={loading}
          onRefresh={handleRefresh}
          previousPeriodForms={previousPeriodForms}
          previousPeriodSubmissions={previousPeriodSubmissions}
        />
  
        {/* Top Forms and Submission Trend - REORGANIZED */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TopFormsCard forms={forms} loading={loading} />
          
          {/* Submission Trend Chart - Moved here from below */}
          <ModernTrendChart
            data={trendData}
            trendRange={trendRange}
            chartType={trendChartType}
            onChartTypeChange={setTrendChartType}
            onTrendRangeChange={setTrendRange}
          />
        </div>

        {/* Recent Activities - Detailed View */}
        <RecentActivities 
          activities={recentSubmissions.map((sub: any) => {
            const submissionDate = new Date(sub.date || sub.created_at || sub.timestamp);
            
            // Ensure status is one of the valid values
            let validStatus: 'success' | 'failed' | 'pending' = 'success';
            if (sub.status === 'failed' || sub.status === 'pending' || sub.status === 'success') {
              validStatus = sub.status;
            } else if (sub.webhook_delivered === false || sub.error) {
              validStatus = 'failed';
            }
            
            return {
              id: sub.id,
              form_name: sub.form_name,
              form_id: sub.form_id,
              email: sub.email || 'N/A',
              date: submissionDate.toISOString(),
              time: submissionDate.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              }),
              status: validStatus,
              submission_data: sub.data || sub.submission_data
            };
          })}
          loading={loading || recentLoading}
        />

        {/* Quick Actions and System Health - NOW BELOW RECENT SUBMISSIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions Panel */}
          <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Quick Actions
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <Button asChild variant="outline" className="justify-start h-16 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                  <Link href="/forms/new" className="flex items-center gap-3">
                    <div className="p-2 border rounded-lg">
                      <Plus className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">New Form</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Create a new form endpoint</span>
                    </div>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start h-16 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                  <Link href="/submissions" className="flex items-center gap-3">
                    <div className="p-2 border rounded-lg">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">View Submissions</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Browse all form submissions</span>
                    </div>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start h-16 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                  <Link href="/analytics" className="flex items-center gap-3">
                    <div className="p-2 border rounded-lg">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Analytics</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">View detailed form analytics</span>
                    </div>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start h-16 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                  <Link href="/webhooks" className="flex items-center gap-3">
                    <div className="p-2 border rounded-lg">
                      <Webhook className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Webhooks</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Configure form webhooks</span>
                    </div>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Health Panel */}
          <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                System Health
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Current status of your integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Webhook Health */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Webhook Delivery</span>
                  <Badge variant={webhookSuccessRate >= 95 ? 'default' : 'destructive'}>
                    {webhookSuccessRate >= 95 ? 'Healthy' : 'Issues Detected'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${webhookSuccessRate >= 95 ? 'bg-green-500' : webhookSuccessRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium">{webhookSuccessRate.toFixed(1)}% Success Rate</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      webhookSuccessRate >= 95 ? 'bg-green-500' : 
                      webhookSuccessRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${webhookSuccessRate}%` }}
                  ></div>
                </div>
              </div>

              {/* API Status - Based on successful data fetch */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">API Status</span>
                  <Badge variant={!loading && totalForms >= 0 ? 'default' : 'destructive'}>
                    {!loading && totalForms >= 0 ? 'Operational' : 'Checking...'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className={`w-2 h-2 rounded-full ${!loading && totalForms >= 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  {!loading && totalForms >= 0 ? 'All systems operational' : 'Connecting to API...'}
                </div>
              </div>

              {/* Forms & Submissions Stats */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Overview</span>
                  <Badge variant="default">{totalForms} Forms</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Submissions</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{totalSubmissions.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Recent Activity (24h)</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{notificationCount}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="h-2 bg-blue-500 rounded-full transition-all duration-500" 
                      style={{ width: `${totalSubmissions > 0 ? Math.min(100, (totalSubmissions / (totalForms * 10)) * 100) : 0}%` }}
                      title={`Average ${totalForms > 0 ? (totalSubmissions / totalForms).toFixed(1) : 0} submissions per form`}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Avg: {totalForms > 0 ? (totalSubmissions / totalForms).toFixed(1) : 0} submissions per form
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

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

        {/* Professional Analytics Charts */}
        <div className="space-y-6">
          <Card className="pro-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Submissions vs Errors Analytics
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
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
                color1="#64748b"
                color2="#ef4444"
              />
            </CardContent>
          </Card>

          <Card className="pro-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Interactive Analytics Dashboard
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Advanced analytics with customizable time ranges and metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartAreaInteractiveBackend 
                range={analyticsRange} 
                setRange={setAnalyticsRange} 
                analyticsData={interactiveAnalytics}
              />
            </CardContent>
          </Card>
        </div>

        {/* Simple Footer */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-700 mb-8">
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} FormHook. All rights reserved.
          </p>
        </div>
        </div>
      </div>
      <ToastView ref={toastViewRef} />
    </div>
  );
}

function DashboardPageImpl() {
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { forms, isLoading: loading, error } = useForms();
  const { isCollapsed } = useSidebar();
  const { unreadCount: notificationCount } = useNotifications(); // Use notification context
  
  const [refreshing, setRefreshing] = useState(false);
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
  const [interactiveAnalytics, setInteractiveAnalytics] = useState<Array<{ date: string; submissions: number; errors: number; }>>([]);
  const [analyticsRange, setAnalyticsRange] = useState('7d');
  const [recentLoading, setRecentLoading] = useState(false);
  // Add states for previous period data to calculate trends
  const [previousPeriodForms, setPreviousPeriodForms] = useState(0);
  const [previousPeriodSubmissions, setPreviousPeriodSubmissions] = useState(0);

  useEffect(() => {
    // Set hydrated immediately to reduce flashing
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
      
      console.log('[Dashboard] Fetching dashboard data...');
      setRecentLoading(true);
      
      try {
        // Map trendRange to days parameter for API
        const daysMap: Record<TrendRange, number> = {
          'today': 1,
          'yesterday': 2,
          '7d': 7,
          '14d': 14
        };
        const days = daysMap[trendRange] || 30;
        
        // Always fetch recent activities from last 7 days (reduced to avoid rate limit)
        const recentActivitiesDays = 7;
        
        // Get dashboard summary with dynamic days parameter
        const summaryRes = await getDashboardSummary(recentActivitiesDays);
        console.log('[Dashboard] Dashboard summary response:', summaryRes);
        console.log('[Dashboard] Recent submissions from summary:', summaryRes.recent_submissions);
        
        // Skip previous period fetch if we already have trend data to reduce API calls
        if (summaryRes && summaryRes.trend && summaryRes.trend.length > 0) {
          // Use trend data to calculate previous period
          const midPoint = Math.floor(summaryRes.trend.length / 2);
          const earlierPeriod = summaryRes.trend.slice(0, midPoint);
          const previousSubmissions = earlierPeriod.reduce((sum: number, item: any) => sum + (item.count || 0), 0);
          setPreviousPeriodSubmissions(previousSubmissions);
          
          // For forms, we can compare the current count with a baseline
          // Since forms don't change as frequently, we'll use a simple comparison
          setPreviousPeriodForms(Math.max(0, (summaryRes.total_forms || 0) - Math.floor(forms.length * 0.1)));
        }
      
      // Update state with API response data (will use default values if API fails)
      setTotalForms(summaryRes.total_forms || 0);
      setTotalSubmissions(summaryRes.total_submissions || 0);
      
      // Use summary recent_submissions if available as initial data
      if (summaryRes.recent_submissions && Array.isArray(summaryRes.recent_submissions) && summaryRes.recent_submissions.length > 0) {
        console.log('[Dashboard] Using recent_submissions from summary:', summaryRes.recent_submissions.length, 'items');
        
        // Normalize the submissions to ensure consistent field names
        // Only show submissions with valid form names from backend
        const normalized = summaryRes.recent_submissions
          .map((r: any) => {
            // Log raw submission data for debugging
            console.log('[Dashboard] Processing submission:', {
              id: r.id,
              form_name: r.form_name,
              form: r.form,
              form_title: r.form_title,
              formName: r.formName
            });
            
            // Extract form name from various possible fields
            const formName = r.form_name ?? r.form?.name ?? r.form_title ?? r.formName ?? null;
            const formId = r.form_id ?? r.form?._id ?? r.form?.id ?? null;
            const dateValue = r.date ?? r.created_at ?? r.timestamp ?? r.createdAt ?? r.submitted_at ?? null;
            
            return {
              id: r.id ?? r._id ?? r.uuid ?? `sub-${Date.now()}-${Math.random()}`,
              form_name: formName,
              form_id: formId,
              email: r.email ?? r.contact_email ?? r.submitted_by ?? r.data?.email ?? r.submission_data?.email ?? 'N/A',
              date: dateValue,
              status: r.status ?? (r.webhook_delivered === false ? 'failed' : 'success'),
              data: r.data ?? r.submission_data ?? {},
              raw: r,
              _hasValidFormName: !!formName,
              _hasValidDate: !!dateValue && !isNaN(new Date(dateValue).getTime())
            };
          })
          .filter((item: any) => {
            // Only keep submissions that have both valid form name AND valid date
            if (!item._hasValidFormName) {
              console.log('[Dashboard] Filtering out submission - no form name:', item.id);
              return false;
            }
            if (!item._hasValidDate) {
              console.log('[Dashboard] Filtering out submission - invalid date:', item.id);
              return false;
            }
            return true;
          });
        
        console.log('[Dashboard] Normalized submissions:', normalized);
        setRecentSubmissions(normalized);
        
        // Update notification count with submissions from last 24 hours
        // Note: notificationCount now comes from NotificationContext, no need to set it here
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentCount = normalized.filter((s: any) => {
          const submissionDate = new Date(s.date);
          return submissionDate > oneDayAgo;
        }).length;
        // Notification count is now managed by NotificationContext
      } else {
        console.warn('[Dashboard] No recent_submissions in summary response or empty array');
        setRecentSubmissions([]);
      }
      
      // Set webhook success rate based on webhook stats
      if (summaryRes.webhook_stats && summaryRes.webhook_stats.total > 0) {
        const successRate = (summaryRes.webhook_stats.delivered / summaryRes.webhook_stats.total) * 100;
        setWebhookSuccessRate(Math.round(successRate));
      } else {
        setWebhookSuccessRate(100); // Default if no webhook data
      }
      
      // Set trend data from the summary
      if (summaryRes.trend && Array.isArray(summaryRes.trend)) {
        console.log('[Dashboard] Setting trend data from summary:', summaryRes.trend.length, 'data points');
        const trendData = summaryRes.trend.map(item => ({
          date: item.date,
          count: item.count
        }));
        setTrendData(trendData);
      } else {
        console.warn('[Dashboard] No trend data in summary response');
        setTrendData([]);
      }
      
      // Fetch aggregated analytics from all forms to get submission vs error breakdown
      // NOTE: The /forms/{id}/analytics endpoint is not working (returns 500 errors)
      // As a workaround, we'll use the trend data from /dashboard/summary
      // This shows total submissions over time, but doesn't include error breakdown
      if (summaryRes.trend && Array.isArray(summaryRes.trend) && summaryRes.trend.length > 0) {
        console.log('[Dashboard] Using trend data as fallback for analytics (per-form analytics endpoint not available)');
        
        // Format for ChartBarStackedAnalytics (Submissions vs Errors chart)
        const trendAnalytics = summaryRes.trend.map((item: any) => ({
          date: item.date,
          value1: item.count || 0,  // Total submissions
          value2: 0,                  // Errors not available from this endpoint
          label1: 'Submissions',
          label2: 'Errors',
          color1: '#64748b',
          color2: '#ef4444',
        }));
        
        // Format for ChartAreaInteractiveBackend (Interactive Analytics Dashboard)
        const interactiveTrendAnalytics = summaryRes.trend.map((item: any) => ({
          date: item.date,
          submissions: item.count || 0,
          errors: 0,  // Errors not available from this endpoint
        }));
        
        console.log('[Dashboard] Trend-based analytics:', trendAnalytics);
        console.log('[Dashboard] Interactive analytics:', interactiveTrendAnalytics);
        setAnalytics(trendAnalytics);
        setInteractiveAnalytics(interactiveTrendAnalytics);
      } else {
        console.warn('[Dashboard] No trend data available for analytics');
        setAnalytics([]);
        setInteractiveAnalytics([]);
      }
      
      /* COMMENTED OUT: Per-form analytics aggregation (endpoint returns 500 errors)
      if (forms && Array.isArray(forms) && forms.length > 0) {
        console.log('[Dashboard] Aggregating analytics from', forms.length, 'forms for range:', analyticsRange);
        try {
          // Map analyticsRange to days
          const analyticsDaysMap: Record<string, number> = {
            '7d': 7,
            '30d': 30,
            '90d': 90
          };
          const analyticsDays = analyticsDaysMap[analyticsRange] || 7;
          
          // Map days to date range
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - analyticsDays);
          
          console.log('[Dashboard] Analytics date range:', { 
            startDate: startDate.toISOString(), 
            endDate: endDate.toISOString(),
            days: analyticsDays 
          });
          
          // Fetch analytics for all forms
          const analyticsPromises = forms.map(async (form: any) => {
            try {
              console.log(`[Dashboard] Fetching analytics for form ${form.id}...`);
              const result = await getFormAnalytics(form.id, {
                date_from: startDate.toISOString(),
                date_to: endDate.toISOString(),
                interval: 'day'
              });
              // Check if backend returned fallback data
              if (result && (result as any)._fallback) {
                console.log(`[Dashboard] Analytics unavailable for form ${form.id}, using empty data`);
                return [];
              }
              return result;
            } catch (err) {
              console.warn(`[Dashboard] Failed to fetch analytics for form ${form.id}:`, err);
              return [];
            }
          });
          
          const allFormAnalytics = await Promise.all(analyticsPromises);
          console.log('[Dashboard] All form analytics fetched:', allFormAnalytics);
          
          // Aggregate analytics by date
          const analyticsMap = new Map<string, { submissions: number; errors: number }>();
          
          allFormAnalytics.forEach((formData: any, index: number) => {
            console.log(`[Dashboard] Processing form ${index} analytics:`, formData);
            if (Array.isArray(formData)) {
              formData.forEach((item: any) => {
                const date = item.date;
                const existing = analyticsMap.get(date) || { submissions: 0, errors: 0 };
                analyticsMap.set(date, {
                  submissions: existing.submissions + (item.submissions || 0),
                  errors: existing.errors + (item.failed_webhooks || 0)
                });
                console.log(`[Dashboard] Added data for ${date}:`, { 
                  submissions: item.submissions, 
                  failed_webhooks: item.failed_webhooks 
                });
              });
            }
          });
          
          // Convert map to array and format for chart
          const aggregatedAnalytics = Array.from(analyticsMap.entries())
            .map(([date, data]) => ({
              date,
              value1: data.submissions,
              value2: data.errors,
              label1: 'Submissions',
              label2: 'Errors',
              color1: '#64748b',
              color2: '#ef4444',
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          console.log('[Dashboard] Aggregated analytics:', aggregatedAnalytics);
          setAnalytics(aggregatedAnalytics);
        } catch (err) {
          console.error('[Dashboard] Error aggregating analytics:', err);
          setAnalytics([]);
        }
      } else {
        console.warn('[Dashboard] No forms available for analytics aggregation');
        setAnalytics([]);
      }
      */
      
      console.log('[Dashboard] Dashboard data fetch complete');
      setRecentLoading(false);
      
      // If we have forms data but no summary data, use it as fallback
      if (summaryRes.total_forms === 0 && forms && Array.isArray(forms) && forms.length > 0) {
        console.log('[Dashboard] Using forms data as fallback...');
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
      }
      } catch (error) {
        console.error('[Dashboard] Error fetching dashboard data:', error);
        setRecentLoading(false);
        // Show error toast if needed
      }
    }
    
    fetchDashboardData();
  }, [trendRange, analyticsRange, user, forms]);

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
      <div className={`${isCollapsed ? 'md:ml-16' : 'md:ml-64'} transition-all duration-300 ease-in-out`}>
        {(!hydrated || !user) ? (
          <div className="flex items-center justify-center h-full min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
              <span className="text-slate-600 text-lg font-medium">
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
            recentSubmissions={recentSubmissions}
            recentLoading={recentLoading}
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
            interactiveAnalytics={interactiveAnalytics}
            analyticsRange={analyticsRange}
            setAnalyticsRange={setAnalyticsRange}
            refreshing={refreshing}
            setRefreshing={setRefreshing}
            previousPeriodForms={previousPeriodForms}
            previousPeriodSubmissions={previousPeriodSubmissions}
          />
        )}
      </div>
    </AuthLayout>
  );
}

// Export the implementation directly since we're in pages directory
export default DashboardPageImpl;

// Server-side authentication check to prevent the page being statically prerendered
// and to ensure sessions (HTTP-only cookies) are validated on each request.
export async function getServerSideProps(context: any) {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://formhook-backend.onrender.com';
  const cookie = context.req?.headers?.cookie || '';

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { cookie } : {})
      }
    });

    // If unauthenticated, redirect to login. This prevents the static prerender
    // from being served as a user-specific page and avoids client-side race
    // conditions where the app redirects back to /login after hydration.
    if (!res.ok) {
      return {
        redirect: {
          destination: '/login',
          permanent: false
        }
      };
    }

    // If authenticated, simply render the dashboard page. We don't need to pass
    // the user object down because AuthContext will hydrate on the client.
    return { props: {} };
  } catch (err) {
    // On error, redirect to login to be safe
    return {
      redirect: {
        destination: '/login',
        permanent: false
      }
    };
  }
}
