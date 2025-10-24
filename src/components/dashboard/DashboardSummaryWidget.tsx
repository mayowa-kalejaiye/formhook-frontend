import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import Link from 'next/link';
import { 
  FileText, 
  BarChart3, 
  Webhook, 
  Bell, 
  Users, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  Plus,
  ExternalLink,
  RefreshCcw,
  Settings,
  Eye,
  Download
} from 'lucide-react';

interface DashboardSummaryWidgetProps {
  totalForms: number;
  totalSubmissions: number;
  recentSubmissions: any[];
  webhookSuccessRate: number;
  activeWebhooks: number;
  failedWebhooks: number;
  loading?: boolean;
  onRefresh?: () => void;
  // Add trend data from API
  previousPeriodForms?: number;
  previousPeriodSubmissions?: number;
}

interface StatusCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  description?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
  loading?: boolean;
}

function StatusCard({ title, value, icon: Icon, color, description, trend, loading }: StatusCardProps) {
  const colorClasses = {
    blue: {
      bg: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
      border: 'border-blue-200 dark:border-blue-700',
      icon: 'text-blue-600',
      text: 'text-blue-900 dark:text-blue-100',
      subtext: 'text-blue-600 dark:text-blue-300'
    },
    green: {
      bg: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
      border: 'border-green-200 dark:border-green-700',
      icon: 'text-green-600',
      text: 'text-green-900 dark:text-green-100',
      subtext: 'text-green-600 dark:text-green-300'
    },
    yellow: {
      bg: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20',
      border: 'border-yellow-200 dark:border-yellow-700',
      icon: 'text-yellow-600',
      text: 'text-yellow-900 dark:text-yellow-100',
      subtext: 'text-yellow-600 dark:text-yellow-300'
    },
    red: {
      bg: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
      border: 'border-red-200 dark:border-red-700',
      icon: 'text-red-600',
      text: 'text-red-900 dark:text-red-100',
      subtext: 'text-red-600 dark:text-red-300'
    },
    purple: {
      bg: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
      border: 'border-purple-200 dark:border-purple-700',
      icon: 'text-purple-600',
      text: 'text-purple-900 dark:text-purple-100',
      subtext: 'text-purple-600 dark:text-purple-300'
    },
    gray: {
      bg: 'from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20',
      border: 'border-gray-200 dark:border-gray-700',
      icon: 'text-gray-600',
      text: 'text-gray-900 dark:text-gray-100',
      subtext: 'text-gray-600 dark:text-gray-300'
    }
  };

  const classes = colorClasses[color];

  if (loading) {
    return (
      <Card className={`bg-gradient-to-br ${classes.bg} ${classes.border} animate-pulse`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl bg-gray-300 dark:bg-gray-600`}></div>
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br ${classes.bg} ${classes.border} hover:shadow-lg transition-all duration-200`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className={`p-2 sm:p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex-shrink-0`}>
              <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${classes.icon}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-xl sm:text-2xl font-bold ${classes.text} truncate`}>{value}</p>
              <p className={`text-xs sm:text-sm ${classes.subtext} font-medium truncate`}>{title}</p>
              {description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{description}</p>
              )}
            </div>
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs sm:text-sm font-medium flex-shrink-0 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.positive ? <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" /> : <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 transform rotate-180" />}
              <span className="whitespace-nowrap">{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function WebhookStatusIndicator({ successRate, active, failed }: { successRate: number; active: number; failed: number }) {
  const getStatusColor = (rate: number) => {
    if (rate >= 95) return 'green';
    if (rate >= 80) return 'yellow';
    return 'red';
  };

  const statusColor = getStatusColor(successRate);
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${statusColor === 'green' ? 'bg-green-500' : statusColor === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
        <span className="text-sm font-medium">{successRate.toFixed(1)}% Success Rate</span>
      </div>
      <div className="text-xs text-gray-500 flex items-center gap-1">
        <CheckCircle className="h-3 w-3 text-green-500" />
        {active}
        <XCircle className="h-3 w-3 text-red-500" />
        {failed}
      </div>
    </div>
  );
}

export default function DashboardSummaryWidget({
  totalForms,
  totalSubmissions,
  recentSubmissions,
  webhookSuccessRate,
  activeWebhooks,
  failedWebhooks,
  loading = false,
  onRefresh,
  previousPeriodForms = 0,
  previousPeriodSubmissions = 0
}: DashboardSummaryWidgetProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Calculate real trends from actual data
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) {
      return current > 0 ? { value: 100, positive: true } : { value: 0, positive: true };
    }
    const percentChange = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(percentChange * 10) / 10),
      positive: percentChange >= 0
    };
  };

  const submissionsTrend = calculateTrend(totalSubmissions, previousPeriodSubmissions);
  const formsTrend = calculateTrend(totalForms, previousPeriodForms);

  return (
    <div className="space-y-6">
      {/* Header with Action Buttons */}
      <div className="flex flex-row items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Here is the summary of overall data
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatusCard
          title="Total Forms"
          value={totalForms}
          icon={FileText}
          color="blue"
          description="Active forms"
          trend={formsTrend}
          loading={loading}
        />
        <StatusCard
          title="Total Submissions"
          value={totalSubmissions.toLocaleString()}
          icon={BarChart3}
          color="green"
          description="All time submissions"
          trend={submissionsTrend}
          loading={loading}
        />
        <StatusCard
          title="Recent Activity"
          value={recentSubmissions.length}
          icon={Activity}
          color="purple"
          description="Last 24 hours"
          loading={loading}
        />
        <StatusCard
          title="Webhook Status"
          value={`${webhookSuccessRate.toFixed(1)}%`}
          icon={Webhook}
          color={webhookSuccessRate >= 95 ? 'green' : webhookSuccessRate >= 80 ? 'yellow' : 'red'}
          description="Success rate"
          loading={loading}
        />
      </div>

    </div>
  );
}

