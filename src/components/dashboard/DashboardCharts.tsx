"use client";
import React, { useState, useEffect } from "react";
import { Card } from "../../components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { AreaChart, BarChart, XAxis, YAxis, Tooltip as RechartsTooltip, Area, Bar, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { getDashboardSummary } from "../../services/api";

interface DashboardChartsProps {
  dashboardData?: any;
  loading?: boolean;
}

export default function DashboardCharts({ dashboardData, loading }: DashboardChartsProps) {
  const [range, setRange] = useState("7d");
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Load analytics data
  const loadAnalytics = async (selectedRange: string) => {
    setAnalyticsLoading(true);
    try {
      console.log('[DashboardCharts] Loading analytics for range:', selectedRange);
      
      // Map range to days
      const daysMap: Record<string, number> = {
        '7d': 7,
        '30d': 30,
        'Q1': 90,
        'all': 365
      };
      const days = daysMap[selectedRange] || 30;
      
      // Use getDashboardSummary which returns trend data
      const data = await getDashboardSummary(days);
      console.log('[DashboardCharts] Summary data:', data);
      setAnalyticsData(data);
    } catch (e) {
      console.error('[DashboardCharts] Error loading analytics:', e);
      // Fallback to dashboard data if available
      setAnalyticsData(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics(range);
  }, [range]);

  // Prepare chart data from real API responses
  const prepareAreaData = () => {
    if (analyticsData?.trend && analyticsData.trend.length > 0) {
      return analyticsData.trend.map((item: any, idx: number) => ({
        date: item.date ? new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }) : `Day ${idx + 1}`,
        submissions: item.count || 0
      }));
    } else if (dashboardData?.daily_submissions && dashboardData.daily_submissions.length > 0) {
      return dashboardData.daily_submissions.map((item, idx) => ({
        date: item.date ? new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }) : `Day ${idx + 1}`,
        submissions: item.count || item.submissions || 0
      }));
    }
    // Return empty data if no real data available
    return [];
  };

  const prepareBarData = () => {
    if (analyticsData?.form_breakdown && analyticsData.form_breakdown.length > 0) {
      return analyticsData.form_breakdown.map(item => ({
        form: item.form_name || item.name || 'Unknown Form',
        submissions: item.submissions || item.count || 0
      }));
    } else if (dashboardData?.form_breakdown && dashboardData.form_breakdown.length > 0) {
      return dashboardData.form_breakdown.map(item => ({
        form: item.form_name || item.name || 'Unknown Form', 
        submissions: item.submissions || item.count || 0
      }));
    }
    // Return empty data if no real data available
    return [];
  };

  const areaData = prepareAreaData();
  const barData = prepareBarData();
  const isLoading = loading || analyticsLoading;

  return (
    <Card className="w-full mt-10 p-6 bg-gradient-to-br from-[#0f172a]/90 to-[#0014FF]/70 dark:bg-[#0f172a] rounded-2xl shadow-xl border-0 relative overflow-hidden">
      {/* Subtle noise overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "url('/grain.svg')", opacity: 0.13 }} />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 z-10">
        <h2 className="text-xl font-bold text-white mb-4 md:mb-0">Analytics</h2>
        <Tabs value={range} onValueChange={(value) => setRange(value)} className="">
          <TabsList>
            <TabsTrigger value="7d">7d</TabsTrigger>
            <TabsTrigger value="30d">30d</TabsTrigger>
            <TabsTrigger value="Q1">Q1</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="ml-3 text-white">Loading analytics...</span>
        </div>
      ) : (
        <div className="w-full max-w-3xl mx-auto overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Area Chart */}
            <div className="bg-[#0f172a]/80 rounded-xl p-4 shadow-lg">
              <h3 className="text-white text-lg font-semibold mb-2">Submissions per Day</h3>
              <ResponsiveContainer width="100%" height={220}>
                {areaData.length > 0 ? (
                  <AreaChart data={areaData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6EE7B7" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#6EE7B7"/>
                    <YAxis stroke="#6EE7B7"/>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                    <RechartsTooltip contentStyle={{ background: "#0f172a", border: "none", color: "#fff" }} />
                    <Area type="monotone" dataKey="submissions" stroke="#6EE7B7" fillOpacity={1} fill="url(#colorSub)" />
                  </AreaChart>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-300">No daily data available</p>
                  </div>
                )}
              </ResponsiveContainer>
            </div>
            
            {/* Bar Chart */}
            <div className="bg-[#0f172a]/80 rounded-xl p-4 shadow-lg">
              <h3 className="text-white text-lg font-semibold mb-2">Submissions per Form</h3>
              <ResponsiveContainer width="100%" height={220}>
                {barData.length > 0 ? (
                  <BarChart data={barData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                    <XAxis dataKey="form" stroke="#6EE7B7"/>
                    <YAxis stroke="#6EE7B7"/>
                    <RechartsTooltip contentStyle={{ background: "#0f172a", border: "none", color: "#fff" }} />
                    <Legend />
                    <Bar dataKey="submissions" fill="#6EE7B7" />
                  </BarChart>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-300">No form data available</p>
                  </div>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
