import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Dynamic Chart Components
import dynamic from 'next/dynamic';

// Dynamic Recharts Components
const DynamicResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const DynamicBarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const DynamicBar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const DynamicXAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const DynamicYAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const DynamicTooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const DynamicLineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false });
const DynamicLine = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });
const DynamicAreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const DynamicArea = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const DynamicCartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });

// Components
import DashboardHeader from '../components/DashboardHeader';
import { getDashboardSummary, getSubmissions, getFormAnalytics, getFormGeoAnalytics, isRequestCooldownActive, getCurrentSubscription, getSubscriptionUsage, API_BASE_URL } from '../services/api';
import MetricCard from '../components/dashboard/MetricCard';
import WelcomeBlock from '../components/dashboard/WelcomeBlock';
import DashboardSummaryWidget from '../components/dashboard/DashboardSummaryWidget';
import RecentActivities from '../components/dashboard/RecentActivities';
import DashboardNav from '../components/DashboardNav';
import BottomGradientRadial from '../components/BottomGradientRadial';
import { useNotifications } from '../context/NotificationContext';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import ToastView from '../components/ToastView';
import { useForms } from '../context/FormsContext';
import { useAuth } from '../context/AuthContext';
import { safeReplace } from '../lib/navigation';
import { useSidebar } from '../context/SidebarContext';
import AuthLayout from '../components/AuthLayout';
import { showApiError } from '../hooks/use-toast';
import { normalizeSubscriptionInfo } from '@/lib/subscription';
import { 
  FileText, 
  BarChart3, 
  Webhook, 
  Bell, 
  Users, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  Search, 
  Plus, 
  Download, 
  RefreshCcw, 
  ExternalLink,
  Calendar,
  Clock,
  Target,
  Zap,
  Code,
  ArrowUpRight,
  MoreHorizontal
} from 'lucide-react';

type BreakdownEntry = {
  name: string;
  count: number;
  percent: number;
  code?: string;
};

type IpIntelRecord = {
  ip?: string | null;
  country?: string | null;
  countryCode?: string | null;
  region?: string | null;
  city?: string | null;
  org?: string | null;
};

type SubmissionRecord = {
  ip_address?: string | null;
  ipAddress?: string | null;
  device_type?: string | null;
  deviceType?: string | null;
  user_agent?: string | null;
  userAgent?: string | null;
  data?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  headers?: Record<string, any> | null;
  geo?: Record<string, any> | null;
  geoip?: Record<string, any> | null;
  location?: Record<string, any> | null;
};

type SubmissionsSummaryPoint = { date: string; submissions: number; errors: number };

const clampNumber = (value: number, min: number, max: number) => {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
};

const percentOf = (value: number, total: number) => {
  if (!total || total <= 0) return 0;
  return (value / total) * 100;
};

const countryFlagEmoji = (countryCode?: string | null) => {
  if (!countryCode) return '🌐';
  const normalized = countryCode.trim().toUpperCase();
  if (normalized.length !== 2) return '🌐';
  const base = 127397;
  return String.fromCodePoint(...normalized.split('').map((char) => base + char.charCodeAt(0)));
};

const extractSubmissionIp = (submission: SubmissionRecord): string | undefined => {
  const inlineIp =
    submission?.ip_address ||
    submission?.ipAddress ||
    submission?.metadata?.ip_address ||
    submission?.metadata?.ip ||
    submission?.data?.ip_address ||
    submission?.data?.ip ||
    undefined;

  if (inlineIp && typeof inlineIp === 'string') {
    return inlineIp.trim();
  }

  const headerIp =
    submission?.headers?.['x-forwarded-for'] ||
    submission?.headers?.['x-real-ip'] ||
    submission?.headers?.['cf-connecting-ip'] ||
    undefined;

  if (headerIp && typeof headerIp === 'string') {
    return headerIp.split(',')[0]?.trim();
  }

  return undefined;
};

const deriveSubmissionIntel = (submission: SubmissionRecord): IpIntelRecord => {
  const candidateSources = [
    submission,
    submission?.data,
    submission?.metadata,
    submission?.location,
    submission?.geo,
    submission?.geoip,
  ].filter((source): source is Record<string, any> => Boolean(source));

  const pick = (...keys: string[]): string | undefined => {
    for (const source of candidateSources) {
      for (const key of keys) {
        const value = source[key];
        if (typeof value === 'string' && value.trim()) {
          return value.trim();
        }
      }
    }
    return undefined;
  };

  return {
    ip: extractSubmissionIp(submission) || pick('ip', 'ip_address', 'ipAddress'),
    country: pick('country_name', 'country', 'countryName'),
    countryCode: (pick('country_code', 'countryCode') || pick('country'))?.toUpperCase(),
    region: pick('region', 'state', 'regionName'),
    city: pick('city', 'metro'),
    org: pick('org', 'organization', 'isp', 'network', 'asn'),
  };
};

const detectBrowserFromUserAgent = (ua?: string | null) => {
  if (!ua) return 'Unknown';
  const l = ua.toLowerCase();
  if (l.includes('chrome') && !l.includes('edg') && !l.includes('opr')) return 'Chrome';
  if (l.includes('firefox')) return 'Firefox';
  if (l.includes('safari') && !l.includes('chrome')) return 'Safari';
  if (l.includes('edg') || l.includes('edge')) return 'Edge';
  if (l.includes('opr') || l.includes('opera')) return 'Opera';
  if (l.includes('brave')) return 'Brave';
  return 'Other';
};

const detectOsFromUserAgent = (ua?: string | null) => {
  if (!ua) return 'Unknown';
  const l = ua.toLowerCase();
  if (l.includes('windows')) return 'Windows';
  if (l.includes('mac os') || l.includes('macintosh') || l.includes('macos')) return 'macOS';
  if (l.includes('android')) return 'Android';
  if (l.includes('iphone') || l.includes('ipad') || l.includes('ios')) return 'iOS';
  if (l.includes('linux')) return 'Linux';
  if (l.includes('cros')) return 'ChromeOS';
  return 'Other';
};

const detectDeviceFromUserAgent = (ua?: string | null) => {
  if (!ua) return 'Unknown';
  const l = ua.toLowerCase();
  if (l.includes('tablet') || l.includes('ipad')) return 'Tablet';
  if (l.includes('mobile') || l.includes('iphone') || l.includes('android')) return 'Mobile';
  if (l.includes('bot') || l.includes('crawler') || l.includes('spider')) return 'Bot';
  return 'Desktop';
};

const normalizeDeviceType = (value?: string | null, fallbackUa?: string | null) => {
  if (value) {
    const normalized = value.toString().trim().toLowerCase();
    if (!normalized) return 'Unknown';
    if (['mobile', 'phone', 'smartphone'].includes(normalized)) return 'Mobile';
    if (['tablet', 'ipad'].includes(normalized)) return 'Tablet';
    if (['desktop', 'laptop', 'pc'].includes(normalized)) return 'Desktop';
    if (['bot', 'crawler', 'automation', 'spider'].includes(normalized)) return 'Bot';
    if (normalized === 'unknown') return 'Unknown';
  }
  return detectDeviceFromUserAgent(fallbackUa) || 'Unknown';
};

const getSubmissionUserAgent = (submission: SubmissionRecord | Record<string, any> | null | undefined) => {
  if (!submission) return '';
  return (
    (submission as SubmissionRecord)?.user_agent ||
    (submission as SubmissionRecord)?.userAgent ||
    submission?.metadata?.userAgent ||
    submission?.metadata?.user_agent ||
    submission?.data?.user_agent ||
    submission?.data?.userAgent ||
    submission?.headers?.['user-agent'] ||
    (submission as any)?.raw?.userAgent ||
    ''
  );
};

const getSubmissionDeviceType = (submission: SubmissionRecord | Record<string, any> | null | undefined, fallbackUa?: string | null) => {
  if (!submission) return 'Unknown';
  const explicit =
    (submission as SubmissionRecord)?.device_type ||
    (submission as SubmissionRecord)?.deviceType ||
    submission?.metadata?.device_type ||
    submission?.metadata?.deviceType ||
    submission?.data?.device_type ||
    submission?.data?.deviceType ||
    undefined;
  return normalizeDeviceType(explicit, fallbackUa || getSubmissionUserAgent(submission));
};

