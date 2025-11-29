import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Dynamic Chart Components
import dynamic from 'next/dynamic';

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
import { getDashboardSummary, getSubmissions, getFormAnalytics, getFormGeoAnalytics, isRequestCooldownActive, getCurrentSubscription, getSubscriptionUsage, API_BASE_URL } from '../services/api';
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
import { safeReplace } from '../lib/navigation';
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

    const MemoTopFormsCard = React.memo(TopFormsCard);

// Development-only debug logger to avoid noisy production logs
const isDev = process.env.NODE_ENV !== 'production';
const debug = {
  log: (...args: any[]) => { if (isDev) console.log(...args); },
  warn: (...args: any[]) => { if (isDev) console.warn(...args); },
  error: (...args: any[]) => { if (isDev) console.error(...args); }
};

const MemoModernTrendChart = React.memo(ModernTrendChart);

function RecentSubmissionsCard({ submissions, loading }: { submissions: any[]; loading: boolean }) {
  if (loading) {
    return (
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl backdrop-blur-sm">
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

const MemoRecentSubmissionsCard = React.memo(RecentSubmissionsCard);

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
  geoCountries,
  deviceTop,
  osTop,
  subscriptionInfo,
}) {
  // Inline chart component: submissions vs errors over time (Area + Line)
  const SubmissionsSummaryChart = React.memo(function SubmissionsSummaryChart({ data }: { data: Array<{ date: string; submissions: number; errors: number }> }) {
    const chartData = (data || []).map(d => ({
      date: d.date ? new Date(d.date).toLocaleDateString() : '',
      submissions: d.submissions || 0,
      errors: d.errors || 0
    }));

    const hasData = chartData.length > 0 && chartData.some(d => d.submissions || d.errors);

    return (
      <div className="mt-6">
        {hasData ? (
          <div className="w-full h-52">
            <DynamicResponsiveContainer width="100%" height="100%">
              <DynamicAreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <DynamicCartesianGrid strokeDasharray="3 3" stroke="#e6eefb" />
                <DynamicXAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <DynamicYAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <DynamicTooltip contentStyle={{ background: '#fff', border: '1px solid #e6eefb' }} />
                <DynamicArea type="monotone" dataKey="submissions" stroke="#3B82F6" fillOpacity={0.18} fill="#3B82F6" />
                <DynamicArea type="monotone" dataKey="errors" stroke="#ef4444" fillOpacity={0.08} fill="#ef4444" />
              </DynamicAreaChart>
            </DynamicResponsiveContainer>
          </div>
        ) : (
          <div className="text-sm text-slate-500">No trend data available</div>
        )}
      </div>
    );
  });
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
          <MemoTopFormsCard forms={forms} loading={loading} />
          
          {/* Submission Trend Chart - Moved here from below */}
          <MemoModernTrendChart
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
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
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
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                System Health
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Current status of your integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Subscription / Quota (from user plan) */}
              <div>
                {subscriptionInfo ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Plan</span>
                        <div className="text-sm text-gray-500">{subscriptionInfo.plan_name || subscriptionInfo.plan || 'Free'}</div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>{subscriptionInfo.next_billing_date ? `Next: ${new Date(subscriptionInfo.next_billing_date).toLocaleDateString()}` : ''}</div>
                      </div>
                    </div>

                    {/* Quota bars if present */}
                    {typeof subscriptionInfo.submissions_used !== 'undefined' && typeof subscriptionInfo.submissions_limit !== 'undefined' && (
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Submissions</span>
                          <span className="text-sm font-medium text-gray-900">{subscriptionInfo.submissions_used}/{subscriptionInfo.submissions_limit}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="h-2 bg-blue-600 rounded-full" style={{ width: `${Math.min(100, (subscriptionInfo.submissions_used / Math.max(1, subscriptionInfo.submissions_limit)) * 100)}%` }}></div>
                        </div>
                      </div>
                    )}

                    {typeof subscriptionInfo.api_calls_used !== 'undefined' && typeof subscriptionInfo.api_calls_limit !== 'undefined' && (
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">API Calls</span>
                          <span className="text-sm font-medium text-gray-900">{subscriptionInfo.api_calls_used}/{subscriptionInfo.api_calls_limit}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="h-2 bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (subscriptionInfo.api_calls_used / Math.max(1, subscriptionInfo.api_calls_limit)) * 100)}%` }}></div>
                        </div>
                      </div>
                    )}

                    {typeof subscriptionInfo.storage_used !== 'undefined' && typeof subscriptionInfo.storage_limit !== 'undefined' && (
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Storage</span>
                          <span className="text-sm font-medium text-gray-900">{subscriptionInfo.storage_used} / {subscriptionInfo.storage_limit}{subscriptionInfo.storage_unit ? ` ${subscriptionInfo.storage_unit}` : ''}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (subscriptionInfo.storage_used / Math.max(1, subscriptionInfo.storage_limit)) * 100)}%` }}></div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Subscription</span>
                      <div className="text-sm text-gray-500">No plan details available</div>
                    </div>
                    <div>
                      <Button asChild variant="outline">
                        <Link href="/subscriptions">View plans</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

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
          {/* Replaced legacy charts with compact summary + geo/device/os cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="pro-card lg:col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">Submissions Summary</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">Overview of submissions and errors (no bar charts)</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-500">Total Submissions</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{(totalSubmissions || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-500">Errors / Failed Webhooks</p>
                    <p className="text-2xl font-bold text-rose-600">{Math.round(((100 - (webhookSuccessRate || 100)) / 100) * (totalSubmissions || 0)) || 0}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-500">Webhook Success Rate</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{(webhookSuccessRate || 100).toFixed(1)}%</p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                  <p>We use webhook delivery stats to infer errors when explicit submission error markers are not available. If you need a different interpretation, open the form Submissions page for more detail.</p>
                </div>
                {/* Chart: submissions vs errors over time (area chart) */}
                <SubmissionsSummaryChart data={interactiveAnalytics} />
              </CardContent>
            </Card>
            <Card className="pro-card lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">Traffic Breakdown</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">Countries, Devices & Operating Systems</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">Countries</h4>
                      <span className="text-xs text-slate-500">Visitors</span>
                    </div>
                    {/* Countries list */}
                    <div className="space-y-2 h-40 overflow-auto">
                      {geoCountries && geoCountries.length > 0 ? geoCountries.map((c: any) => (
                        <div key={c.name} className="flex items-center justify-between">
                          <div className="text-sm text-slate-700 dark:text-slate-200">{c.name}</div>
                          <div className="text-sm text-slate-500">{c.count}</div>
                        </div>
                      )) : (
                        <div className="text-sm text-slate-500">No country data available</div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 border rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">Devices</h4>
                      <div className="flex items-center gap-2">
                        <button className="text-xs text-slate-500">Browsers</button>
                        <button className="text-xs text-slate-500">Platforms</button>
                      </div>
                    </div>
                    <div className="space-y-2 h-40 overflow-auto">
                      {deviceTop && deviceTop.length > 0 ? deviceTop.map((d: any) => (
                        <div key={d.name} className="flex items-center justify-between">
                          <div className="text-sm text-slate-700 dark:text-slate-200">{d.name}</div>
                          <div className="text-sm text-slate-500">{d.count}</div>
                        </div>
                      )) : (
                        <div className="text-sm text-slate-500">No device/browser data available</div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 border rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">Operating Systems</h4>
                      <span className="text-xs text-slate-500">Visitors</span>
                    </div>
                    <div className="space-y-2 h-40 overflow-auto">
                      {osTop && osTop.length > 0 ? osTop.map((o: any) => (
                        <div key={o.name} className="flex items-center justify-between">
                          <div className="text-sm text-slate-700 dark:text-slate-200">{o.name}</div>
                          <div className="text-sm text-slate-500">{o.count}</div>
                        </div>
                      )) : (
                        <div className="text-sm text-slate-500">No OS data available</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
  const [subscriptionInfo, setSubscriptionInfo] = useState<any | null>(null);
  const [trendData, setTrendData] = useState<{ date: string; count: number }[]>([]);
  const [trendRange, setTrendRange] = useState<TrendRange>('7d');
  const [trendChartType, setTrendChartType] = useState<'bar' | 'line' | 'area'>('area');
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [interactiveAnalytics, setInteractiveAnalytics] = useState<Array<{ date: string; submissions: number; errors: number; }>>([]);
  const [analyticsRange, setAnalyticsRange] = useState('7d');
  const [recentLoading, setRecentLoading] = useState(false);
  const [geoCountries, setGeoCountries] = useState<any[]>([]);
  const [deviceTop, setDeviceTop] = useState<any[]>([]);
  const [osTop, setOsTop] = useState<any[]>([]);
  // Add states for previous period data to calculate trends
  const [previousPeriodForms, setPreviousPeriodForms] = useState(0);
  const [previousPeriodSubmissions, setPreviousPeriodSubmissions] = useState(0);

  // Optimization refs
  const isMountedRef = useRef(true);
  const fetchTimeoutRef = useRef<number | null>(null);
  const lastFetchKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // Set hydrated immediately to reduce flashing
    setHydrated(true);
    isMountedRef.current = true;
    
    // Suppress known noisy browser extension errors in console
    const originalError = console.error;
    console.error = (...args) => {
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
      isMountedRef.current = false;
      if (fetchTimeoutRef.current) {
        window.clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (hydrated && !user) {
      safeReplace(router, '/login');
    }
  }, [hydrated, user, router]);

  useEffect(() => {
    // Debounced fetch to avoid rapid repeated API calls when dependencies change
    if (!user) return;

    // If client-side cooldown is active (e.g. backend returned 429/CORS issues), skip fetches
    if (isRequestCooldownActive()) {
      debug.warn('[Dashboard] Skipping dashboard fetch due to client-side cooldown/backoff');
      // ensure we aren't stuck in loading state
      if (isMountedRef.current) setRecentLoading(false);
      return;
    }

    const formIds = Array.isArray(forms) ? forms.map((f: any) => f.id).filter(Boolean).slice(0, 50) : [];
    const fetchKey = `${trendRange}|${analyticsRange}|${formIds.length}|${formIds.join(',')}`;

    // Skip fetch if identical key as last successful fetch
    if (lastFetchKeyRef.current === fetchKey) return;

    if (fetchTimeoutRef.current) {
      window.clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = window.setTimeout(async () => {
      // Double-check mounted
      if (!isMountedRef.current) return;

      if (isRequestCooldownActive()) {
        debug.warn('[Dashboard] Skipping dashboard fetch (cooldown entered before scheduled fetch)');
        if (isMountedRef.current) setRecentLoading(false);
        return;
      }

      try {
        setRecentLoading(true);

        debug.log('[Dashboard] Fetching dashboard data (debounced)...');
        const recentActivitiesDays = 7;
        const summaryRes = await getDashboardSummary(recentActivitiesDays);

        // If component unmounted, stop
        if (!isMountedRef.current) return;

        // Update last fetch key to avoid repeat
        lastFetchKeyRef.current = fetchKey;

        setTotalForms(summaryRes.total_forms || (Array.isArray(forms) ? forms.length : 0));
        setTotalSubmissions(summaryRes.total_submissions || 0);
        // Capture subscription/billing info if backend includes it in the dashboard summary
        if (summaryRes.subscription) {
          setSubscriptionInfo(summaryRes.subscription);
        } else if (summaryRes.billing) {
          setSubscriptionInfo(summaryRes.billing);
        } else if (summaryRes.account && summaryRes.account.subscription) {
          setSubscriptionInfo(summaryRes.account.subscription);
        } else {
          setSubscriptionInfo(null);
        }

        // Prefer fetching the canonical subscription endpoint when available.
        // In local development, avoid hitting the backend subscription endpoints
        // if the API host differs from the page origin to prevent CORS failures.
        try {
          let shouldCallSubscriptionEndpoints = true;
          if (typeof window !== 'undefined') {
            try {
              const apiOrigin = new URL(API_BASE_URL).origin;
              const pageOrigin = window.location.origin;
              if (apiOrigin !== pageOrigin && process.env.NODE_ENV !== 'production') {
                shouldCallSubscriptionEndpoints = false;
              }
            } catch (err) {
              if (process.env.NODE_ENV !== 'production') shouldCallSubscriptionEndpoints = false;
            }
          }

          if (shouldCallSubscriptionEndpoints) {
            const currentSub = await getCurrentSubscription();
            if (currentSub) {
              setSubscriptionInfo(currentSub);
            } else {
              // fallback: try usage endpoint for richer usage_info
              const usage = await getSubscriptionUsage({ days: 30 });
              if (usage) setSubscriptionInfo(usage);
            }
          } else {
            console.warn('[Dashboard] Skipping subscription endpoints due to cross-origin API in development; using summary fallback.');
          }
        } catch (e) {
          console.warn('[Dashboard] subscription fetch failed, using summary fallback', e);
        }

        // Use recent_submissions safely
        if (summaryRes.recent_submissions && Array.isArray(summaryRes.recent_submissions) && summaryRes.recent_submissions.length > 0) {
          const normalized = summaryRes.recent_submissions
            .map((r: any) => {
              const formName = r.form_name ?? r.form?.name ?? r.form_title ?? r.formName ?? null;
              const dateValue = r.date ?? r.created_at ?? r.timestamp ?? r.createdAt ?? r.submitted_at ?? null;
              return {
                id: r.id ?? r._id ?? r.uuid ?? `sub-${Date.now()}-${Math.random()}`,
                form_name: formName,
                form_id: r.form_id ?? r.form?._id ?? r.form?.id ?? null,
                email: r.email ?? r.contact_email ?? r.submitted_by ?? r.data?.email ?? r.submission_data?.email ?? 'N/A',
                date: dateValue,
                status: r.status ?? (r.webhook_delivered === false ? 'failed' : 'success'),
                data: r.data ?? r.submission_data ?? {},
                raw: r,
                _hasValidFormName: !!formName,
                _hasValidDate: !!dateValue && !isNaN(new Date(dateValue).getTime())
              };
            })
            .filter((item: any) => item._hasValidFormName && item._hasValidDate);

          setRecentSubmissions(normalized);
        } else {
          setRecentSubmissions([]);
        }

        if (summaryRes.webhook_stats && summaryRes.webhook_stats.total > 0) {
          const successRate = (summaryRes.webhook_stats.delivered / summaryRes.webhook_stats.total) * 100;
          setWebhookSuccessRate(Math.round(successRate));
        } else {
          setWebhookSuccessRate(100);
        }

        if (summaryRes.trend && Array.isArray(summaryRes.trend)) {
          const tdata = summaryRes.trend.map((item: any) => ({ date: item.date, count: item.submissions ?? item.count ?? 0 }));
          setTrendData(tdata);

          const trendAnalytics = summaryRes.trend.map((item: any) => ({
            date: item.date,
            value1: (item.submissions ?? item.count) || 0,
            value2: (item.failed_webhooks ?? item.failed ?? item.errors ?? 0) || 0,
            label1: 'Submissions',
            label2: 'Errors',
            color1: '#3B82F6',
            color2: '#ef4444'
          }));
          setAnalytics(trendAnalytics);
          setInteractiveAnalytics(summaryRes.trend.map((item: any) => ({ date: item.date, submissions: (item.submissions ?? item.count) || 0, errors: (item.failed_webhooks ?? item.failed ?? item.errors ?? 0) || 0 })));
        } else {
          setTrendData([]);
          setAnalytics([]);
          setInteractiveAnalytics([]);
        }

        // Fetch geo / device / os breakdown for first form (best-effort)
        (async () => {
          try {
            const firstFormId = Array.isArray(forms) && forms.length > 0 ? forms[0].id : null;
            if (!firstFormId) {
              setGeoCountries([]);
              setDeviceTop([]);
              setOsTop([]);
            } else {
              // Geo
                try {
                const geo = await getFormGeoAnalytics(firstFormId);
                // Normalise possible backend shapes
                const countriesSrc = geo?.country_stats || geo?.countries || [];
                const countries = Array.isArray(countriesSrc) ? countriesSrc.map((c: any) => ({ name: c.name || c.country || c.key, count: c.count || c.value || 0 })) : [];
                setGeoCountries(countries.slice(0, 20));
              } catch (e) {
                setGeoCountries([]);
              }

              // Devices / OS from recent submissions
              try {
                const subs = await getSubmissions(firstFormId, { limit: 200 });
                const uaList = Array.isArray(subs) ? subs : (subs && subs.submissions ? subs.submissions : []);
                const browserCounts: Record<string, number> = {};
                const osCounts: Record<string, number> = {};

                const detectBrowser = (ua: string) => {
                  if (!ua) return 'Unknown';
                  const l = ua.toLowerCase();
                  if (l.includes('chrome') && !l.includes('edg') && !l.includes('opr')) return 'Chrome';
                  if (l.includes('firefox')) return 'Firefox';
                  if (l.includes('safari') && !l.includes('chrome')) return 'Safari';
                  if (l.includes('edg') || l.includes('edge')) return 'Edge';
                  if (l.includes('opr') || l.includes('opera')) return 'Opera';
                  if (l.includes('mobile') || l.includes('iphone') || l.includes('android')) return 'Mobile';
                  return 'Other';
                };

                const detectOS = (ua: string) => {
                  if (!ua) return 'Unknown';
                  const l = ua.toLowerCase();
                  if (l.includes('windows')) return 'Windows';
                  if (l.includes('mac os') || l.includes('macintosh') || l.includes('macos')) return 'macOS';
                  if (l.includes('android')) return 'Android';
                  if (l.includes('iphone') || l.includes('ipad') || l.includes('ios')) return 'iOS';
                  if (l.includes('linux')) return 'Linux';
                  return 'Other';
                };

                for (const s of uaList) {
                  const ua = s.user_agent || s.userAgent || s.metadata?.userAgent || s.data?.user_agent || s.headers?.['user-agent'] || s.raw?.userAgent || '';
                  if (!ua) continue;
                  const b = detectBrowser(ua);
                  const o = detectOS(ua);
                  browserCounts[b] = (browserCounts[b] || 0) + 1;
                  osCounts[o] = (osCounts[o] || 0) + 1;
                }

                const browserArr = Object.keys(browserCounts).map(k => ({ name: k, count: browserCounts[k] })).sort((a, b) => b.count - a.count);
                const osArr = Object.keys(osCounts).map(k => ({ name: k, count: osCounts[k] })).sort((a, b) => b.count - a.count);

                setDeviceTop(browserArr.slice(0, 10));
                setOsTop(osArr.slice(0, 10));
              } catch (e) {
                setDeviceTop([]);
                setOsTop([]);
              }
            }
          } catch (e) {
            // ignore
          }
        })();

        // Fallback: avoid fetching per-form submission lists for many forms — limit to first 5
        if ((!summaryRes.total_forms || summaryRes.total_forms === 0) && Array.isArray(forms) && forms.length > 0) {
          const sampleForms = forms.slice(0, 5);
          let totalSubmissionsCount = 0;
          for (const form of sampleForms) {
            try {
              const submissionsRes = await getSubmissions(form.id);
              if (!isMountedRef.current) break;
              if (submissionsRes && submissionsRes.submissions) {
                totalSubmissionsCount += submissionsRes.submissions.length;
              } else if (Array.isArray(submissionsRes)) {
                totalSubmissionsCount += submissionsRes.length;
              }
            } catch (submissionErr) {
              debug.warn(`[Dashboard] Could not fetch submissions for form ${form.id}:`, submissionErr);
            }
          }
          setTotalSubmissions(totalSubmissionsCount);
        }

      } catch (err) {
        debug.error('[Dashboard] Error fetching dashboard data:', err);
      } finally {
        if (isMountedRef.current) setRecentLoading(false);
      }

    }, 300);

    // cleanup for this effect invocation
    return () => {
      if (fetchTimeoutRef.current) {
        window.clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendRange, analyticsRange, user, /* useForms provides stable identity but we compare ids inside */ forms]);

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
          <MemoizedDashboardContent
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
            geoCountries={geoCountries}
            deviceTop={deviceTop}
            osTop={osTop}
            subscriptionInfo={subscriptionInfo}
          />
        )}
      </div>
    </AuthLayout>
  );
}

  const MemoizedDashboardContent = React.memo(DashboardContent);

// Export the implementation directly since we're in pages directory
export default DashboardPageImpl;
