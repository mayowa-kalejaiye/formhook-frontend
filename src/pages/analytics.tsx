"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import DashboardNav from '../components/DashboardNav';
import { useSidebar } from '../context/SidebarContext';
import BottomGradientRadial from '../components/BottomGradientRadial';
import AuthLayout from '../components/AuthLayout';
import { getSubmissions, getForms } from '../services/api';
import { showApiError } from '../hooks/use-toast';
import { 
  BarChart3, 
  Globe, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Activity,
  RefreshCw as Refresh,
  Eye,
  Zap,
  Target,
  TrendingDown
} from 'lucide-react';
import type { TooltipProps } from 'recharts';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  CartesianGrid, 
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

type CountryTooltipDatum = {
  fullCountry: string;
  submissions: number;
  riskScore: number;
  riskLevel: string;
};

const CountryTooltipContent: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as CountryTooltipDatum;
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{data.fullCountry}</p>
        <div className="space-y-1">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            <span className="font-medium">Submissions:</span> {data.submissions}
          </p>
          <p className="text-sm text-orange-600 dark:text-orange-400">
            <span className="font-medium">Avg Risk:</span> {data.riskScore} ({data.riskLevel})
          </p>
        </div>
      </div>
    );
  }

  return null;
};

// Simple coordinate mapping for major countries (you'd want a real geolocation service in production)
function getCountryCoordinates(country: string): [number, number] | null {
  const coordinates: Record<string, [number, number]> = {
    'United States': [-95.7129, 37.0902],
    'USA': [-95.7129, 37.0902],
    'United Kingdom': [-3.4360, 55.3781],
    'UK': [-3.4360, 55.3781],
    'Canada': [-106.3468, 56.1304],
    'Germany': [10.4515, 51.1657],
    'France': [2.2137, 46.2276],
    'India': [78.9629, 20.5937],
    'China': [104.1954, 35.8617],
    'Japan': [138.2529, 36.2048],
    'Australia': [133.7751, -25.2744],
    'Brazil': [-51.9253, -14.2350],
    'Mexico': [-102.5528, 23.6345],
    'Spain': [-3.7492, 40.4637],
    'Italy': [12.5674, 41.8719],
    'Netherlands': [5.2913, 52.1326],
    'Sweden': [18.6435, 60.1282],
    'Norway': [8.4689, 60.4720],
    'Denmark': [9.5018, 56.2639],
    'Poland': [19.1451, 51.9194],
    'Russia': [105.3188, 61.5240],
    'Unknown': [0, 0]
  };
  
  return coordinates[country] || null;
}

// Analytics data interface
interface AnalyticsData {
  id: string;
  form_id: string;
  form_name: string;
  country: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
  threat_score: number;
  submitted_at: string;
  status: 'success' | 'failed' | 'pending' | 'blocked';
}

interface GeoData {
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  count: number;
}

// Custom Tooltip Component
const CustomAnalyticsTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white/95 dark:bg-gray-900/95 border-purple-200 dark:border-purple-700 backdrop-blur-md p-4 rounded-xl shadow-lg border">
      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-purple-500" />
        {label}
      </p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 mt-1">
          <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: entry.color }}></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {entry.name}: <span className="font-semibold">{entry.value}</span>
          </span>
        </div>
      ))}
    </div>
  );
};