const aggregateIpField = (
  records: IpIntelRecord[],
  accessor: (record: IpIntelRecord) => string | undefined | null,
  enrich?: (record: IpIntelRecord) => Partial<BreakdownEntry>,
  limit = 5,
): BreakdownEntry[] => {
  if (!Array.isArray(records) || !records.length) return [];

  const buckets = new Map<string, { count: number; meta?: Partial<BreakdownEntry> }>();

  records.forEach((record) => {
    const key = accessor(record)?.trim();
    if (!key) return;
    const entry = buckets.get(key) || { count: 0 };
    entry.count += 1;
    if (enrich) {
      entry.meta = { ...entry.meta, ...enrich(record) };
    }
    buckets.set(key, entry);
  });

  const total = Array.from(buckets.values()).reduce((sum, current) => sum + current.count, 0);

  return Array.from(buckets.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      percent: percentOf(data.count, total),
      ...(data.meta || {}),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

const fetchWithTimeout = async (url: string, timeoutMs = 4500) => {
  if (typeof fetch === 'undefined') return null;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : undefined;
  try {
    const response = await fetch(url, { signal: controller?.signal });
    if (!response.ok) return null;
    const json = await response.json();
    return json;
  } catch (error) {
    return null;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

async function lookupIpIntel(ip: string): Promise<IpIntelRecord | null> {
  if (!ip) return null;
  const primary = await fetchWithTimeout(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
  const payload = primary && !primary.error ? primary : await fetchWithTimeout(`https://ipwho.is/${encodeURIComponent(ip)}`);
  if (!payload || payload.error) return null;

  return {
    ip,
    country: payload.country_name || payload.country || payload.countryName || null,
    countryCode: (payload.country_code || payload.country_code2 || payload.country) ?? null,
    region: payload.region || payload.region_code || payload.state_prov || payload.state || null,
    city: payload.city || null,
    org: payload.org || payload.org_name || payload.connection?.org || payload.connection?.isp || payload.isp || null,
  };
}

type IpBreakdown = {
  sampleSize: number;
  countries: BreakdownEntry[];
  regions: BreakdownEntry[];
};

async function buildIpBreakdownFromSubmissions(submissions: SubmissionRecord[]): Promise<IpBreakdown> {
  const normalized = Array.isArray(submissions) ? submissions : [];
  if (!normalized.length) {
    return { sampleSize: 0, countries: [], regions: [] };
  }

  const ipCandidates = normalized
    .map((submission) => extractSubmissionIp(submission))
    .filter((ip): ip is string => Boolean(ip && ip.length > 0));

  const uniqueIps = Array.from(new Set(ipCandidates)).slice(0, 25);

  let intelRecords: IpIntelRecord[] = [];
  if (uniqueIps.length) {
    const lookups = await Promise.allSettled(uniqueIps.map((ip) => lookupIpIntel(ip)));
    intelRecords = lookups
      .filter((result): result is PromiseFulfilledResult<IpIntelRecord | null> => result.status === 'fulfilled')
      .map((result) => result.value)
      .filter((record): record is IpIntelRecord => Boolean(record));
  }

  if (!intelRecords.length) {
    intelRecords = normalized
      .map(deriveSubmissionIntel)
      .filter((record) => Boolean(record.country || record.region || record.city || record.org));
  }

  if (!intelRecords.length) {
    return { sampleSize: uniqueIps.length || normalized.length, countries: [], regions: [] };
  }

  return {
    sampleSize: uniqueIps.length || normalized.length,
    countries: aggregateIpField(intelRecords, (record) => record.country, (record) => ({ code: record.countryCode }), 7),
    regions: aggregateIpField(
      intelRecords,
      (record) =>
        record.city && record.countryCode
          ? `${record.city}, ${record.countryCode}`
          : record.city || record.region || record.country,
      undefined,
      7,
    ),
  };
}

const SubmissionsSummaryChart = React.memo(function SubmissionsSummaryChart({ data }: { data: SubmissionsSummaryPoint[] }) {
  const [chartReady, setChartReady] = React.useState(false);
  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => setChartReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const chartData = (data || []).map((point) => ({
    date: point.date ? new Date(point.date).toLocaleDateString() : '',
    submissions: point.submissions || 0,
    errors: point.errors || 0,
  }));

  const hasData = chartData.length > 0 && chartData.some((point) => point.submissions || point.errors);

  return (
    <div className="mt-6">
      {hasData && chartReady ? (
        <div className="w-full h-52 min-w-0">
          <DynamicResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
            <DynamicAreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <DynamicCartesianGrid strokeDasharray="3 3" stroke="#e6eefb" />
              <DynamicXAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
              <DynamicYAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <DynamicTooltip contentStyle={{ background: '#fff', border: '1px solid #e6eefb' }} />
              <DynamicArea type="monotone" dataKey="submissions" stroke="#3B82F6" fillOpacity={0.18} fill="#3B82F6" />
              <DynamicArea type="monotone" dataKey="errors" stroke="#ef4444" fillOpacity={0.08} fill="#ef4444" />
            </DynamicAreaChart>
          </DynamicResponsiveContainer>
        </div>
      ) : (
        <div className="text-sm text-slate-500">No trend data available</div>
      )}
    </div>
  );
});

// Professional avatar component for email initials
function EmailAvatar({ email }: { email: string }) {
  const getInitials = (email: string, name: string) => {
    // Always return "F" for FormHook branding
    return "F";
  };

  return (
    <div className="h-10 w-10 rounded-md bg-slate-600 dark:bg-slate-700 flex items-center justify-center border border-slate-300 dark:border-slate-600">
      <span className="text-white font-semibold text-sm">
        F
      </span>
    </div>
  );
}

// Professional avatar component for form names
function FormAvatar({ name }: { name: string }) {
  const getInitials = (name: string) => {
    if (!name) return '?';
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    if (!name) return 'bg-slate-400 dark:bg-slate-600';
    // Professional slate-based colors only
    const colors = [
      'bg-slate-500 dark:bg-slate-600',
      'bg-slate-600 dark:bg-slate-700', 
      'bg-slate-700 dark:bg-slate-800',
      'bg-slate-500 dark:bg-slate-600',
      'bg-slate-600 dark:bg-slate-700',
      'bg-slate-700 dark:bg-slate-800',
      'bg-slate-500 dark:bg-slate-600',
      'bg-slate-600 dark:bg-slate-700'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className={`h-10 w-10 rounded-md ${getAvatarColor(name)} flex items-center justify-center border border-slate-300 dark:border-slate-600`}>
      <span className="text-white font-semibold text-sm">
        {getInitials(name)}
      </span>
    </div>
  );
}

// Trend chart using recharts, styled with shadcn Card
const trendLabels = {
  today: 'today',
  yesterday: 'yesterday',
  '7d': 'last 7 days',
  '14d': 'last 2 weeks',
} as const;
type TrendRange = keyof typeof trendLabels;

const trendRangeDayMap: Record<TrendRange, number> = {
  today: 1,
  yesterday: 2,
  '7d': 7,
  '14d': 14,
};

const isSameDay = (first?: Date, second?: Date) => {
  if (!first || !second) return false;
  if (Number.isNaN(first.getTime()) || Number.isNaN(second.getTime())) return false;
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
};

const clampSeriesToTrendRange = <T extends { date?: string | Date }>(
  series: T[] = [],
  range: TrendRange,
): T[] => {
  if (!Array.isArray(series) || series.length === 0) return [];

  if (range === 'today' || range === 'yesterday') {
    const target = new Date();
    if (range === 'yesterday') {
      target.setDate(target.getDate() - 1);
    }
    const filtered = series.filter((point) => {
      if (!point?.date) return false;
      const pointDate = new Date(point.date);
      return isSameDay(pointDate, target);
    });
    if (filtered.length > 0) {
      return filtered;
    }
  }

  const days = trendRangeDayMap[range] || series.length;
  const sliceCount = Math.min(series.length, days);
  return series.slice(Math.max(series.length - sliceCount, 0));
};

function ModernTrendChart({ data, trendRange, chartType, onChartTypeChange, onTrendRangeChange }: {
  data: { date: string; count: number }[];
  trendRange: TrendRange;
  chartType: 'bar' | 'line' | 'area';
  onChartTypeChange: (type: 'bar' | 'line' | 'area') => void;
  onTrendRangeChange: (range: TrendRange) => void;
}) {
  const [chartReady, setChartReady] = React.useState(false);
  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => setChartReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const hasData = Array.isArray(data) && data.length > 0;
  
  return (
    <Card className="pro-card">
      <CardHeader className="pb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Submissions Trend
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              {trendRange === 'today' && 'Track your form submissions for today'}
              {trendRange === 'yesterday' && 'Yesterday\'s form submission activity'}
              {trendRange === '7d' && 'Submission trends over the last week'}
              {trendRange === '14d' && 'Two weeks of submission analytics'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Select value={trendRange} onValueChange={(value) => onTrendRangeChange(value as TrendRange)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="14d">Last 2 Weeks</SelectItem>
              </SelectContent>
            </Select>
            <Select value={chartType} onValueChange={(value) => onChartTypeChange(value as 'bar' | 'line' | 'area')}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Chart type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-80 w-full min-w-0">
          <DynamicResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
            {hasData && chartReady ? (
              chartType === 'bar' ? (
                <DynamicBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <DynamicCartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <DynamicXAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <DynamicYAxis 
                    allowDecimals={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <DynamicTooltip 
                    cursor={{ fill: 'rgba(71, 85, 105, 0.1)' }} 
                    contentStyle={{ 
                      background: '#fff', 
                      borderRadius: 8, 
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <DynamicBar dataKey="count" fill="#64748b" radius={[4, 4, 0, 0]} />
                </DynamicBarChart>
              ) : chartType === 'line' ? (
                <DynamicLineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <DynamicCartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <DynamicXAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <DynamicYAxis 
                    allowDecimals={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <DynamicTooltip 
                    contentStyle={{ 
                      background: '#fff', 
                      borderRadius: 8, 
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <DynamicLine 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#64748b" 
                    strokeWidth={2} 
                    dot={{ r: 4, fill: '#64748b' }}
                    activeDot={{ r: 6, fill: '#475569' }}
                  />
                </DynamicLineChart>
              ) : (
                <DynamicAreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <DynamicCartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <DynamicXAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <DynamicYAxis 
                    allowDecimals={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <DynamicTooltip 
                    contentStyle={{ 
                      background: '#fff', 
                      borderRadius: 8, 
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <DynamicArea 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#64748b" 
                    fill="rgba(100, 116, 139, 0.1)" 
                    strokeWidth={2} 
                  />
                </DynamicAreaChart>
              )
            ) : (
              <div className="relative w-full h-full min-h-[260px]">
                <div className="absolute inset-0 flex items-center justify-center text-center px-4">
                  <div className="space-y-4">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-md p-6 w-20 h-20 flex items-center justify-center mx-auto">
                      <BarChart3 className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                    </div>
                    <div>
                      <p className="text-slate-900 dark:text-slate-100 text-lg font-semibold mb-1">No event traffic yet</p>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">Traffic and delivery signals will appear once events start flowing.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DynamicResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

    const MemoTopFormsCard = React.memo(TopFormsCard);

// Development-only debug logger to avoid noisy production logs
const isDev = process.env.NODE_ENV !== 'production';
const debug = {
  log: (...args: any[]) => { if (isDev) console.log(...args); },
  warn: (...args: any[]) => { if (isDev) console.warn(...args); },
  error: (...args: any[]) => { if (isDev) console.error(...args); }
};

const MemoModernTrendChart = React.memo(ModernTrendChart);

function RecentSubmissionsCard({ submissions, loading }: { submissions: any[]; loading: boolean }) {
  if (loading) {
    return (
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Recent Submissions</CardTitle>
          <CardDescription>Latest incoming events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pro-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Recent Submissions
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Latest incoming payloads from your sources
            </CardDescription>
          </div>
          <Button asChild className="pro-btn-secondary flex items-center gap-2 text-sm px-3 py-2 h-8">
            <Link href="/submissions">
              <ExternalLink className="h-4 w-4" />
              View All
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {submissions && submissions.length > 0 ? (
          <div className="space-y-4">
            {submissions.slice(0, 5).map((sub, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors">
                <div className="flex items-center space-x-4">
                  <EmailAvatar email={sub.email || ''} />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{sub.form_name || 'Untitled Form'}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{sub.email || 'No email'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={sub.status === 'success' ? 'default' : 'destructive'} className="mb-1">
                    {sub.status || 'unknown'}
                  </Badge>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {sub.date ? new Date(sub.date).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-md p-6 w-24 h-24 flex items-center justify-center mx-auto">
              <Activity className="h-12 w-12 text-slate-400 dark:text-slate-500" />
            </div>
            <div>
              <p className="text-slate-900 dark:text-slate-100 text-lg font-semibold mb-1">No incoming events yet</p>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Captured payloads will appear here once your endpoints receive traffic.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const MemoRecentSubmissionsCard = React.memo(RecentSubmissionsCard);

// function QuickActionsCard() {
//   return (
//     <Card className="pro-card">
//       <CardHeader className="border-b border-slate-200 dark:border-slate-700">
//         <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">Quick Actions</CardTitle>
//         <CardDescription className="text-slate-600 dark:text-slate-400">
//           Common tasks to manage your forms
//         </CardDescription>
//       </CardHeader>
//       <CardContent className="space-y-3 pt-6">
//         <Button asChild className="pro-btn-primary w-full">
//           <Link href="/forms/new" className="flex items-center gap-2 justify-center">
//             <Plus className="h-4 w-4" />
//             Create New Form
//           </Link>
//         </Button>
//         <Button asChild className="pro-btn-secondary w-full">
//           <Link href="/forms" className="flex items-center gap-2 justify-center">
//             <FileText className="h-4 w-4" />
//             Manage Forms
//           </Link>
//         </Button>
//         <Button asChild className="pro-btn-secondary w-full">
//           <Link href="/webhooks" className="flex items-center gap-2 justify-center">
//             <Webhook className="h-4 w-4" />
//             Configure Webhooks
//           </Link>
//         </Button>
//         <Button asChild className="pro-btn-secondary w-full">
//           <Link href="/api-integration" className="flex items-center gap-2 justify-center">
//             <Code className="h-4 w-4" />
//             API Integration Guide
//           </Link>
//         </Button>
//       </CardContent>
//     </Card>
//   );
// }

function TopFormsCard({ forms, loading }: { forms?: any[]; loading?: boolean }) {
  const top = (forms || []).slice().sort((a: any, b: any) => (b.submission_count || 0) - (a.submission_count || 0)).slice(0, 6);

  return (
    <Card className="pro-card">
      <CardHeader className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">Top Forms</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Forms with the most submissions (descending)</CardDescription>
          </div>
          <Button asChild className="pro-btn-secondary text-sm px-3 py-2 h-8">
            <Link href="/forms">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : top && top.length > 0 ? (
          <div className="space-y-4">
            {top.map((form: any) => (
              <div key={form.id} className="flex items-center justify-between p-4 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors">
                <div className="flex items-center space-x-4">
                  <FormAvatar name={form.name} />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{form.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{(form.submission_count || 0).toLocaleString()} submissions</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {form.recent_submissions ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">{form.recent_submissions} recent</Badge>
                  ) : null}
                  <Button asChild className="pro-btn-secondary text-sm px-3 py-2 h-8">
                    <Link href={`/forms/${form.id}`} className="flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      View
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-md p-8 w-20 h-20 flex items-center justify-center mx-auto">
              <Users className="h-10 w-10 text-slate-400 dark:text-slate-500" />
            </div>
            <div>
              <p className="text-slate-900 dark:text-slate-100 text-lg font-semibold mb-2">No forms yet</p>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Create your first form to get started</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardContent({
  user,
  forms,
  loading,
  error,
  notificationCount,
  recentSubmissions,
  recentLoading,
  search,
  setSearch,
  toastViewRef,
  totalForms,
  totalSubmissions,
  webhookSuccessRate,
  trendData,
  trendRange,
  setTrendRange,
  trendChartType,
  setTrendChartType,
  analytics,
  interactiveAnalytics,
  analyticsRange,
  setAnalyticsRange,
  refreshing,
  setRefreshing,
  previousPeriodForms,
  previousPeriodSubmissions,
  geoCountries,
  browserTop,
  deviceCategoryTop,
  osTop,
  ipInsightMeta,
  ipIntelLoading,
  subscriptionInfo,
}) {
  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const displayTotalForms = Array.isArray(forms) ? forms.length : 0;
  const [deviceViewMode, setDeviceViewMode] = useState<'browser' | 'device'>('browser');
  const [trafficModalOpen, setTrafficModalOpen] = useState(false);
  const [trafficModalView, setTrafficModalView] = useState<'countries' | 'devices' | 'os'>('countries');
  const activeDeviceBreakdown = deviceViewMode === 'browser' ? browserTop : deviceCategoryTop;
  const totalCountrySamples = geoCountries.reduce((sum, entry) => sum + (entry.count || 0), 0);
  const totalBrowserSamples = browserTop.reduce((sum, entry) => sum + (entry.count || 0), 0);
  const totalDeviceSamples = deviceCategoryTop.reduce((sum, entry) => sum + (entry.count || 0), 0);
  const totalOsSamples = osTop.reduce((sum, entry) => sum + (entry.count || 0), 0);
  const activeDeviceTotal = deviceViewMode === 'browser' ? totalBrowserSamples : totalDeviceSamples;
  const handleOpenTrafficModal = (view: 'countries' | 'devices' | 'os') => {
    setTrafficModalView(view);
    setTrafficModalOpen(true);
  };
  const trafficModalMeta = {
    countries: {
      title: 'Global audience insights',
      description: 'Complete geo distribution across the latest sampled traffic.',
    },
    devices: {
      title: 'Device and browser mix',
      description: 'Full fidelity on hardware classes and browser engines detected.',
    },
    os: {
      title: 'Operating system spread',
      description: 'Entire user agent OS breakdown from recent submissions.',
    },
  } as const;
  const activeTrafficMeta = trafficModalMeta[trafficModalView];
  const renderTrafficModalContent = () => {
    if (trafficModalView === 'countries') {
      if (!geoCountries.length) {
        return <p className="text-sm text-slate-500">No traffic samples yet.</p>;
      }

      const base = totalCountrySamples > 0 ? totalCountrySamples : geoCountries.length || 1;
      return (
        <div className="space-y-3">
          {geoCountries.map((country, index) => {
            const share = country.percent && country.percent > 0 ? country.percent : percentOf(country.count || 0, base);
            return (
              <div
                key={`${country.name}-${country.code || index}`}
                className="flex items-start gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 p-3"
              >
                <div className="text-2xl leading-none">{countryFlagEmoji(country.code)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <span>
                      {index + 1}. {country.name}
                    </span>
                    <span>{share.toFixed(1)}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${Math.min(share, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{(country.count || 0).toLocaleString()} visitors</p>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (trafficModalView === 'devices') {
      const deviceBases = Math.max(totalDeviceSamples, deviceCategoryTop.length || 1);
      const browserBases = Math.max(totalBrowserSamples, browserTop.length || 1);

      return (
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Device classes</p>
            <div className="mt-3 space-y-2">
              {deviceCategoryTop.length ? (
                deviceCategoryTop.map((device) => {
                  const share = percentOf(device.count || 0, deviceBases);
                  return (
                    <div key={device.name} className="rounded-xl border border-slate-100 dark:border-slate-800 p-3">
                      <div className="flex items-center justify-between text-sm font-medium text-slate-900 dark:text-slate-100">
                        <span>{device.name}</span>
                        <span>{share.toFixed(1)}%</span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(share, 100)}%` }}></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{device.count} sessions</p>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500">No device intelligence yet.</p>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Browser engines</p>
            <div className="mt-3 space-y-2">
              {browserTop.length ? (
                browserTop.map((browser) => {
                  const share = percentOf(browser.count || 0, browserBases);
                  return (
                    <div key={browser.name} className="rounded-xl border border-slate-100 dark:border-slate-800 p-3">
                      <div className="flex items-center justify-between text-sm font-medium text-slate-900 dark:text-slate-100">
                        <span>{browser.name}</span>
                        <span>{share.toFixed(1)}%</span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-purple-500" style={{ width: `${Math.min(share, 100)}%` }}></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{browser.count} sessions</p>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500">No browser telemetry yet.</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (trafficModalView === 'os') {
      if (!osTop.length) {
        return <p className="text-sm text-slate-500">No operating system data to show.</p>;
      }
      const base = Math.max(totalOsSamples, osTop.length || 1);
      return (
        <div className="space-y-2">
          {osTop.map((os) => {
            const share = percentOf(os.count || 0, base);
            return (
              <div key={os.name} className="rounded-xl border border-slate-100 dark:border-slate-800 p-3">
                <div className="flex items-center justify-between text-sm font-medium text-slate-900 dark:text-slate-100">
                  <span>{os.name}</span>
                  <span>{share.toFixed(1)}%</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(share, 100)}%` }}></div>
                </div>
                <p className="text-xs text-slate-500 mt-1">{os.count} sessions</p>
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  };

  const submissionSummary = useMemo(() => {
    const points = Array.isArray(interactiveAnalytics) ? [...interactiveAnalytics] : [];
    const sortedPoints = points.sort((a, b) => {
      const left = new Date(a.date).getTime();
      const right = new Date(b.date).getTime();
      return left - right;
    });
    const topForm = Array.isArray(forms)
      ? [...forms].sort((a, b) => (b?.submission_count || 0) - (a?.submission_count || 0))[0] || null
      : null;

    if (!sortedPoints.length) {
      const fallbackCards = [
        {
          label: 'Total submissions',
          value: (totalSubmissions || 0).toLocaleString(),
          helper: 'All time volume',
        },
        {
          label: 'Success rate',
          value: `${(webhookSuccessRate || 100).toFixed(1)}%`,
          helper: 'Webhook delivery health',
        },
        {
          label: 'Error volume',
          value: '—',
          helper: 'Need traffic data',
        },
        {
          label: 'Top form',
          value: topForm?.name || 'Add a form',
          helper: topForm ? `${(topForm.submission_count || 0).toLocaleString()} lifetime submissions` : 'No traffic yet',
        },
      ];

      return {
        hasData: false,
        cards: fallbackCards,
        insights: [
          {
            label: 'Momentum',
            value: 'Awaiting data',
            meta: 'Traffic analytics unlock after a handful of submissions.',
          },
        ],
        reliability: {
          score: clampNumber(webhookSuccessRate || 100, 0, 100),
          label: 'Need data',
          copy: 'Collect at least one day of submissions to benchmark delivery reliability.',
        },
        descriptor: 'Awaiting activity',
      };
    }

    const overallSubmissions = sortedPoints.reduce((sum, point) => sum + (point.submissions || 0), 0);
    const overallErrors = sortedPoints.reduce((sum, point) => sum + (point.errors || 0), 0);
    const avgPerDay = sortedPoints.length ? overallSubmissions / sortedPoints.length : 0;
    const windowStart = Math.max(sortedPoints.length - 7, 0);
    const windowPrevStart = Math.max(sortedPoints.length - 14, 0);
    const lastSeven = sortedPoints.slice(windowStart);
    const prevSeven = sortedPoints.slice(windowPrevStart, windowStart);
    const lastSevenTotal = lastSeven.reduce((sum, point) => sum + (point.submissions || 0), 0);
    const prevSevenTotal = prevSeven.reduce((sum, point) => sum + (point.submissions || 0), 0);
    const momentumPercent = prevSevenTotal > 0
      ? ((lastSevenTotal - prevSevenTotal) / prevSevenTotal) * 100
      : lastSevenTotal > 0
        ? 100
        : 0;
    const descriptor = momentumPercent > 12 ? 'Surging' : momentumPercent < -12 ? 'Cooling' : 'Steady';
    const latestPoint = sortedPoints[sortedPoints.length - 1];
    const latestLabel = latestPoint
      ? new Date(latestPoint.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      : '—';
    const bestDayPoint = sortedPoints.reduce(
      (best, point) => ((point.submissions || 0) > (best.submissions || 0) ? point : best),
      sortedPoints[0]
    );
    const quietDayPoint = sortedPoints.reduce(
      (quiet, point) => ((point.submissions || Infinity) < (quiet.submissions || Infinity) ? point : quiet),
      sortedPoints[0]
    );
    const bestDayLabel = bestDayPoint
      ? new Date(bestDayPoint.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      : '—';
    const quietDayLabel = quietDayPoint
      ? new Date(quietDayPoint.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      : '—';
    let errorFreeStreak = 0;
    for (let i = sortedPoints.length - 1; i >= 0; i -= 1) {
      const errors = sortedPoints[i].errors || 0;
      if (errors === 0) {
        errorFreeStreak += 1;
      } else {
        break;
      }
    }
    const successRate = overallSubmissions > 0 ? (overallSubmissions - overallErrors) / overallSubmissions : 1;
    const reliabilityScore = clampNumber(Math.round(successRate * 100 + momentumPercent / 4 - (overallErrors > 0 ? 5 : 0)), 0, 100);
    const reliabilityLabel = reliabilityScore >= 85 ? 'Excellent health' : reliabilityScore >= 60 ? 'Stable' : 'Needs attention';
    const reliabilityCopy = reliabilityScore >= 85
      ? 'Payloads are landing consistently. Keep the cadence steady to maintain high trust.'
      : reliabilityScore >= 60
        ? 'Delivery mostly succeeds, but error volume warrants a periodic check-in.'
        : 'Elevated failures detected. Inspect webhook endpoints and auth tokens.';
    const projectedNext = Math.round((lastSeven.length ? lastSevenTotal / lastSeven.length : avgPerDay) * 7);

    const cards = [
      {
        label: 'Last 7 days',
        value: lastSevenTotal.toLocaleString(),
        helper: `${momentumPercent >= 0 ? '+' : ''}${momentumPercent.toFixed(1)}% vs prior period`,
      },
      {
        label: 'Average per day',
        value: avgPerDay.toFixed(1),
        helper: `${sortedPoints.length} day window`,
      },
      {
        label: 'Error volume',
        value: overallErrors.toLocaleString(),
        helper: `${overallSubmissions ? ((overallErrors / overallSubmissions) * 100).toFixed(1) : '0.0'}% of traffic`,
      },
      {
        label: 'Error-free streak',
        value: errorFreeStreak ? `${errorFreeStreak} ${errorFreeStreak === 1 ? 'day' : 'days'}` : 'Interrupted',
        helper: errorFreeStreak ? 'Since last error' : 'Recent errors detected',
      },
    ];

    const insights = [
      {
        label: 'Latest day',
        value: latestPoint ? `${(latestPoint.submissions || 0).toLocaleString()} submissions` : '—',
        meta: latestLabel,
      },
      {
        label: 'Peak day',
        value: bestDayLabel,
        meta: `${(bestDayPoint?.submissions || 0).toLocaleString()} submissions`,
      },
      {
        label: 'Projected next 7 days',
        value: projectedNext.toLocaleString(),
        meta: 'Based on trailing average',
      },
      {
        label: 'Top form',
        value: topForm?.name || 'No forms yet',
        meta: topForm ? `${(topForm.submission_count || 0).toLocaleString()} lifetime submissions` : 'Create a form to start collecting data',
      },
    ];

    return {
      hasData: true,
      cards,
      insights,
      reliability: {
        score: reliabilityScore,
        label: reliabilityLabel,
        copy: reliabilityCopy,
      },
      descriptor,
    };
  }, [interactiveAnalytics, totalSubmissions, webhookSuccessRate, forms]);

  const reliabilityTone = submissionSummary.reliability.score >= 85
    ? 'text-emerald-600'
    : submissionSummary.reliability.score >= 60
      ? 'text-amber-600'
      : 'text-rose-600';

  return (
    <div className="bg-slate-50 dark:bg-slate-900">
      <DashboardNav />
      
      <div className="w-full">
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8">

        {/* Dashboard Summary Widget - Overview Stats Only */}
        <DashboardSummaryWidget
          totalForms={displayTotalForms}
          totalSubmissions={totalSubmissions}
          recentSubmissions={recentSubmissions}
          webhookSuccessRate={webhookSuccessRate}
          activeWebhooks={Math.floor(webhookSuccessRate * totalSubmissions / 100)}
          failedWebhooks={Math.floor((100 - webhookSuccessRate) * totalSubmissions / 100)}
          loading={loading}
          onRefresh={handleRefresh}
          previousPeriodForms={previousPeriodForms}
          previousPeriodSubmissions={previousPeriodSubmissions}
        />
  
        {/* Top Forms and Submission Trend - REORGANIZED */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <MemoTopFormsCard forms={forms} loading={loading} />
          
          {/* Submission Trend Chart - Moved here from below */}
          <MemoModernTrendChart
            data={trendData}
            trendRange={trendRange}
            chartType={trendChartType}
            onChartTypeChange={setTrendChartType}
            onTrendRangeChange={setTrendRange}
          />
        </div>

        {/* Recent Activities - Detailed View */}
        <RecentActivities 
          activities={recentSubmissions.map((sub: any) => {
            const submissionDate = new Date(sub.date || sub.created_at || sub.timestamp);
            
            // Ensure status is one of the valid values
            let validStatus: 'success' | 'failed' | 'pending' = 'success';
            if (sub.status === 'failed' || sub.status === 'pending' || sub.status === 'success') {
              validStatus = sub.status;
            } else if (sub.webhook_delivered === false || sub.error) {
              validStatus = 'failed';
            }

            const userAgent = sub.user_agent || getSubmissionUserAgent(sub.raw);
            const deviceType = sub.device_type || getSubmissionDeviceType(sub.raw, userAgent);
            
            return {
              id: sub.id,
              form_name: sub.form_name,
              form_id: sub.form_id,
              email: sub.email || 'N/A',
              date: submissionDate.toISOString(),
              time: submissionDate.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              }),
              status: validStatus,
              submission_data: sub.data || sub.submission_data,
              device_type: deviceType,
              user_agent: userAgent,
            };
          })}
          loading={loading || recentLoading}
        />

        {/* Quick Actions and System Health - NOW BELOW RECENT SUBMISSIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions Panel */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Quick Actions
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <Button asChild variant="outline" className="justify-start h-16 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                  <Link href="/forms/new" className="flex items-center gap-3">
                    <div className="p-2 border rounded-lg">
                      <Plus className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">New Form</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Create a new form endpoint</span>
                    </div>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start h-16 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                  <Link href="/submissions" className="flex items-center gap-3">
                    <div className="p-2 border rounded-lg">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">View Submissions</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Browse all form submissions</span>
                    </div>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start h-16 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                  <Link href="/analytics" className="flex items-center gap-3">
                    <div className="p-2 border rounded-lg">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Analytics</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">View detailed form analytics</span>
                    </div>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start h-16 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                  <Link href="/webhooks" className="flex items-center gap-3">
                    <div className="p-2 border rounded-lg">
                      <Webhook className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Webhooks</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Configure form webhooks</span>
                    </div>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Health Panel */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                System Health
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Current status of your integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Subscription / Quota (from user plan) */}
              <div>
                {subscriptionInfo ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Plan</span>
                        <div className="text-sm text-gray-500">{subscriptionInfo.plan_name || subscriptionInfo.plan || 'Free'}</div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>{subscriptionInfo.next_billing_date ? `Next: ${new Date(subscriptionInfo.next_billing_date).toLocaleDateString()}` : ''}</div>
                      </div>
                    </div>

                    {/* Quota bars if present */}
                    {typeof subscriptionInfo.submissions_used !== 'undefined' && typeof subscriptionInfo.submissions_limit !== 'undefined' && (
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Submissions</span>
                          <span className="text-sm font-medium text-gray-900">{subscriptionInfo.submissions_used}/{subscriptionInfo.submissions_limit}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="h-2 bg-blue-600 rounded-full" style={{ width: `${Math.min(100, (subscriptionInfo.submissions_used / Math.max(1, subscriptionInfo.submissions_limit)) * 100)}%` }}></div>
                        </div>
                      </div>
                    )}

                    {typeof subscriptionInfo.api_calls_used !== 'undefined' && typeof subscriptionInfo.api_calls_limit !== 'undefined' && (
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">API Calls</span>
                          <span className="text-sm font-medium text-gray-900">{subscriptionInfo.api_calls_used}/{subscriptionInfo.api_calls_limit}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="h-2 bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (subscriptionInfo.api_calls_used / Math.max(1, subscriptionInfo.api_calls_limit)) * 100)}%` }}></div>
                        </div>
                      </div>
                    )}

                    {typeof subscriptionInfo.storage_used !== 'undefined' && typeof subscriptionInfo.storage_limit !== 'undefined' && (
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Storage</span>
                          <span className="text-sm font-medium text-gray-900">{subscriptionInfo.storage_used} / {subscriptionInfo.storage_limit}{subscriptionInfo.storage_unit ? ` ${subscriptionInfo.storage_unit}` : ''}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (subscriptionInfo.storage_used / Math.max(1, subscriptionInfo.storage_limit)) * 100)}%` }}></div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Subscription</span>
                      <div className="text-sm text-gray-500">No plan details available</div>
                    </div>
                    <div>
                      <Button asChild variant="outline">
                        <Link href="/subscriptions">View plans</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Webhook Health */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Webhook Delivery</span>
                  <Badge variant={webhookSuccessRate >= 95 ? 'default' : 'destructive'}>
                    {webhookSuccessRate >= 95 ? 'Healthy' : 'Issues Detected'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${webhookSuccessRate >= 95 ? 'bg-green-500' : webhookSuccessRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium">{webhookSuccessRate.toFixed(1)}% Success Rate</span>
                  </div>
                </div>
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

              {/* API Status - Based on successful data fetch */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">API Status</span>
                  <Badge variant={!loading && totalForms >= 0 ? 'default' : 'destructive'}>
                    {!loading && totalForms >= 0 ? 'Operational' : 'Checking...'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className={`w-2 h-2 rounded-full ${!loading && totalForms >= 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  {!loading && totalForms >= 0 ? 'All systems operational' : 'Connecting to API...'}
                </div>
              </div>

              {/* Forms & Submissions Stats */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Overview</span>
                  <Badge variant="default">{totalForms} Forms</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Submissions</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{totalSubmissions.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Recent Activity (24h)</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{notificationCount}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="h-2 bg-blue-500 rounded-full transition-all duration-500" 
                      style={{ width: `${totalSubmissions > 0 ? Math.min(100, (totalSubmissions / (totalForms * 10)) * 100) : 0}%` }}
                      title={`Average ${totalForms > 0 ? (totalSubmissions / totalForms).toFixed(1) : 0} submissions per form`}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Avg: {totalForms > 0 ? (totalSubmissions / totalForms).toFixed(1) : 0} submissions per form
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {false && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              icon={FileText}
              label="Total Forms"
              value={displayTotalForms}
              loading={loading}
              tooltip="Number of forms you have created"
            />
            <MetricCard
              icon={BarChart3}
              label="Total Submissions"
              value={totalSubmissions.toLocaleString()}
              loading={loading}
              tooltip="All submissions received across your forms"
            />
            <MetricCard
              icon={Target}
              label="Success Rate"
              value={`${webhookSuccessRate}%`}
              loading={loading}
              tooltip="Percentage of successful webhook deliveries"
            />
            <MetricCard
              icon={Bell}
              label="Notifications"
              value={notificationCount}
              loading={loading}
              tooltip="Unread notifications and alerts"
            />
          </div>
        )}

        {/* Professional Analytics Charts */}
        <div className="space-y-6">
          {/* Traffic intel first, full width */}
          <Card className="pro-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">Traffic Breakdown</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">Countries, devices, and operating systems</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {ipInsightMeta.sampleSize > 0
                    ? `${ipInsightMeta.sampleSize} unique IPs sampled`
                    : geoCountries.length > 0
                      ? 'Geo data via backend analytics'
                      : 'Awaiting traffic signals'}
                </span>
                {ipInsightMeta.lastUpdated && (
                  <span>Updated {new Date(ipInsightMeta.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                )}
                {ipIntelLoading && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <RefreshCcw className="h-3 w-3 animate-spin" />
                    Refreshing
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Countries</p>
                      <p className="text-sm text-slate-900 dark:text-slate-200">Last 25 visitors</p>
                    </div>
                    <span className="text-xs text-slate-500">Visitors</span>
                  </div>
                  <div className="space-y-3 flex-1 overflow-auto pr-1">
                    {geoCountries && geoCountries.length > 0 ? (
                      geoCountries.slice(0, 5).map((country) => {
                        const base = totalCountrySamples > 0 ? totalCountrySamples : geoCountries.length || 1;
                        const share = country.percent && country.percent > 0 ? country.percent : percentOf(country.count, base);
                        return (
                          <div key={country.name} className="flex items-start gap-3">
                            <div className="text-xl">{countryFlagEmoji(country.code)}</div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-sm font-medium text-slate-900 dark:text-slate-100">
                                <span>{country.name}</span>
                                <span>{share.toFixed(0)}%</span>
                              </div>
                              <div className="mt-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(share, 100)}%` }}></div>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">{country.count} visitors</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-slate-500">No country data available.</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-slate-600"
                      onClick={() => handleOpenTrafficModal('countries')}
                    >
                      View all
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-slate-500">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Devices</p>
                      <p className="text-sm text-slate-900 dark:text-slate-200">Top platforms & browsers</p>
                    </div>
                    <span className="text-xs text-slate-500">Visitors</span>
                  </div>
                  <div className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-1 text-xs font-medium mb-4">
                    <button
                      className={`px-3 py-1 rounded-full transition ${deviceViewMode === 'device' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow' : 'text-slate-500'}`}
                      onClick={() => setDeviceViewMode('device')}
                    >
                      Devices
                    </button>
                    <button
                      className={`px-3 py-1 rounded-full transition ${deviceViewMode === 'browser' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow' : 'text-slate-500'}`}
                      onClick={() => setDeviceViewMode('browser')}
                    >
                      Browsers
                    </button>
                  </div>
                  <div className="space-y-3 flex-1 overflow-auto pr-1">
                    {activeDeviceBreakdown && activeDeviceBreakdown.length > 0 ? (
                      activeDeviceBreakdown.slice(0, 5).map((entry) => {
                        const share = percentOf(entry.count, Math.max(activeDeviceTotal, activeDeviceBreakdown.length));
                        return (
                          <div key={entry.name}>
                            <div className="flex items-center justify-between text-sm font-medium text-slate-900 dark:text-slate-100">
                              <span>{entry.name}</span>
                              <span>{share.toFixed(0)}%</span>
                            </div>
                            <div className="mt-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(share, 100)}%` }}></div>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{entry.count} sessions</p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-slate-500">No {deviceViewMode === 'browser' ? 'browser' : 'device'} data yet.</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-slate-600"
                      onClick={() => handleOpenTrafficModal('devices')}
                    >
                      View all
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-slate-500">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Operating systems</p>
                      <p className="text-sm text-slate-900 dark:text-slate-200">User agent mix</p>
                    </div>
                    <span className="text-xs text-slate-500">Visitors</span>
                  </div>
                  <div className="space-y-3 flex-1 overflow-auto pr-1">
                    {osTop && osTop.length > 0 ? (
                      osTop.slice(0, 5).map((os) => {
                        const share = percentOf(os.count, Math.max(totalOsSamples, osTop.length));
                        return (
                          <div key={os.name}>
                            <div className="flex items-center justify-between text-sm font-medium text-slate-900 dark:text-slate-100">
                              <span>{os.name}</span>
                              <span>{share.toFixed(0)}%</span>
                            </div>
                            <div className="mt-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(share, 100)}%` }}></div>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{os.count} sessions</p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-slate-500">No OS data available.</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-slate-600"
                      onClick={() => handleOpenTrafficModal('os')}
                    >
                      View all
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-slate-500">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Dialog open={trafficModalOpen} onOpenChange={setTrafficModalOpen}>
            <DialogContent className="max-w-4xl w-full border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/90 rounded-3xl shadow-2xl p-0">
              <div className="p-6 space-y-6">
                <DialogHeader className="text-left space-y-2">
                  <DialogTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {activeTrafficMeta.title}
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 dark:text-slate-400">
                    {activeTrafficMeta.description}
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  {(['countries', 'devices', 'os'] as const).map((view) => {
                    const isActive = trafficModalView === view;
                    const label =
                      view === 'countries'
                        ? 'Countries'
                        : view === 'devices'
                          ? 'Devices & browsers'
                          : 'Operating systems';
                    return (
                      <button
                        key={view}
                        type="button"
                        onClick={() => setTrafficModalView(view)}
                        className={`px-3 py-1.5 rounded-full border transition text-xs font-medium ${
                          isActive
                            ? 'bg-slate-900 text-white dark:bg-white/90 dark:text-slate-900 border-slate-900 dark:border-white'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                        aria-pressed={isActive}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-xs text-slate-500">
                  <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/40 p-3">
                    <p className="uppercase tracking-wide text-[11px] text-slate-500">Sample size</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {ipInsightMeta.sampleSize > 0
                        ? ipInsightMeta.sampleSize.toLocaleString()
                        : totalCountrySamples.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/40 p-3">
                    <p className="uppercase tracking-wide text-[11px] text-slate-500">Last refreshed</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {ipInsightMeta.lastUpdated
                        ? new Date(ipInsightMeta.lastUpdated).toLocaleString()
                        : 'Awaiting sync'}
                    </p>
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                  {renderTrafficModalContent()}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Submissions summary now full width beneath traffic */}
          <Card className="pro-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">Submissions Summary</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">Momentum, delivery health, and projected throughput</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs uppercase tracking-wide border-transparent text-slate-500">
                  {submissionSummary.descriptor}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {submissionSummary.cards.map((card) => (
                  <div key={card.label} className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{card.helper}</p>
                  </div>
                ))}
              </div>

              {!submissionSummary.hasData && (
                <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4 text-sm text-slate-600 dark:text-slate-300">
                  We need a few days of submissions to unlock velocity, projections, and reliability scoring. Ship a test form to see live analytics populate here.
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <SubmissionsSummaryChart data={interactiveAnalytics} />
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery health</p>
                    <p className={`mt-2 text-4xl font-bold ${reliabilityTone}`}>
                      {submissionSummary.reliability.score}
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">{submissionSummary.reliability.label}</p>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{submissionSummary.reliability.copy}</p>
                  </div>
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Insight stream</p>
                    <div className="space-y-3">
                      {submissionSummary.insights.map((insight) => (
                        <div key={insight.label} className="border-b border-slate-100 dark:border-slate-800 pb-2 last:pb-0 last:border-none">
                          <p className="text-[11px] uppercase tracking-wider text-slate-500">{insight.label}</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{insight.value}</p>
                          <p className="text-xs text-slate-500">{insight.meta}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Simple Footer */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-700 mb-8">
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} FormHook. All rights reserved.
          </p>
        </div>
        </div>
      </div>
      <ToastView ref={toastViewRef} />
    </div>
  );
}

function DashboardPageImpl() {
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { forms, isLoading: loading, error } = useForms();
  const { isCollapsed } = useSidebar();
  const { unreadCount: notificationCount } = useNotifications(); // Use notification context
  
  const [refreshing, setRefreshing] = useState(false);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const toastViewRef = useRef<any>(null);
  const [totalForms, setTotalForms] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [webhookSuccessRate, setWebhookSuccessRate] = useState(100);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any | null>(null);
  const [trendData, setTrendData] = useState<{ date: string; count: number }[]>([]);
  const [trendRange, setTrendRange] = useState<TrendRange>('7d');
  const [trendChartType, setTrendChartType] = useState<'bar' | 'line' | 'area'>('area');
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [interactiveAnalytics, setInteractiveAnalytics] = useState<Array<{ date: string; submissions: number; errors: number; }>>([]);
  const [analyticsRange, setAnalyticsRange] = useState('7d');
  const [recentLoading, setRecentLoading] = useState(false);
  const [geoCountries, setGeoCountries] = useState<BreakdownEntry[]>([]);
  const [browserTop, setBrowserTop] = useState<Array<{ name: string; count: number }>>([]);
  const [deviceCategoryTop, setDeviceCategoryTop] = useState<Array<{ name: string; count: number }>>([]);
  const [osTop, setOsTop] = useState<Array<{ name: string; count: number }>>([]);
  const [ipInsightMeta, setIpInsightMeta] = useState<{ sampleSize: number; lastUpdated: string }>({ sampleSize: 0, lastUpdated: '' });
  const [ipIntelLoading, setIpIntelLoading] = useState(false);
  // Add states for previous period data to calculate trends
  const [previousPeriodForms, setPreviousPeriodForms] = useState(0);
  const [previousPeriodSubmissions, setPreviousPeriodSubmissions] = useState(0);

  // Optimization refs
  const isMountedRef = useRef(true);
  const fetchTimeoutRef = useRef<number | null>(null);
  const lastFetchKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // Set hydrated immediately to reduce flashing
    setHydrated(true);
    isMountedRef.current = true;
    
    // Suppress known noisy browser extension errors in console
    const originalError = console.error;
    console.error = (...args) => {
      const message = args[0]?.toString() || '';
      if (message.includes('content_script.bundle.js') || 
          message.includes('chrome-extension://') ||
          message.includes('monica') ||
          message.includes('permission error')) {
        return; // Don't log these
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError; // Cleanup
      isMountedRef.current = false;
      if (fetchTimeoutRef.current) {
        window.clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (hydrated && !user) {
      safeReplace(router, '/login');
    }
  }, [hydrated, user, router]);

  useEffect(() => {
    // Debounced fetch to avoid rapid repeated API calls when dependencies change
    if (!user) return;

    // If client-side cooldown is active (e.g. backend returned 429/CORS issues), skip fetches
    if (isRequestCooldownActive()) {
      debug.warn('[Dashboard] Skipping dashboard fetch due to client-side cooldown/backoff');
      // ensure we aren't stuck in loading state
      if (isMountedRef.current) setRecentLoading(false);
      return;
    }

    const formIds = Array.isArray(forms) ? forms.map((f: any) => f.id).filter(Boolean).slice(0, 50) : [];
    const fetchKey = `${trendRange}|${analyticsRange}|${formIds.length}|${formIds.join(',')}`;

    // Skip fetch if identical key as last successful fetch
    if (lastFetchKeyRef.current === fetchKey) return;

    if (fetchTimeoutRef.current) {
      window.clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = window.setTimeout(async () => {
      // Double-check mounted
      if (!isMountedRef.current) return;

      if (isRequestCooldownActive()) {
        debug.warn('[Dashboard] Skipping dashboard fetch (cooldown entered before scheduled fetch)');
        if (isMountedRef.current) setRecentLoading(false);
        return;
      }

      try {
        setRecentLoading(true);

        debug.log('[Dashboard] Fetching dashboard data (debounced)...');
        const trendDaysToFetch = trendRangeDayMap[trendRange] || 7;
        const summaryRes = await getDashboardSummary(trendDaysToFetch);

        // If component unmounted, stop
        if (!isMountedRef.current) return;

        // Update last fetch key to avoid repeat
        lastFetchKeyRef.current = fetchKey;

        setTotalForms(summaryRes.total_forms || (Array.isArray(forms) ? forms.length : 0));
        setTotalSubmissions(summaryRes.total_submissions || 0);
        // Capture subscription/billing info if backend includes it in the dashboard summary
        const summarySubscription =
          normalizeSubscriptionInfo(summaryRes.subscription) ||
          normalizeSubscriptionInfo(summaryRes.billing) ||
          normalizeSubscriptionInfo(summaryRes.account?.subscription);

        setSubscriptionInfo(summarySubscription);

        // Prefer fetching the canonical subscription endpoint when available.
        // In local development, avoid hitting the backend subscription endpoints
        // if the API host differs from the page origin to prevent CORS failures.
        try {
          let shouldCallSubscriptionEndpoints = true;
          if (typeof window !== 'undefined') {
            try {
              const apiOrigin = new URL(API_BASE_URL).origin;
              const pageOrigin = window.location.origin;
              if (apiOrigin !== pageOrigin && process.env.NODE_ENV !== 'production') {
                shouldCallSubscriptionEndpoints = false;
              }
            } catch (err) {
              if (process.env.NODE_ENV !== 'production') shouldCallSubscriptionEndpoints = false;
            }
          }

          if (shouldCallSubscriptionEndpoints) {
            const currentSub = await getCurrentSubscription();
            if (currentSub) {
              setSubscriptionInfo(normalizeSubscriptionInfo(currentSub));
            } else {
              // fallback: try usage endpoint for richer usage_info
              const usage = await getSubscriptionUsage({ days: 30 });
              if (usage) setSubscriptionInfo(normalizeSubscriptionInfo(usage));
            }
          } else {
            console.warn('[Dashboard] Skipping subscription endpoints due to cross-origin API in development; using summary fallback.');
          }
        } catch (e) {
          console.warn('[Dashboard] subscription fetch failed, using summary fallback', e);
        }

        // Use recent_submissions safely
        if (summaryRes.recent_submissions && Array.isArray(summaryRes.recent_submissions) && summaryRes.recent_submissions.length > 0) {
          const normalized = summaryRes.recent_submissions
            .map((r: any) => {
              const formName = r.form_name ?? r.form?.name ?? r.form_title ?? r.formName ?? null;
              const dateValue = r.date ?? r.created_at ?? r.timestamp ?? r.createdAt ?? r.submitted_at ?? null;
              const uaValue = getSubmissionUserAgent(r);
              const deviceKind = getSubmissionDeviceType(r, uaValue);
              return {
                id: r.id ?? r._id ?? r.uuid ?? `sub-${Date.now()}-${Math.random()}`,
                form_name: formName,
                form_id: r.form_id ?? r.form?._id ?? r.form?.id ?? null,
                email: r.email ?? r.contact_email ?? r.submitted_by ?? r.data?.email ?? r.submission_data?.email ?? 'N/A',
                date: dateValue,
                status: r.status ?? (r.webhook_delivered === false ? 'failed' : 'success'),
                data: r.data ?? r.submission_data ?? {},
                device_type: deviceKind,
                user_agent: uaValue,
                raw: r,
                _hasValidFormName: !!formName,
                _hasValidDate: !!dateValue && !isNaN(new Date(dateValue).getTime())
              };
            })
            .filter((item: any) => item._hasValidFormName && item._hasValidDate);

          setRecentSubmissions(normalized);
        } else {
          setRecentSubmissions([]);
        }

        if (summaryRes.webhook_stats && summaryRes.webhook_stats.total > 0) {
          const successRate = (summaryRes.webhook_stats.delivered / summaryRes.webhook_stats.total) * 100;
          setWebhookSuccessRate(Math.round(successRate));
        } else {
          setWebhookSuccessRate(100);
        }

        if (summaryRes.trend && Array.isArray(summaryRes.trend)) {
          const rawTrend = summaryRes.trend.map((item: any) => ({
            date: item.date,
            count: item.submissions ?? item.count ?? 0,
          }));
          setTrendData(clampSeriesToTrendRange(rawTrend, trendRange));

          const trendAnalytics = summaryRes.trend.map((item: any) => ({
            date: item.date,
            value1: (item.submissions ?? item.count) || 0,
            value2: (item.failed_webhooks ?? item.failed ?? item.errors ?? 0) || 0,
            label1: 'Submissions',
            label2: 'Errors',
            color1: '#3B82F6',
            color2: '#ef4444',
          }));
          setAnalytics(clampSeriesToTrendRange(trendAnalytics, trendRange));

          const interactiveSeries = summaryRes.trend.map((item: any) => ({
            date: item.date,
            submissions: (item.submissions ?? item.count) || 0,
            errors: (item.failed_webhooks ?? item.failed ?? item.errors ?? 0) || 0,
          }));
          setInteractiveAnalytics(clampSeriesToTrendRange(interactiveSeries, trendRange));
        } else {
          setTrendData([]);
          setAnalytics([]);
          setInteractiveAnalytics([]);
        }

        // Fetch geo / device / os breakdown for first form (best-effort)
        (async () => {
          try {
            const firstFormId = Array.isArray(forms) && forms.length > 0 ? forms[0].id : null;
            if (!firstFormId) {
              setGeoCountries([]);
              setBrowserTop([]);
              setDeviceCategoryTop([]);
              setOsTop([]);
              setIpInsightMeta({ sampleSize: 0, lastUpdated: '' });
              setIpIntelLoading(false);
              return;
            }

            try {
              const geo = await getFormGeoAnalytics(firstFormId);
              const countriesSrc = geo?.country_stats || geo?.countries || [];
              const countries = Array.isArray(countriesSrc)
                ? countriesSrc.map((c: any) => ({ name: c.name || c.country || c.key, count: c.count || c.value || 0, percent: 0 }))
                : [];
              setGeoCountries(countries.slice(0, 20));
            } catch (e) {
              setGeoCountries([]);
            }

            try {
              const subs = await getSubmissions(firstFormId, { limit: 200 });
              const submissionList: SubmissionRecord[] = Array.isArray(subs)
                ? subs
                : (subs && subs.submissions ? subs.submissions : []);
              const browserCounts: Record<string, number> = {};
              const osCounts: Record<string, number> = {};
              const deviceClassCounts: Record<string, number> = {};

              for (const submission of submissionList) {
                const ua = getSubmissionUserAgent(submission);
                const deviceLabel = getSubmissionDeviceType(submission, ua);
                deviceClassCounts[deviceLabel] = (deviceClassCounts[deviceLabel] || 0) + 1;

                if (ua) {
                  const browserLabel = detectBrowserFromUserAgent(ua);
                  const osLabel = detectOsFromUserAgent(ua);
                  browserCounts[browserLabel] = (browserCounts[browserLabel] || 0) + 1;
                  osCounts[osLabel] = (osCounts[osLabel] || 0) + 1;
                }
              }

              const browserArr = Object.keys(browserCounts)
                .map((k) => ({ name: k, count: browserCounts[k] }))
                .sort((a, b) => b.count - a.count);
              const osArr = Object.keys(osCounts)
                .map((k) => ({ name: k, count: osCounts[k] }))
                .sort((a, b) => b.count - a.count);
              const deviceArr = Object.keys(deviceClassCounts)
                .map((k) => ({ name: k, count: deviceClassCounts[k] }))
                .sort((a, b) => b.count - a.count);

              setBrowserTop(browserArr.slice(0, 10));
              setDeviceCategoryTop(deviceArr.slice(0, 6));
              setOsTop(osArr.slice(0, 10));

              try {
                setIpIntelLoading(true);
                const ipBreakdown = await buildIpBreakdownFromSubmissions(submissionList);
                if (ipBreakdown.countries.length) {
                  setGeoCountries(ipBreakdown.countries);
                }
                setIpInsightMeta({ sampleSize: ipBreakdown.sampleSize, lastUpdated: new Date().toISOString() });
              } catch (ipError) {
              } finally {
                setIpIntelLoading(false);
              }
            } catch (e) {
              setBrowserTop([]);
              setDeviceCategoryTop([]);
              setOsTop([]);
              setIpInsightMeta({ sampleSize: 0, lastUpdated: '' });
              setIpIntelLoading(false);
            }
          } catch (e) {
            // ignore
          }
        })();

        // Fallback: avoid fetching per-form submission lists for many forms — limit to first 5
        if ((!summaryRes.total_forms || summaryRes.total_forms === 0) && Array.isArray(forms) && forms.length > 0) {
          const sampleForms = forms.slice(0, 5);
          let totalSubmissionsCount = 0;
          for (const form of sampleForms) {
            try {
              const submissionsRes = await getSubmissions(form.id);
              if (!isMountedRef.current) break;
              if (submissionsRes && submissionsRes.submissions) {
                totalSubmissionsCount += submissionsRes.submissions.length;
              } else if (Array.isArray(submissionsRes)) {
                totalSubmissionsCount += submissionsRes.length;
              }
            } catch (submissionErr) {
              debug.warn(`[Dashboard] Could not fetch submissions for form ${form.id}:`, submissionErr);
            }
          }
          setTotalSubmissions(totalSubmissionsCount);
        }

      } catch (err) {
        debug.error('[Dashboard] Error fetching dashboard data:', err);
        showApiError(err, { fallbackTitle: 'Dashboard Load Failed' });
      } finally {
        if (isMountedRef.current) setRecentLoading(false);
      }

    }, 300);

    // cleanup for this effect invocation
    return () => {
      if (fetchTimeoutRef.current) {
        window.clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendRange, analyticsRange, user, /* useForms provides stable identity but we compare ids inside */ forms]);

  useEffect(() => {
    if (error) {
      toastViewRef.current?.addNotification(
        'error',
        'Forms Error',
        typeof error === 'string' ? error : 'Failed to load forms.',
        true,
        4000
      );
    }
  }, [error]);

  return (
    <AuthLayout>
      <div className={`${isCollapsed ? 'md:ml-16' : 'md:ml-64'} transition-all duration-300 ease-in-out`}>
        {(!hydrated || !user) ? (
          <div className="flex items-center justify-center h-full min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
              <span className="text-slate-600 text-lg font-medium">
                {!hydrated ? 'Loading dashboard...' : 'Redirecting to login...'}
              </span>
            </div>
          </div>
        ) : (
          <MemoizedDashboardContent
            user={user}
            forms={forms}
            loading={loading}
            error={error}
            notificationCount={notificationCount}
            recentSubmissions={recentSubmissions}
            recentLoading={recentLoading}
            search={search}
            setSearch={setSearch}
            toastViewRef={toastViewRef}
            totalForms={totalForms}
            totalSubmissions={totalSubmissions}
            webhookSuccessRate={webhookSuccessRate}
            trendData={trendData}
            trendRange={trendRange}
            setTrendRange={setTrendRange}
            trendChartType={trendChartType}
            setTrendChartType={setTrendChartType}
            analytics={analytics}
            interactiveAnalytics={interactiveAnalytics}
            analyticsRange={analyticsRange}
            setAnalyticsRange={setAnalyticsRange}
            refreshing={refreshing}
            setRefreshing={setRefreshing}
            previousPeriodForms={previousPeriodForms}
            previousPeriodSubmissions={previousPeriodSubmissions}
            geoCountries={geoCountries}
            browserTop={browserTop}
            deviceCategoryTop={deviceCategoryTop}
            osTop={osTop}
            ipInsightMeta={ipInsightMeta}
            ipIntelLoading={ipIntelLoading}
            subscriptionInfo={subscriptionInfo}
          />
        )}
      </div>
    </AuthLayout>
  );
}

  const MemoizedDashboardContent = React.memo(DashboardContent);

// Export the implementation directly since we're in pages directory
export default DashboardPageImpl;
