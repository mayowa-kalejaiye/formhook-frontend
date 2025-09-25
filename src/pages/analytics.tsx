"use client";
import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import DashboardNav from '../components/DashboardNav';
import { useSidebar } from '../context/SidebarContext';
import BottomGradientRadial from '../components/BottomGradientRadial';
import AuthLayout from '../components/AuthLayout';
import { 
  BarChart3, 
  Globe, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Users,
  AlertTriangle,
  Shield,
  RefreshCcw,
  Activity,
  Eye,
  Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';

interface AnalyticsData {
  id: string;
  form_id: string;
  form_name: string;
  country: string;
  region: string;
  city: string;
  threat_score: number;
  submitted_at: string;
  status: string;
}

// Mock analytics data
const mockAnalyticsData: AnalyticsData[] = [
  { id: '1', form_id: 'f1', form_name: 'Contact Form', country: 'United States', region: 'California', city: 'San Francisco', threat_score: 0, submitted_at: '2025-09-24T10:00:00Z', status: 'success' },
  { id: '2', form_id: 'f1', form_name: 'Contact Form', country: 'United States', region: 'New York', city: 'New York City', threat_score: 5, submitted_at: '2025-09-24T09:00:00Z', status: 'success' },
  { id: '3', form_id: 'f2', form_name: 'Newsletter', country: 'United Kingdom', region: 'England', city: 'London', threat_score: 0, submitted_at: '2025-09-24T08:00:00Z', status: 'success' },
  { id: '4', form_id: 'f1', form_name: 'Contact Form', country: 'Canada', region: 'Ontario', city: 'Toronto', threat_score: 15, submitted_at: '2025-09-24T07:00:00Z', status: 'pending' },
  { id: '5', form_id: 'f3', form_name: 'Support Form', country: 'Germany', region: 'Bavaria', city: 'Munich', threat_score: 85, submitted_at: '2025-09-24T06:00:00Z', status: 'failed' },
  { id: '6', form_id: 'f2', form_name: 'Newsletter', country: 'France', region: 'Île-de-France', city: 'Paris', threat_score: 2, submitted_at: '2025-09-24T05:00:00Z', status: 'success' },
  { id: '7', form_id: 'f1', form_name: 'Contact Form', country: 'Japan', region: 'Tokyo', city: 'Tokyo', threat_score: 10, submitted_at: '2025-09-24T04:00:00Z', status: 'success' },
  { id: '8', form_id: 'f3', form_name: 'Support Form', country: 'Australia', region: 'New South Wales', city: 'Sydney', threat_score: 3, submitted_at: '2025-09-24T03:00:00Z', status: 'success' },
  { id: '9', form_id: 'f1', form_name: 'Contact Form', country: 'Brazil', region: 'São Paulo', city: 'São Paulo', threat_score: 25, submitted_at: '2025-09-24T02:00:00Z', status: 'success' },
  { id: '10', form_id: 'f2', form_name: 'Newsletter', country: 'India', region: 'Maharashtra', city: 'Mumbai', threat_score: 0, submitted_at: '2025-09-24T01:00:00Z', status: 'success' },
  { id: '11', form_id: 'f1', form_name: 'Contact Form', country: 'Unknown', region: 'Unknown', city: 'Unknown', threat_score: 95, submitted_at: '2025-09-24T00:00:00Z', status: 'blocked' },
];

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
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          yAxisId="submissions"
          orientation="left"
          tick={{ fontSize: 12, fill: '#64748b' }} 
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          yAxisId="risk"
          orientation="right"
          tick={{ fontSize: 12, fill: '#64748b' }} 
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          yAxisId="submissions"
          dataKey="submissions" 
          name="Submissions"
          fill="url(#countryGradient)"
          radius={[4, 4, 0, 0]}
        />
        <Line 
          yAxisId="risk"
          type="monotone" 
          dataKey="riskScore" 
          stroke="#f59e0b"
          strokeWidth={3}
          name="Risk Score"
        />
        <defs>
          <linearGradient id="countryGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Enhanced Threat Analysis Pie Chart
function ThreatAnalysisPieChart({ threatLevels }: { threatLevels: { low: number; medium: number; high: number } }) {
  const data = [
    { name: 'Low Risk (0-29)', value: threatLevels.low, color: '#10b981' },
    { name: 'Medium Risk (30-69)', value: threatLevels.medium, color: '#f59e0b' },
    { name: 'High Risk (70+)', value: threatLevels.high, color: '#ef4444' },
  ];

  const renderLabel = (entry: any) => {
    const percent = ((entry.value / (threatLevels.low + threatLevels.medium + threatLevels.high)) * 100).toFixed(1);
    return `${percent}%`;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderLabel}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: any) => [`${value} submissions`, 'Count']}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
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
  const { isCollapsed } = useSidebar();

  // Process analytics data
  const processedData = useMemo(() => {
    let filtered = mockAnalyticsData;

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

    // Top cities
    const cityStats = filtered.reduce((acc, item) => {
      const key = `${item.city}, ${item.country}`;
      if (!acc[key]) acc[key] = 0;
      acc[key]++;
      return acc;
    }, {} as Record<string, number>);

    // Status distribution for chart
    const statusChartData = Object.entries(statusStats).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      color: status === 'success' ? '#10b981' : 
             status === 'failed' ? '#ef4444' : 
             status === 'pending' ? '#f59e0b' : 
             status === 'blocked' ? '#dc2626' : '#6b7280'
    }));

    return {
      total: filtered.length,
      countryStats,
      statusStats,
      statusChartData,
      threatLevels,
      cityStats
    };
  }, [mockAnalyticsData, selectedForm, timeRange]);

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  // Get unique forms for filter
  const forms = Array.from(new Set(mockAnalyticsData.map(item => ({ id: item.form_id, name: item.form_name }))));

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
                <h1 className="text-3xl md:text-4xl font-extrabold text-purple-800 dark:text-purple-200 tracking-tight">
                  Analytics Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1 max-w-2xl">
                  Advanced insights into form submissions with geolocation data and security metrics
                </p>
              </div>
            </div>
            <Button 
              onClick={handleRefresh}
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg"
            >
              <RefreshCcw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-white/50 dark:bg-gray-900/50 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
            <Select value={timeRange} onValueChange={(value: '1d' | '7d' | '30d' | '90d') => setTimeRange(value)}>
              <SelectTrigger className="w-40 bg-white dark:bg-gray-800">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedForm} onValueChange={setSelectedForm}>
              <SelectTrigger className="w-48 bg-white dark:bg-gray-800">
                <SelectValue placeholder="All Forms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Forms</SelectItem>
                {forms.map(form => (
                  <SelectItem key={form.id} value={form.id}>{form.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{processedData.total}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-300">Total Submissions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Globe className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {Object.keys(processedData.countryStats).length}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-300">Countries</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{processedData.threatLevels.low}</p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-300">Safe Submissions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">{processedData.threatLevels.high}</p>
                    <p className="text-sm text-red-600 dark:text-red-300">High Risk</p>
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
                  Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={processedData.statusChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                    <XAxis 
                      dataKey="status" 
                      tick={{ fontSize: 12, fill: '#64748b' }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748b' }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Threat Analysis and Top Cities */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Threat Level Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ThreatAnalysisPieChart threatLevels={processedData.threatLevels} />
              </CardContent>
            </Card>

            {/* Top Cities */}
            <Card className="lg:col-span-2 bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  Top Cities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(processedData.cityStats)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 8)
                    .map(([city, count]) => (
                    <div key={city} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-medium truncate text-gray-900 dark:text-white">{city}</span>
                      </div>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 font-semibold">
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

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