// Enhanced Interactive Country Map Component
function InteractiveCountryChart({ data }: { data: Record<string, { count: number; threat_avg: number }> }) {
  const chartData = Object.entries(data)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10)
    .map(([country, stats]) => ({
      country: country.length > 12 ? country.substring(0, 12) + '...' : country,
      fullCountry: country,
      submissions: stats.count,
      riskScore: Math.round(stats.threat_avg),
      riskLevel: stats.threat_avg < 30 ? 'Low' : stats.threat_avg < 70 ? 'Medium' : 'High'
    }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
        <XAxis 
          dataKey="country" 
          tick={{ fontSize: 12, fill: '#64748b' }} 
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: '#64748b' }} 
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CountryTooltipContent />} />
        <Bar 
          dataKey="submissions" 
          fill="#3b82f6" 
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Enhanced Threat Analysis Pie Chart
function ThreatAnalysisPieChart({ threatLevels }: { threatLevels: { low: number; medium: number; high: number } }) {
  const data = [
    { name: 'Low Risk', value: threatLevels.low, color: '#10b981' },
    { name: 'Medium Risk', value: threatLevels.medium, color: '#f59e0b' },
    { name: 'High Risk', value: threatLevels.high, color: '#ef4444' }
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value, name) => [value, name]}
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function AnalyticsPageContent() {
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d' | '90d'>('7d');
  const [selectedForm, setSelectedForm] = useState<'all' | string>('all');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [forms, setForms] = useState<Array<{id: string, name: string}>>([]);
  const { isCollapsed } = useSidebar();
  
  // Use ref to track if we're currently loading to prevent race conditions
  const loadingRef = React.useRef(false);

  // Load real data from API
  useEffect(() => {
    // Prevent concurrent loads
    if (loadingRef.current) {
      return;
    }
    
    const loadData = async () => {
      loadingRef.current = true;
      setLoading(true);
      
      try {
        // Load forms first
        const formsResponse = await getForms();
        
        let formsData: Array<{id: string, name: string}> = [];
        if (formsResponse && Array.isArray(formsResponse)) {
          formsData = formsResponse.map((form: any) => ({
            id: form.id,
            name: form.name
          }));
        } else if (formsResponse?.data && Array.isArray(formsResponse.data)) {
          formsData = formsResponse.data.map((form: any) => ({
            id: form.id,
            name: form.name
          }));
        }
        
        // Only update forms if we got valid data
        if (formsData.length > 0 || forms.length === 0) {
          setForms(formsData);
        }

        // Load submissions based on selection
        let allSubmissions: any[] = [];
        
        if (selectedForm === 'all') {
          // Fetch submissions from all forms
          if (formsData.length > 0) {
            const submissionsPromises = formsData.map(form => getSubmissions(form.id));
            const submissionsResponses = await Promise.all(submissionsPromises);
            
            submissionsResponses.forEach((response, index) => {
              if (response && Array.isArray(response)) {
                // Add form name to each submission
                const submissions = response.map((sub: any) => ({
                  ...sub,
                  form_name: formsData[index].name,
                  form_id: formsData[index].id
                }));
                allSubmissions.push(...submissions);
              }
            });
          }
        } else {
          // Fetch submissions for selected form only
          const response = await getSubmissions(selectedForm);
          if (response && Array.isArray(response)) {
            const formName = formsData.find(f => f.id === selectedForm)?.name || 'Unknown Form';
            allSubmissions = response.map((sub: any) => ({
              ...sub,
              form_name: formName,
              form_id: selectedForm
            }));
          }
        }

        // Transform submissions to match AnalyticsData format
        if (allSubmissions.length > 0) {
          const transformedData = allSubmissions.map((submission: any, index: number) => ({
            id: submission.id || `${index + 1}`,
            form_id: submission.form_id || 'unknown',
            form_name: submission.form_name || 'Unknown Form',
            country: submission.country || 'Unknown',
            region: submission.region || 'Unknown',
            city: submission.city || 'Unknown',
            threat_score: submission.threat_score || Math.floor(Math.random() * 10), // Default to low threat
            submitted_at: submission.submitted_at || new Date().toISOString(),
            status: submission.status || 'success'
          }));
          setAnalyticsData(transformedData);
        } else {
          // Only set to empty if we actually have no data (not just loading)
          setAnalyticsData([]);
        }
      } catch (error) {
        console.error('[Analytics] Error loading data:', error);
        showApiError(error, { fallbackTitle: 'Analytics Error' });
        // Don't clear existing data on error
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    loadData();
  }, [selectedForm]); // Removed timeRange from dependencies since it's not used

  // Process analytics data
  const processedData = useMemo(() => {
    let filtered = analyticsData;

    if (selectedForm !== 'all') {
      filtered = filtered.filter(item => item.form_id === selectedForm);
    }

    // Country breakdown
    const countryStats = filtered.reduce((acc, item) => {
      if (!acc[item.country]) {
        acc[item.country] = { count: 0, threat_avg: 0, threat_total: 0 };
      }
      acc[item.country].count++;
      acc[item.country].threat_total += item.threat_score;
      acc[item.country].threat_avg = acc[item.country].threat_total / acc[item.country].count;
      return acc;
    }, {} as Record<string, { count: number; threat_avg: number; threat_total: number }>);

    // Status breakdown
    const statusStats = filtered.reduce((acc, item) => {
      if (!acc[item.status]) acc[item.status] = 0;
      acc[item.status]++;
      return acc;
    }, {} as Record<string, number>);

    // Threat level analysis
    const threatLevels = {
      low: filtered.filter(item => item.threat_score < 30).length,
      medium: filtered.filter(item => item.threat_score >= 30 && item.threat_score < 70).length,
      high: filtered.filter(item => item.threat_score >= 70).length
    };

    return {
      countryStats,
      statusStats,
      threatLevels,
      totalSubmissions: filtered.length,
      successRate: statusStats.success ? Math.round((statusStats.success / filtered.length) * 100) : 0
    };
  }, [analyticsData, selectedForm, timeRange]);

  const refreshData = async () => {
    setLoading(true);
    // Re-run the data loading
    const loadData = async () => {
      try {
        const [formsResponse, submissionsResponse] = await Promise.all([
          getForms(),
          getSubmissions(selectedForm === 'all' ? undefined : selectedForm)
        ]);

        if (formsResponse && Array.isArray(formsResponse)) {
          setForms(formsResponse.map((form: any) => ({
            id: form.id,
            name: form.name
          })));
        }

        if (submissionsResponse && Array.isArray(submissionsResponse)) {
          const transformedData = submissionsResponse.map((submission: any, index: number) => ({
            id: submission.id || `${index + 1}`,
            form_id: submission.form_id || 'unknown',
            form_name: submission.form_name || 'Unknown Form',
            country: submission.country || 'Unknown',
            region: submission.region || 'Unknown',
            city: submission.city || 'Unknown',
            threat_score: submission.threat_score || Math.floor(Math.random() * 10),
            submitted_at: submission.submitted_at || new Date().toISOString(),
            status: submission.status || 'success'
          }));
          setAnalyticsData(transformedData);
        }
      } catch (error) {
        console.error('[Analytics] Error refreshing data:', error);
        showApiError(error, { fallbackTitle: 'Analytics Error' });
      }
    };
    
    await loadData();
    setLoading(false);
  };

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
                <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30">
                  <BarChart3 className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">
                    Global Analytics
                  </h1>
                  <p className="text-white/90 mt-2 max-w-2xl text-lg font-medium">
                    Real-time insights across all your forms
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Select value={selectedForm} onValueChange={setSelectedForm}>
                  <SelectTrigger className="w-[200px] bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-white/50 dark:border-gray-700">
                    <SelectValue placeholder="All Forms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Forms</SelectItem>
                    {forms.map((form) => (
                      <SelectItem key={form.id} value={form.id}>
                        {form.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                  <SelectTrigger className="w-[180px] bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-white/50 dark:border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1d">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  onClick={refreshData} 
                  disabled={loading}
                  className="bg-white hover:bg-white/90 text-purple-600 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
                >
                  <Refresh className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Modern Metric Cards with Gradients */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Submissions */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-2xl rounded-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-white mb-1">{processedData.totalSubmissions.toLocaleString()}</p>
                <p className="text-blue-100 text-sm font-medium">Total Submissions</p>
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
                <p className="text-3xl font-extrabold text-white mb-1">{processedData.successRate}%</p>
                <p className="text-green-100 text-sm font-medium">Success Rate</p>
              </CardContent>
            </Card>

            {/* Countries */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-2xl rounded-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-white mb-1">{Object.keys(processedData.countryStats).length}</p>
                <p className="text-purple-100 text-sm font-medium">Countries</p>
              </CardContent>
            </Card>

            {/* High Risk */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-pink-500 to-pink-600 border-0 shadow-2xl rounded-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-white mb-1">{processedData.threatLevels.high}</p>
                <p className="text-pink-100 text-sm font-medium">High Risk</p>
              </CardContent>
            </Card>
          </div>

          {/* Geographic Distribution Map */}
          <Card className="mb-8 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 border-b border-purple-200 dark:border-purple-700">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <MapPin className="h-7 w-7 text-purple-600" />
                Geographic Distribution
              </CardTitle>
              <CardDescription className="text-base">Submission locations around the world</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {Object.keys(processedData.countryStats).length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* World Map */}
                  <div className="lg:col-span-2">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                      <div style={{ width: '100%', height: '500px' }}>
                        <ComposableMap
                          projectionConfig={{
                            scale: 140,
                            center: [0, 20]
                          }}
                          width={800}
                          height={500}
                          style={{ width: '100%', height: '100%' }}
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
                          {/* Plot markers for countries with data */}
                          {Object.entries(processedData.countryStats)
                            .filter(([_, stats]) => stats.count > 0)
                            .slice(0, 50) // Limit to top 50 countries for performance
                            .map(([country, stats], index) => {
                              // Simple coordinate mapping for demo (you'd want a real geolocation service)
                              const coords = getCountryCoordinates(country);
                              if (!coords) return null;
                              
                              return (
                                <Marker key={index} coordinates={coords}>
                                  <g>
                                    <circle
                                      r={Math.max(5, Math.min(stats.count / 2, 22))}
                                      fill="#9333EA"
                                      fillOpacity={0.8}
                                      stroke="#EC4899"
                                      strokeWidth={2.5}
                                      className="animate-pulse"
                                    />
                                    <circle
                                      r={Math.max(2, Math.min(stats.count / 4, 10))}
                                      fill="#EC4899"
                                    />
                                  </g>
                                </Marker>
                              );
                            })}
                        </ComposableMap>
                      </div>
                    </div>
                  </div>

                  {/* Top Countries List */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-600" />
                      Top Countries
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(processedData.countryStats)
                        .sort(([, a], [, b]) => b.count - a.count)
                        .slice(0, 10)
                        .map(([country, stats], index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-bold">
                                {index + 1}
                              </div>
                              <span className="font-semibold text-gray-800 dark:text-gray-200">
                                {country}
                              </span>
                            </div>
                            <span className="text-purple-600 dark:text-purple-400 font-bold text-lg">
                              {stats.count}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <MapPin className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No geographic data available yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Data will appear as submissions are collected</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            
            {/* Enhanced Country Submissions Chart */}
            <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-200 dark:border-blue-700">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Globe className="h-6 w-6 text-blue-600" />
                  Global Submissions Overview
                </CardTitle>
                <CardDescription className="text-base">Top countries by submission volume</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <InteractiveCountryChart data={processedData.countryStats} />
              </CardContent>
            </Card>

            {/* Enhanced Status Distribution Chart */}
            <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
              <CardHeader className="bg-gradient-to-r from-pink-500/10 to-green-500/10 border-b border-pink-200 dark:border-pink-700">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Activity className="h-6 w-6 text-pink-600" />
                  Threat Level Analysis
                </CardTitle>
                <CardDescription className="text-base">Risk distribution across submissions</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ThreatAnalysisPieChart threatLevels={processedData.threatLevels} />
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity or Additional Charts */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                  <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-purple-600 border-r-pink-500 mx-auto"></div>
                </div>
                <span className="text-gray-600 dark:text-gray-300 text-lg font-medium">Loading analytics...</span>
              </div>
            </div>
          )}

          {!loading && analyticsData.length === 0 && (
            <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
              <CardContent className="p-12 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-2xl opacity-20"></div>
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto relative" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">No Data Available</h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">Analytics will appear here once form submissions are collected. Start collecting data by sharing your forms!</p>
              </CardContent>
            </Card>
          )}

        </main>
      </div>
    </BottomGradientRadial>
  );
}

export default function AnalyticsPage() {
  return (
    <AuthLayout>
      <AnalyticsPageContent />
    </AuthLayout>
  );
}
