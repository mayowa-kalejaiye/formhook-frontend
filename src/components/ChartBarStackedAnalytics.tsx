"use client";
import * as React from "react";
import { Bar, BarChart, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { TrendingUp, BarChart3 } from "lucide-react";

export interface AnalyticsBarChartProps {
  data: Array<{
    date: string;
    value1: number;
    value2: number;
    label1: string;
    label2: string;
    color1?: string;
    color2?: string;
  }>;
  title?: string;
  description?: string;
  label1?: string;
  label2?: string;
  color1?: string;
  color2?: string;
}

// Enhanced custom tooltip component
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const date = new Date(label).toLocaleDateString("en-US", {
      weekday: 'long',
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    
    const total = payload.reduce((sum: number, item: any) => sum + item.value, 0);
    
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
        <p className="font-semibold text-gray-900 dark:text-white mb-3">{date}</p>
        <div className="space-y-2">
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.name}
                </span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {item.value.toLocaleString()}
              </span>
            </div>
          ))}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
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

export function ChartBarStackedAnalytics({
  data,
  title = "Stacked Bar Chart",
  description = "",
  label1 = "Value 1",
  label2 = "Value 2",
  color1 = "#6366f1",
  color2 = "#22d3ee",
}: AnalyticsBarChartProps) {
  // Calculate trends
  const total = React.useMemo(() => {
    return data.reduce((sum, item) => sum + item.value1 + item.value2, 0);
  }, [data]);

  const successRate = React.useMemo(() => {
    const totalSuccess = data.reduce((sum, item) => sum + item.value1, 0);
    return total > 0 ? Math.round((totalSuccess / total) * 100) : 0;
  }, [data, total]);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full">
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{total.toLocaleString()}</p>
              <p className="text-sm text-blue-600 dark:text-blue-300">Total Events</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{successRate}%</p>
              <p className="text-sm text-green-600 dark:text-green-300">Success Rate</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-full">
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {data.length}
              </p>
              <p className="text-sm text-purple-600 dark:text-purple-300">Days Tracked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Chart */}
      <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart 
              data={data} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              barCategoryGap="20%"
            >
              <defs>
                <linearGradient id="gradient1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color1} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={color1} stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="gradient2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color2} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={color2} stopOpacity={0.6} />
                </linearGradient>
              </defs>
              
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e2e8f0" 
                opacity={0.6} 
                vertical={false}
              />
              
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(value) => {
                  return new Date(value).toLocaleDateString("en-US", {
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
              
              <Tooltip content={<CustomTooltip />} />
              
              <Legend 
                iconType="rect"
                wrapperStyle={{
                  paddingTop: '20px',
                  fontSize: '14px',
                  fontWeight: 'medium'
                }}
              />
              
              <Bar
                dataKey="value1"
                name={label1}
                stackId="a"
                fill="url(#gradient1)"
                radius={[0, 0, 4, 4]}
                animationDuration={1000}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="value2"
                name={label2}
                stackId="a"
                fill="url(#gradient2)"
                radius={[4, 4, 0, 0]}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
