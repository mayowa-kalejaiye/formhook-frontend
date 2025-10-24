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
import { getForm, getFormAnalytics, getFormGeoAnalytics } from '../../../services/api';
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
  MapPin,
  Zap,
  Target,
  TrendingDown
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
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

interface FormAnalyticsData {
  date: string;
  submissions: number;
  unique_visitors?: number;
  conversion_rate?: number;
  success_rate?: number;
}

interface GeoData {
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  count: number;
}

interface FormData {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  total_submissions: number;
}

// Enhanced Tooltip Component
function CustomAnalyticsTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const date = new Date(label).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    
    return (
      <div className="bg-white/95 dark:bg-gray-900/95 p-4 rounded-xl shadow-2xl border border-purple-200 dark:border-purple-700 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-purple-500" />
          <p className="font-bold text-gray-900 dark:text-white">{date}</p>
        </div>
        <div className="space-y-2">
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full shadow-lg" 
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
  const [geoData, setGeoData] = useState<GeoData[]>([]);
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
          
          // Check if backend returned fallback data
          if (analyticsData && (analyticsData as any)._fallback) {
            console.log('[FormAnalytics] Backend analytics unavailable, using empty array');
            setAnalytics([]);
          } else if (analyticsData && analyticsData.data) {
            setAnalytics(analyticsData.data);
          } else if (Array.isArray(analyticsData)) {
            setAnalytics(analyticsData);
          } else {
            setAnalytics([]);
          }
        } catch (analyticsErr) {
          // Should not throw anymore, but handle just in case
          console.error('[FormAnalytics] Unexpected error loading analytics:', analyticsErr);
          setAnalytics([]);
          toast({
            title: 'Analytics Error',
            description: 'Failed to load analytics data. The form data loaded successfully but analytics are not available.',
          });
        }
        
        // Load geographic analytics data
        try {
          console.log(`[FormAnalytics] Fetching geo analytics for form ${formId}...`);
          const geoAnalyticsData = await getFormGeoAnalytics(formId as string);
          console.log('[FormAnalytics] Geo analytics response:', geoAnalyticsData);
          
          // Check if backend returned fallback data
          if (geoAnalyticsData && !(geoAnalyticsData as any)._fallback) {
            // Combine countries and cities into single array
            const combinedGeoData: GeoData[] = [
              ...(geoAnalyticsData.countries || []).map(c => ({
                country: c.country,
                latitude: c.latitude,
                longitude: c.longitude,
                count: c.count
              })),
              ...(geoAnalyticsData.cities || []).map(c => ({
                city: c.city,
                latitude: c.latitude,
                longitude: c.longitude,
                count: c.count
              }))
            ];
            setGeoData(combinedGeoData);
          } else {
            console.log('[FormAnalytics] Backend geo analytics unavailable, using empty array');
            setGeoData([]);
          }
        } catch (geoErr) {
          console.error('[FormAnalytics] Unexpected error loading geo analytics:', geoErr);
          setGeoData([]);
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
    if (!analytics.length) {
      return {
        totalSubmissions: form?.total_submissions || 0,
        totalVisitors: 0,
        avgConversionRate: 0,
        avgSuccessRate: 0,
        trend: 0
      };
    }

    const totalSubmissions = analytics.reduce((sum, item) => sum + item.submissions, 0);
    const totalVisitors = analytics.reduce((sum, item) => sum + (item.unique_visitors || 0), 0);
    const avgConversionRate = analytics.reduce((sum, item) => sum + (item.conversion_rate || 0), 0) / analytics.length;
    const avgSuccessRate = analytics.reduce((sum, item) => sum + (item.success_rate || 0), 0) / analytics.length;
    
    // Calculate trend (compare first half vs second half of period)
    let trend = 0;
    if (analytics.length >= 2) {
      const midpoint = Math.floor(analytics.length / 2);
      const firstHalf = analytics.slice(0, midpoint).reduce((sum, item) => sum + item.submissions, 0) / midpoint;
      const secondHalf = analytics.slice(midpoint).reduce((sum, item) => sum + item.submissions, 0) / (analytics.length - midpoint);
      if (firstHalf > 0) {
        trend = ((secondHalf - firstHalf) / firstHalf) * 100;
      }
    }

    return {
      totalSubmissions,
      totalVisitors,
      avgConversionRate,
      avgSuccessRate,
      trend
    };
  }, [analytics, form]);

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
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                    <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-purple-600 border-r-pink-500 mx-auto"></div>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 text-lg font-medium">Loading analytics...</span>
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

          {/* Modern Gradient Hero Header */}
          <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 p-8 shadow-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <Link href="/forms" className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm">
                  <ArrowLeft className="h-6 w-6 text-white" />
                </Link>
                <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30">
                  <BarChart3 className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">
                    {form?.name} Analytics
                  </h1>
                  <p className="text-white/90 mt-2 max-w-2xl text-lg font-medium">
                    Real-time insights and geographic distribution
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleRefresh}
                disabled={loading}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
              >
                <RefreshCcw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 text-red-800 dark:text-red-200">
                  <AlertCircle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card className="mb-8 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-0 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    From Date
                  </label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-purple-200 dark:border-purple-700 focus:border-purple-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-pink-600" />
                    To Date
                  </label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-pink-200 dark:border-pink-700 focus:border-pink-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    Interval
                  </label>
                  <Select value={interval} onValueChange={(value: 'hourly' | 'daily' | 'weekly' | 'monthly') => setInterval(value)}>
                    <SelectTrigger className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-blue-200 dark:border-blue-700">
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
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg">
                    <Eye className="h-4 w-4 mr-2" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modern Metric Cards with Gradients */}
          {summaryMetrics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Submissions with Trend Badge */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-2xl rounded-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    {summaryMetrics.trend !== 0 && (
                      <div className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md ${
                        summaryMetrics.trend > 0 
                          ? 'bg-green-500/30 text-green-100 border border-green-300/50' 
                          : 'bg-red-500/30 text-red-100 border border-red-300/50'
                      }`}>
                        {summaryMetrics.trend > 0 ? '+' : ''}{summaryMetrics.trend.toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <p className="text-3xl font-extrabold text-white mb-1">{summaryMetrics.totalSubmissions.toLocaleString()}</p>
                  <p className="text-blue-100 text-sm font-medium">Total Submissions</p>
                </CardContent>
              </Card>

              {/* Visitors */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-2xl rounded-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-extrabold text-white mb-1">{summaryMetrics.totalVisitors.toLocaleString()}</p>
                  <p className="text-purple-100 text-sm font-medium">Unique Visitors</p>
                </CardContent>
              </Card>

              {/* Conversion Rate */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-pink-500 to-pink-600 border-0 shadow-2xl rounded-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-extrabold text-white mb-1">{summaryMetrics.avgConversionRate.toFixed(1)}%</p>
                  <p className="text-pink-100 text-sm font-medium">Conversion Rate</p>
                </CardContent>
              </Card>

              {/* Success Rate */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 border-0 shadow-2xl rounded-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-extrabold text-white mb-1">{summaryMetrics.avgSuccessRate.toFixed(1)}%</p>
                  <p className="text-green-100 text-sm font-medium">Success Rate</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Geographic Distribution Section */}
          {geoData.length > 0 && (
            <Card className="mb-8 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 border-b border-purple-200 dark:border-purple-700">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <MapPin className="h-7 w-7 text-purple-600" />
                  Geographic Distribution
                </CardTitle>
                <CardDescription className="text-base">Submission locations around the world</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* World Map */}
                  <div className="lg:col-span-2">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                      <ComposableMap
                        projectionConfig={{
                          scale: 140,
                          center: [0, 20]
                        }}
                        className="w-full h-auto"
                      >
                        <Geographies geography={geoUrl}>
                          {({ geographies }) =>
                            geographies.map((geo) => (
                              <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill="#E5E7EB"
                                stroke="#9CA3AF"
                                strokeWidth={0.5}
                                style={{
                                  default: { outline: 'none' },
                                  hover: { outline: 'none', fill: '#D1D5DB' },
                                  pressed: { outline: 'none' }
                                }}
                              />
                            ))
                          }
                        </Geographies>
                        {/* Plot markers for locations with coordinates */}
                        {geoData
                          .filter(location => location.latitude !== undefined && location.longitude !== undefined)
                          .map((location, index) => (
                            <Marker
                              key={index}
                              coordinates={[location.longitude!, location.latitude!]}
                            >
                              <g>
                                <circle
                                  r={Math.max(4, Math.min(location.count / 2, 20))}
                                  fill="#9333EA"
                                  fillOpacity={0.7}
                                  stroke="#EC4899"
                                  strokeWidth={2}
                                  className="animate-pulse"
                                />
                                <circle
                                  r={Math.max(2, Math.min(location.count / 4, 10))}
                                  fill="#EC4899"
                                />
                              </g>
                            </Marker>
                          ))}
                      </ComposableMap>
                    </div>
                  </div>

                  {/* Top Locations Lists */}
                  <div className="space-y-6">
                    {/* Top Countries */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                        <Target className="h-5 w-5 text-purple-600" />
                        Top Countries
                      </h3>
                      <div className="space-y-3">
                        {geoData
                          .filter(loc => loc.country)
                          .sort((a, b) => b.count - a.count)
                          .slice(0, 5)
                          .map((location, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-bold">
                                  {index + 1}
                                </div>
                                <span className="font-semibold text-gray-800 dark:text-gray-200">
                                  {location.country}
                                </span>
                              </div>
                              <span className="text-purple-600 dark:text-purple-400 font-bold">
                                {location.count}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Top Cities */}
                    {geoData.some(loc => loc.city) && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                          <Zap className="h-5 w-5 text-pink-600" />
                          Top Cities
                        </h3>
                        <div className="space-y-3">
                          {geoData
                            .filter(loc => loc.city)
                            .sort((a, b) => b.count - a.count)
                            .slice(0, 5)
                            .map((location, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-pink-50 to-blue-50 dark:from-pink-900/20 dark:to-blue-900/20 border border-pink-200 dark:border-pink-700"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-pink-600 text-white text-sm font-bold">
                                    {index + 1}
                                  </div>
                                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                                    {location.city}
                                  </span>
                                </div>
                                <span className="text-pink-600 dark:text-pink-400 font-bold">
                                  {location.count}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            
            {/* Submissions Over Time */}
            <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-200 dark:border-blue-700">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                  Submissions Over Time
                </CardTitle>
                <CardDescription className="text-base">Track form submission trends and patterns</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
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
                        <stop offset="0%" stopColor="#9333EA" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#EC4899" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <Area
                      dataKey="submissions"
                      name="Submissions"
                      stroke="#9333EA"
                      fill="url(#submissionsGradient)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Conversion & Success Rates */}
            <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
              <CardHeader className="bg-gradient-to-r from-pink-500/10 to-green-500/10 border-b border-pink-200 dark:border-pink-700">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <TrendingUp className="h-6 w-6 text-pink-600" />
                  Performance Metrics
                </CardTitle>
                <CardDescription className="text-base">Conversion and success rate trends</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
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
                      stroke="#EC4899" 
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#EC4899', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7 }}
                    />
                    <Line 
                      dataKey="success_rate" 
                      name="Success Rate"
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7 }}
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

  