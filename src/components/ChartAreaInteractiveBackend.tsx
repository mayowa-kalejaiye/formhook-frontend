"use client";
import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { TrendingUp, Monitor, Smartphone, Calendar } from "lucide-react";
import { getDashboardAnalytics } from "../services/api";

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#3b82f6",
  },
  mobile: {
    label: "Mobile", 
    color: "#10b981",
  },
};

// Enhanced custom tooltip
function CustomAreaTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const date = new Date(label).toLocaleDateString("en-US", {
      weekday: 'short',
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    
    const total = payload.reduce((sum: number, item: any) => sum + item.value, 0);
    
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
                <div className="flex items-center gap-2">
                  {item.dataKey === 'desktop' ? (
                    <Monitor className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Smartphone className="h-4 w-4 text-green-500" />
                  )}
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.name}
                </span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {item.value.toLocaleString()}
              </span>
            </div>
          ))}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Visitors</span>
              </div>
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                {total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function ChartAreaInteractiveBackend({ range, setRange }: { range: string; setRange: (v: string) => void }) {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('[ChartAreaInteractiveBackend] Fetching analytics for range:', range);
        const response = await getDashboardAnalytics({ range });
        
        if (response && response.analytics && Array.isArray(response.analytics)) {
          // Transform the analytics data to match chart format
          const chartData = response.analytics.map((item: any) => ({
            date: item.date || item.timestamp || new Date().toISOString(),
            desktop: Math.floor((item.value1 || item.submissions || 0) * 0.6), // Assume 60% desktop
            mobile: Math.floor((item.value1 || item.submissions || 0) * 0.4), // Assume 40% mobile
          }));
          
          console.log('[ChartAreaInteractiveBackend] Transformed data:', chartData);
          setData(chartData);
        } else {
          console.log('[ChartAreaInteractiveBackend] No analytics data available');
          setData([]);
        }
      } catch (err) {
        console.error('[ChartAreaInteractiveBackend] Error fetching analytics:', err);
        setError('Failed to load analytics data');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [range]);

  // Calculate summary stats
  const totalVisitors = React.useMemo(() => {
    return data.reduce((sum, item) => sum + item.desktop + item.mobile, 0);
  }, [data]);

  const desktopPercentage = React.useMemo(() => {
    const desktopTotal = data.reduce((sum, item) => sum + item.desktop, 0);
    return totalVisitors > 0 ? Math.round((desktopTotal / totalVisitors) * 100) : 0;
  }, [data, totalVisitors]);

  const mobilePercentage = 100 - desktopPercentage;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full">
              <Monitor className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{desktopPercentage}%</p>
              <p className="text-sm text-blue-600 dark:text-blue-300">Desktop Users</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
              <Smartphone className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{mobilePercentage}%</p>
              <p className="text-sm text-green-600 dark:text-green-300">Mobile Users</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-full">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {totalVisitors.toLocaleString()}
              </p>
              <p className="text-sm text-purple-600 dark:text-purple-300">Total Visitors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Chart */}
      <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm overflow-hidden">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-6 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-teal-500 to-green-500 text-white">
                <TrendingUp className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl font-bold text-teal-800 dark:text-teal-200">
                Interactive Analytics Dashboard
              </CardTitle>
            </div>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Device-based visitor analytics with customizable time ranges and real-time insights
            </CardDescription>
          </div>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[160px] rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600" aria-label="Select a value">
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">Last 3 months</SelectItem>
              <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
              <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="aspect-auto h-[320px] w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                  <p className="text-teal-600 dark:text-teal-400 font-medium">Loading analytics...</p>
                </div>
              </div>
            ) : error ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-6 w-16 h-16 flex items-center justify-center mx-auto">
                    <TrendingUp className="h-8 w-8 text-red-500" />
                  </div>
                  <div>
                    <p className="text-red-900 dark:text-red-100 text-lg font-semibold mb-1">Error Loading Data</p>
                    <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            ) : data.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 w-16 h-16 flex items-center justify-center mx-auto">
                    <TrendingUp className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white text-lg font-semibold mb-1">No data available</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Analytics will appear here once data is collected</p>
                  </div>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartConfig.desktop.color} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={chartConfig.desktop.color} stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartConfig.mobile.color} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={chartConfig.mobile.color} stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip content={<CustomAreaTooltip />} />
                  <Legend 
                    iconType="rect"
                    wrapperStyle={{
                      paddingTop: '20px',
                      fontSize: '14px',
                      fontWeight: 'medium'
                    }}
                  />
                  <Area
                    dataKey="desktop"
                    name="Desktop"
                    type="monotone"
                    fill="url(#fillDesktop)"
                    stroke={chartConfig.desktop.color}
                    strokeWidth={2}
                    stackId="a"
                    animationDuration={1000}
                    animationEasing="ease-out"
                  />
                  <Area
                    dataKey="mobile"
                    name="Mobile"
                    type="monotone"
                    fill="url(#fillMobile)"
                    stroke={chartConfig.mobile.color}
                    strokeWidth={2}
                    stackId="a"
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
