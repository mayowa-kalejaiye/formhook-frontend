"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import DashboardNav from '../../../components/DashboardNav';
import { useSidebar } from '../../../context/SidebarContext';
import BottomGradientRadial from '../../../components/BottomGradientRadial';
import AuthLayout from '../../../components/AuthLayout';
import { getForm, getFormAnalytics } from '../../../services/api';
import { toast } from '../../../hooks/use-toast';
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  Users,
  Activity,
  Clock,
  Globe,
  ArrowLeft,
  RefreshCcw,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip, 
  LineChart, 
  Line, 
  CartesianGrid, 
  Legend,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import Link from 'next/link';

interface FormAnalyticsData {
  date: string;
  submissions: number;
  unique_visitors: number;
  conversion_rate: number;
  bounce_rate: number;
  avg_time_on_page: number;
  success_rate: number;
}

interface FormData {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  total_submissions: number;
}

// Mock analytics data generator
const generateMockAnalytics = (interval: string, dateFrom: Date, dateTo: Date): FormAnalyticsData[] => {
  const data: FormAnalyticsData[] = [];
  const current = new Date(dateFrom);
  
  while (current <= dateTo) {
    data.push({
      date: current.toISOString(),
      submissions: Math.floor(Math.random() * 50) + 10,
      unique_visitors: Math.floor(Math.random() * 200) + 50,
      conversion_rate: Math.random() * 15 + 5, // 5-20%
      bounce_rate: Math.random() * 30 + 30, // 30-60%
      avg_time_on_page: Math.random() * 180 + 60, // 1-4 minutes
      success_rate: Math.random() * 10 + 90, // 90-100%
    });
    
    // Increment date based on interval
    if (interval === 'hourly') {
      current.setHours(current.getHours() + 1);
    } else if (interval === 'daily') {
      current.setDate(current.getDate() + 1);
    } else if (interval === 'weekly') {
      current.setDate(current.getDate() + 7);
    } else {
      current.setMonth(current.getMonth() + 1);
    }
  }
  
  return data;
};

// Enhanced Tooltip Component
function CustomAnalyticsTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const date = new Date(label).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-gray-500" />
          <p className="font-semibold text-gray-900 dark:text-white">{date}</p>
        </div>
        <div className="space-y-2">
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.name}
                </span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {typeof item.value === 'number' && item.value % 1 !== 0 
                  ? `${item.value.toFixed(1)}${item.dataKey.includes('rate') || item.dataKey.includes('conversion') ? '%' : ''}`
                  : `${item.value}${item.dataKey.includes('rate') || item.dataKey.includes('conversion') ? '%' : ''}`
                }
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

