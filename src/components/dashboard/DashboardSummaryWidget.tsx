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
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm`}>
              <Icon className={`h-6 w-6 ${classes.icon}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${classes.text}`}>{value}</p>
              <p className={`text-sm ${classes.subtext} font-medium`}>{title}</p>
              {description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
              )}
            </div>
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.positive ? <TrendingUp className="h-4 w-4" /> : <TrendingUp className="h-4 w-4 transform rotate-180" />}
              {Math.abs(trend.value)}%
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
  onRefresh
}: DashboardSummaryWidgetProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Calculate trends (mock data for demonstration)
  const submissionsTrend = { value: 12.5, positive: true };
  const formsTrend = { value: 8.3, positive: true };

  return (
    <div className="space-y-6">
      {/* Header with Action Buttons */}
      <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-blue-800 dark:text-blue-200 text-opacity-100">
                Dashboard Overview
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 mt-1 opacity-100">
                Real-time insights and quick actions for your forms and submissions
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 bg-transparent flex items-center gap-2"
              >
                <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                asChild 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg border border-blue-500 font-bold px-4 py-2 min-w-[140px] opacity-100"
                style={{ 
                  background: 'linear-gradient(to right, #2563eb, #9333ea)',
                  color: 'white',
                  visibility: 'visible',
                  opacity: 1,
                  display: 'flex'
                }}
              >
                <Link href="/forms/new" className="flex items-center gap-2 font-semibold text-white no-underline">
                  <Plus className="h-4 w-4 text-white flex-shrink-0" />
                  <span className="text-white font-semibold">Create Form</span>
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Quick Actions and System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Quick Actions Panel */}
        <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
              Quick Actions
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white justify-start">
                <Link href="/forms/new" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Form
                </Link>
              </Button>
              <Button asChild className="bg-green-600 hover:bg-green-700 text-white justify-start">
                <Link href="/submissions" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  View Submissions
                </Link>
              </Button>
              <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white justify-start">
                <Link href="/analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </Link>
              </Button>
              <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white justify-start">
                <Link href="/api-tokens" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  API Tokens
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Health Panel */}
        <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
              System Health
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Current status of your integrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Webhook Health */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Webhook Delivery</span>
                <Badge variant={webhookSuccessRate >= 95 ? 'default' : 'destructive'}>
                  {webhookSuccessRate >= 95 ? 'Healthy' : 'Issues Detected'}
                </Badge>
              </div>
              <WebhookStatusIndicator 
                successRate={webhookSuccessRate} 
                active={activeWebhooks} 
                failed={failedWebhooks} 
              />
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    webhookSuccessRate >= 95 ? 'bg-green-500' : 
                    webhookSuccessRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${webhookSuccessRate}%` }}
                ></div>
              </div>
            </div>

            {/* API Status */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">API Status</span>
                <Badge variant="default">Operational</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                All systems operational
              </div>
            </div>

            {/* Storage Status */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Storage</span>
                <Badge variant="default">85% Available</Badge>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="w-1/6 h-2 bg-blue-500 rounded-full"></div>
              </div>
            </div>

            {/* Quick Health Actions */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Last updated: Just now</span>
                <Button asChild className="text-xs px-3 py-1 h-auto bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300">
                  <Link href="/webhooks" className="flex items-center gap-1">
                    <Settings className="h-3 w-3" />
                    Manage
                  </Link>
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
