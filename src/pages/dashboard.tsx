
import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, AreaChart, Area, CartesianGrid, Legend } from 'recharts';
import { ChartBarStackedAnalytics } from '../components/ChartBarStackedAnalytics';
import { ChartAreaInteractiveBackend } from '../components/ChartAreaInteractiveBackend';
import { getDashboardAnalytics } from '../services/api';
// Trend chart using recharts, styled with shadcn Card
const trendLabels = {
  today: 'today',
  yesterday: 'yesterday',
  '7d': 'last 7 days',
  '14d': 'last 2 weeks',
} as const;
type TrendRange = keyof typeof trendLabels;

function SubmissionsTrendChart({ data, trendRange, chartType, onChartTypeChange, onTrendRangeChange }: {
  data: { date: string; count: number }[];
  trendRange: TrendRange;
  chartType: 'bar' | 'line' | 'area';
  onChartTypeChange: (type: 'bar' | 'line' | 'area') => void;
  onTrendRangeChange: (range: TrendRange) => void;
}) {
  const hasData = Array.isArray(data) && data.length > 0;
  return (
    <Card className="w-full h-72 bg-white/80 dark:bg-black/80 border border-blue-100 shadow mb-8">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <CardTitle className="text-purple-700 dark:text-purple-200 text-lg">Submissions Trend ({trendLabels[trendRange]})</CardTitle>
          <CardDescription>
            {trendRange === 'today' && 'Track your form activity for today.'}
            {trendRange === 'yesterday' && 'Track your form activity for yesterday.'}
            {trendRange === '7d' && 'Track your form activity over the last week.'}
            {trendRange === '14d' && 'Track your form activity over the last 2 weeks.'}
          </CardDescription>
        </div>
        <div className="flex gap-2 items-center mt-2 md:mt-0">
          <select
            className="rounded border px-2 py-1 text-xs bg-white dark:bg-black border-purple-200 text-purple-700 dark:text-purple-200"
            value={trendRange}
            onChange={e => onTrendRangeChange(e.target.value as TrendRange)}
            aria-label="Select trend range"
            title="Select trend range"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7d">Last 7 Days</option>
            <option value="14d">Last 2 Weeks</option>
          </select>
          <select
            className="rounded border px-2 py-1 text-xs bg-white dark:bg-black border-purple-200 text-purple-700 dark:text-purple-200"
            value={chartType}
            onChange={e => onChartTypeChange(e.target.value as 'bar' | 'line' | 'area')}
            aria-label="Select chart type"
            title="Select chart type"
          >
            <option value="bar">Bar</option>
            <option value="line">Line</option>
            <option value="area">Area</option>
          </select>
        </div>
      </CardHeader>
      <CardContent className="h-48 flex items-end">
        <ResponsiveContainer width="100%" height="100%">
          <>
            {hasData ? (
              chartType === 'bar' ? (
                <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#a78bfa' }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#a78bfa' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#a78bfa22' }} contentStyle={{ background: '#fff', borderRadius: 8, border: '1px solid #a78bfa' }} />
                  <Bar dataKey="count" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : chartType === 'line' ? (
                <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#a78bfa' }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#a78bfa' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#fff', borderRadius: 8, border: '1px solid #a78bfa' }} />
                  <Line type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              ) : (
                <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#a78bfa' }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#a78bfa' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#fff', borderRadius: 8, border: '1px solid #a78bfa' }} />
                  <Area type="monotone" dataKey="count" stroke="#a78bfa" fill="#a78bfa33" strokeWidth={3} />
                </AreaChart>
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center text-purple-400 text-sm">No data for selected range.</div>
            )}
          </>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
import DashboardNav from '../components/DashboardNav';
import BottomGradientRadial from '../components/BottomGradientRadial';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import ToastView from '../components/ToastView';
import { useForms } from '../context/FormsContext';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';

import { useRouter } from 'next/router';



function DashboardContent({
  user,
  forms,
  loading,
  error,
  notificationCount,
  setNotificationCount,
  recentSubmissions,
  setRecentSubmissions,
  search,
  setSearch,
  toastViewRef,
  userEmail,
  setUserEmail,
  totalForms,
  setTotalForms,
  totalSubmissions,
  setTotalSubmissions,
  webhookSuccessRate,
  setWebhookSuccessRate,
  trendData,
  setTrendData,
  trendRange,
  setTrendRange,
  trendChartType,
  setTrendChartType,
  analytics,
  setAnalytics,
  analyticsRange,
  setAnalyticsRange,
  refreshing,
  setRefreshing,
}) {
  // Dummy refresh handler
  const handleRefresh = () => setRefreshing(true);
  const handleExportCSV = () => {};
  const handleCopySnippet = () => {};
  const markAllAsSeen = () => setNotificationCount(0);

  // Debug: log forms array
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[Dashboard] forms array:', forms);
  }, [forms]);


  // Always use forms.length for Total Forms
  const displayTotalForms = Array.isArray(forms) ? forms.length : 0;

  // Show a visible error if analytics fails
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  useEffect(() => {
    if (analytics && Array.isArray(analytics) && analytics.length === 0 && totalForms === 0 && totalSubmissions === 0) {
      setAnalyticsError('Analytics data could not be loaded. Showing only your forms.');
    } else {
      setAnalyticsError(null);
    }
  }, [analytics, totalForms, totalSubmissions]);

  return (
    <>
      <DashboardNav notificationCount={notificationCount} />
      {analyticsError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-200 text-center">
          {analyticsError}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* Summary Cards */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Total Forms</CardTitle>
            <CardDescription>All forms you have created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-200">{displayTotalForms}</div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Total Submissions</CardTitle>
            <CardDescription>All submissions received</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-200">{totalSubmissions}</div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Webhook Success Rate</CardTitle>
            <CardDescription>Successful webhook deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-200">{webhookSuccessRate}%</div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Unseen notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700 dark:text-red-200">{notificationCount}</div>
            <Button variant="outline" size="sm" className="mt-2" onClick={markAllAsSeen}>Mark all as seen</Button>
          </CardContent>
        </Card>
      </div>

      {/* Stacked Bar Chart Analytics */}
      <div className="mb-4">
        <ChartBarStackedAnalytics
          data={analytics.length ? analytics : [{ date: new Date().toISOString(), value1: 0, value2: 0, label1: 'Submissions', label2: 'Errors' }]}
          title="Submissions vs Errors"
          description="Stacked bar chart of submissions and errors by day."
          label1="Submissions"
          label2="Errors"
          color1="#6366f1"
          color2="#f43f5e"
        />
      </div>

      {/* Interactive Area Chart */}
      <div className="mb-4">
        <ChartAreaInteractiveBackend range={analyticsRange} setRange={setAnalyticsRange} />
      </div>

      {/* Submissions Trend Chart */}
      <div className="mb-4">
        <SubmissionsTrendChart
          data={trendData}
          trendRange={trendRange}
          chartType={trendChartType}
          onChartTypeChange={setTrendChartType}
          onTrendRangeChange={setTrendRange}
        />
      </div>

      {/* Recent Submissions Table */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>Latest form submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSubmissions && recentSubmissions.length > 0 ? (
                  recentSubmissions.map((sub, i) => (
                    <TableRow key={i}>
                      <TableCell>{sub.date ? new Date(sub.date).toLocaleString() : '-'}</TableCell>
                      <TableCell>{sub.form_name || '-'}</TableCell>
                      <TableCell>{sub.email || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={sub.status === 'success' ? 'default' : 'destructive'}>
                          {sub.status || 'unknown'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No recent submissions.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Forms List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Forms</CardTitle>
          <CardDescription>Manage your forms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4 gap-2">
            <Input
              placeholder="Search forms..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Button asChild size="sm">
              <Link href="/forms/new">Create New Form</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading || refreshing}>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled>
              Export CSV
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms && forms.length > 0 ? (
                  forms.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase())).map(form => (
                    <TableRow key={form.id}>
                      <TableCell>
                        <Link href={`/forms/${form.id}`} className="text-blue-600 hover:underline">
                          {form.name}
                        </Link>
                      </TableCell>
                      <TableCell>{form.description || '-'}</TableCell>
                      <TableCell>{form.created_at ? new Date(form.created_at).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/forms/${form.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No forms found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ToastView ref={toastViewRef} />
    </>
  );
}

import AuthLayout from '../components/AuthLayout';

function DashboardPageImpl() {
  // Hydration and auth gating logic here
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();
  const { user } = useAuth ? useAuth() : { user: null };
  const { forms, isLoading: loading, error } = useForms ? useForms() : { forms: [], isLoading: false, error: null };
  // Debug: log forms API response
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[DashboardPageImpl] forms from useForms:', forms);
  }, [forms]);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const toastViewRef = useRef<any>(null);
  const [userEmail, setUserEmail] = useState('');
  const [totalForms, setTotalForms] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [webhookSuccessRate, setWebhookSuccessRate] = useState(100);
  const [trendData, setTrendData] = useState<{ date: string; count: number }[]>([]);
  const [trendRange, setTrendRange] = useState<TrendRange>('7d');
  const [trendChartType, setTrendChartType] = useState<'bar' | 'line' | 'area'>('bar');
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [analyticsRange, setAnalyticsRange] = useState('7d');

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace('/login');
    }
  }, [hydrated, user, router]);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await getDashboardAnalytics({ range: analyticsRange });
        if (!res || res.error || res.status === 404) {
          toastViewRef.current?.addNotification(
            'error',
            'Analytics Error',
            res?.error || 'Failed to load analytics data.',
            true,
            4000
          );
          setAnalytics([]);
          setTotalForms(0);
          setTotalSubmissions(0);
          setWebhookSuccessRate(100);
          setTrendData([]);
          return;
        }
        setAnalytics(res.analytics || []);
        setTotalForms(res.total_forms || 0);
        setTotalSubmissions(res.total_submissions || 0);
        setWebhookSuccessRate(res.webhook_success_rate || 100);
        setTrendData(res.trend_data || []);
      } catch (err) {
        toastViewRef.current?.addNotification(
          'error',
          'Network Error',
          'Could not fetch analytics data.',
          true,
          4000
        );
        setAnalytics([]);
        setTotalForms(0);
        setTotalSubmissions(0);
        setWebhookSuccessRate(100);
        setTrendData([]);
      }
    }
    fetchAnalytics();
  }, [analyticsRange]);

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

  useEffect(() => {
    if (user && user.email) setUserEmail(user.email);
  }, [user]);

  // Always render the outer layout and main <div> for SSR/CSR match
  return (
    <AuthLayout>
      <BottomGradientRadial>
        <div className="min-h-screen flex flex-col md:ml-56">
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-4">
            {(!hydrated || !user) ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <span className="text-purple-400 text-lg">{!hydrated ? 'Loading...' : 'Redirecting to login...'}</span>
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
                setRecentSubmissions={setRecentSubmissions}
                search={search}
                setSearch={setSearch}
                toastViewRef={toastViewRef}
                userEmail={userEmail}
                setUserEmail={setUserEmail}
                totalForms={totalForms}
                setTotalForms={setTotalForms}
                totalSubmissions={totalSubmissions}
                setTotalSubmissions={setTotalSubmissions}
                webhookSuccessRate={webhookSuccessRate}
                setWebhookSuccessRate={setWebhookSuccessRate}
                trendData={trendData}
                setTrendData={setTrendData}
                trendRange={trendRange}
                setTrendRange={setTrendRange}
                trendChartType={trendChartType}
                setTrendChartType={setTrendChartType}
                analytics={analytics}
                setAnalytics={setAnalytics}
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