function FormAnalyticsContent() {
  const router = useRouter();
  const { formId } = router.query;
  const { isCollapsed } = useSidebar();
  
  const [form, setForm] = useState<FormData | null>(null);
  const [analytics, setAnalytics] = useState<FormAnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // Filter states
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [interval, setInterval] = useState<'hourly' | 'daily' | 'weekly' | 'monthly'>('daily');

  // Load form data and analytics
  useEffect(() => {
    if (!formId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Load form details
        const formData = await getForm(formId as string);
        setForm({
          id: formData.id,
          name: formData.name,
          description: formData.description,
          created_at: formData.created_at,
          total_submissions: formData.total_submissions || 0
        });

        // Try to load analytics from API
        try {
          console.log(`[FormAnalytics] Fetching analytics for form ${formId}...`);
          const analyticsData = await getFormAnalytics(formId as string, {
            date_from: dateFrom,
            date_to: dateTo,
            interval
          });
          console.log('[FormAnalytics] Analytics response:', analyticsData);
          
          if (analyticsData && analyticsData.data) {
            setAnalytics(analyticsData.data);
          } else if (Array.isArray(analyticsData)) {
            setAnalytics(analyticsData);
          } else {
            setAnalytics([]);
          }
        } catch (analyticsErr) {
          console.error('[FormAnalytics] Failed to load analytics:', analyticsErr);
          setAnalytics([]);
          toast({
            title: 'Analytics Error',
            description: 'Failed to load analytics data. The form data loaded successfully but analytics are not available.',
          });
        }
      } catch (err) {
        console.error('[FormAnalytics] Error loading form data:', err);
        setError('Failed to load form analytics');
        setAnalytics([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [formId, dateFrom, dateTo, interval]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!analytics.length) return null;

    const totalSubmissions = analytics.reduce((sum, item) => sum + item.submissions, 0);
    const totalVisitors = analytics.reduce((sum, item) => sum + item.unique_visitors, 0);
    const avgConversionRate = analytics.reduce((sum, item) => sum + item.conversion_rate, 0) / analytics.length;
    const avgSuccessRate = analytics.reduce((sum, item) => sum + item.success_rate, 0) / analytics.length;
    const avgTimeOnPage = analytics.reduce((sum, item) => sum + item.avg_time_on_page, 0) / analytics.length;

    return {
      totalSubmissions,
      totalVisitors,
      avgConversionRate,
      avgSuccessRate,
      avgTimeOnPage
    };
  }, [analytics]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  if (loading && !analytics.length) {
    return (
      <AuthLayout>
        <BottomGradientRadial>
          <div className={`min-h-screen flex flex-col ${isCollapsed ? 'md:ml-16' : 'md:ml-56'} transition-all duration-300 ease-in-out`}>
            <DashboardNav />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-4">
              <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <span className="text-gray-600 text-lg font-medium">Loading analytics...</span>
                </div>
              </div>
            </main>
          </div>
        </BottomGradientRadial>
      </AuthLayout>
    );
  }

  return (
    <BottomGradientRadial>
      <div className={`min-h-screen flex flex-col ${isCollapsed ? 'md:ml-16' : 'md:ml-56'} transition-all duration-300 ease-in-out`}>
        <DashboardNav />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-4">

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <Link href="/forms" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </Link>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <BarChart3 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-purple-800 dark:text-purple-200 tracking-tight">
                  {form?.name} Analytics
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1 max-w-2xl">
                  Detailed insights and performance metrics for your form
                </p>
              </div>
            </div>
            <Button 
              onClick={handleRefresh}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg"
            >
              <RefreshCcw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>

          {/* Error Alert */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 text-red-800 dark:text-red-200">
                  <AlertCircle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card className="mb-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">From Date</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-white dark:bg-gray-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">To Date</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-white dark:bg-gray-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Interval</label>
                  <Select value={interval} onValueChange={(value: 'hourly' | 'daily' | 'weekly' | 'monthly') => setInterval(value)}>
                    <SelectTrigger className="bg-white dark:bg-gray-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <Eye className="h-4 w-4 mr-2" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Metrics */}
          {summaryMetrics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{summaryMetrics.totalSubmissions}</p>
                      <p className="text-sm text-blue-600 dark:text-blue-300">Total Submissions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Eye className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">{summaryMetrics.totalVisitors}</p>
                      <p className="text-sm text-green-600 dark:text-green-300">Total Visitors</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{summaryMetrics.avgConversionRate.toFixed(1)}%</p>
                      <p className="text-sm text-purple-600 dark:text-purple-300">Conversion Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-orange-600" />
                    <div>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{summaryMetrics.avgSuccessRate.toFixed(1)}%</p>
                      <p className="text-sm text-orange-600 dark:text-orange-300">Success Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-200 dark:border-teal-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-8 w-8 text-teal-600" />
                    <div>
                      <p className="text-2xl font-bold text-teal-900 dark:text-teal-100">{Math.floor(summaryMetrics.avgTimeOnPage / 60)}m</p>
                      <p className="text-sm text-teal-600 dark:text-teal-300">Avg Time on Page</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            
            {/* Submissions Over Time */}
            <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Submissions Over Time
                </CardTitle>
                <CardDescription>Track form submission trends and patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric"
                        });
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748b' }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomAnalyticsTooltip />} />
                    <defs>
                      <linearGradient id="submissionsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <Area
                      dataKey="submissions"
                      name="Submissions"
                      stroke="#3b82f6"
                      fill="url(#submissionsGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Conversion & Success Rates */}
            <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>Conversion and success rate trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                    <XAxis 
                      dataKey="date"
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric"
                        });
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748b' }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomAnalyticsTooltip />} />
                    <Legend />
                    <Line 
                      dataKey="conversion_rate" 
                      name="Conversion Rate"
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#10b981' }}
                    />
                    <Line 
                      dataKey="success_rate" 
                      name="Success Rate"
                      stroke="#f59e0b" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#f59e0b' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Visitor Analytics */}
          <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                Visitor Analytics
              </CardTitle>
              <CardDescription>Track unique visitors and engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis 
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric"
                      });
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomAnalyticsTooltip />} />
                  <Legend />
                  <Bar dataKey="unique_visitors" name="Unique Visitors" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="submissions" name="Submissions" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </main>
      </div>
    </BottomGradientRadial>
  );
}

export default function FormAnalyticsPage() {
  return (
    <AuthLayout>
      <FormAnalyticsContent />
    </AuthLayout>
  );
}

