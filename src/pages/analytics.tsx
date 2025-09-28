"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import DashboardNav from '../components/DashboardNav';
import { useSidebar } from '../context/SidebarContext';
import BottomGradientRadial from '../components/BottomGradientRadial';
import AuthLayout from '../components/AuthLayout';
import { getSubmissions, getForms } from '../services/api';
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
  RefreshCw as Refresh
} from 'lucide-react';
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
  Legend 
} from 'recharts';

// Analytics data interface
interface AnalyticsData {
  id: string;
  form_id: string;
  form_name: string;
  country: string;
  region: string;
  city: string;
  threat_score: number;
  submitted_at: string;
  status: 'success' | 'failed' | 'pending' | 'blocked';
}

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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
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
        <Tooltip content={<CustomTooltip />} />
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
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [forms, setForms] = useState<Array<{id: string, name: string}>>([]);
  const { isCollapsed } = useSidebar();

  // Load real data from API
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load forms
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
          // Transform submissions to match AnalyticsData format
          const transformedData = submissionsResponse.map((submission: any, index: number) => ({
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
          setAnalyticsData([]);
        }
      } catch (error) {
        console.error('[Analytics] Error loading data:', error);
        setAnalyticsData([]);
        setForms([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedForm, timeRange]);

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

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 text-white">
                <BarChart3 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">Global form submission analytics and insights</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Select value={selectedForm} onValueChange={setSelectedForm}>
                <SelectTrigger className="w-[200px] bg-white dark:bg-gray-800">
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
                <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={refreshData} disabled={loading} className="border border-gray-300 hover:bg-gray-50">
                <Refresh className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{processedData.totalSubmissions}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-300">Total Submissions</p>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">{processedData.successRate}%</p>
                    <p className="text-sm text-green-600 dark:text-green-300">Success Rate</p>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{Object.keys(processedData.countryStats).length}</p>
                    <p className="text-sm text-orange-600 dark:text-orange-300">Countries</p>
                  </div>
                  <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-full">
                    <Globe className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">{processedData.threatLevels.high}</p>
                    <p className="text-sm text-red-600 dark:text-red-300">High Risk</p>
                  </div>
                  <div className="p-2 bg-red-100 dark:bg-red-800 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            
            {/* Enhanced Country Submissions Chart */}
            <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Global Submissions Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InteractiveCountryChart data={processedData.countryStats} />
              </CardContent>
            </Card>

            {/* Enhanced Status Distribution Chart */}
            <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Threat Level Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ThreatAnalysisPieChart threatLevels={processedData.threatLevels} />
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity or Additional Charts */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-blue-600">Loading analytics...</span>
            </div>
          )}

          {!loading && analyticsData.length === 0 && (
            <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Data Available</h3>
                <p className="text-gray-600 dark:text-gray-400">Analytics will appear here once form submissions are collected.</p>
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
