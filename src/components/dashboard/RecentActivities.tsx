"use client";
import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Search,
  Filter,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Activity as ActivityIcon,
  MoreHorizontal,
} from 'lucide-react';

interface Activity {
  id: string;
  form_name: string;
  form_id: string;
  email?: string;
  date: string;
  time: string;
  status: 'success' | 'failed' | 'pending';
  device_type?: string;
  user_agent?: string;
  submission_data?: any;
}

interface RecentActivitiesProps {
  activities: Activity[];
  loading?: boolean;
}

const DEVICE_LABELS: Record<string, string> = {
  desktop: 'Desktop',
  laptop: 'Desktop',
  mobile: 'Mobile',
  phone: 'Mobile',
  smartphone: 'Mobile',
  tablet: 'Tablet',
  bot: 'Bot',
  automation: 'Bot',
  unknown: 'Unknown',
};

const DEVICE_ACCENTS: Record<string, string> = {
  Desktop: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Mobile: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  Tablet: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Bot: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  Unknown: 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300',
};

const statusConfig = {
  success: {
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    icon: CheckCircle2,
    label: 'Delivered',
  },
  failed: {
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    icon: XCircle,
    label: 'Failed',
  },
  pending: {
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: AlertCircle,
    label: 'Pending',
  },
};

const percent = (value: number, total: number) => {
  if (!total) return 0;
  return Math.round((value / total) * 100);
};

const formatDeviceLabel = (value?: string) => {
  if (!value) return 'Unknown';
  const normalized = value.toLowerCase();
  return DEVICE_LABELS[normalized] || value.charAt(0).toUpperCase() + value.slice(1);
};

const truncate = (value?: string, max = 42) => {
  if (!value) return '—';
  return value.length > max ? `${value.slice(0, max)}…` : value;
};

export default function RecentActivities({ activities, loading = false }: RecentActivitiesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed' | 'pending'>('all');

  const safeActivities = Array.isArray(activities) ? activities : [];

  const summary = useMemo(() => {
    const totals = { success: 0, failed: 0, pending: 0 };
    const deviceMap = new Map<string, number>();
    const formMap = new Map<string, { count: number; failures: number }>();

    safeActivities.forEach((activity) => {
      totals[activity.status] += 1;
      const label = formatDeviceLabel(activity.device_type);
      deviceMap.set(label, (deviceMap.get(label) || 0) + 1);

      const formStats = formMap.get(activity.form_name) || { count: 0, failures: 0 };
      formStats.count += 1;
      if (activity.status === 'failed') {
        formStats.failures += 1;
      }
      formMap.set(activity.form_name, formStats);
    });

    const deviceBreakdown = Array.from(deviceMap.entries())
      .map(([label, count]) => ({ label, count, percent: percent(count, safeActivities.length) }))
      .sort((a, b) => b.count - a.count);

    const formLeaders = Array.from(formMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        failureRate: percent(data.failures, Math.max(1, data.count)),
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totals,
      total: safeActivities.length,
      uniqueForms: formMap.size,
      deviceBreakdown,
      formLeaders,
    };
  }, [safeActivities]);

  const filteredActivities = useMemo(() => {
    return safeActivities.filter((activity) => {
      const matchesSearch =
        (activity.form_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (activity.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (activity.id || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = filterStatus === 'all' || activity.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [safeActivities, searchQuery, filterStatus]);

  const timelineEvents = useMemo(() => {
    return [...filteredActivities]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [filteredActivities]);

  const successRate = percent(summary.totals.success, summary.total);
  const failureRate = percent(summary.totals.failed, summary.total);

  const keySignals = [
    {
      label: 'Total submissions',
      value: summary.total.toLocaleString(),
      meta: `Across ${summary.uniqueForms || 0} active forms`,
    },
    {
      label: 'Success rate',
      value: `${successRate}%`,
      meta: failureRate > 0 ? `${summary.totals.failed} issues to triage` : 'All deliveries healthy',
    },
    {
      label: 'Most active form',
      value: summary.formLeaders[0]?.name || 'Awaiting traffic',
      meta: summary.formLeaders[0]
        ? `${summary.formLeaders[0].count} entries today`
        : 'Ship a form to populate',
    },
    {
      label: 'Top device',
      value: summary.deviceBreakdown[0]?.label || 'Pending intel',
      meta: summary.deviceBreakdown[0]
        ? `${summary.deviceBreakdown[0].percent}% of traffic`
        : 'Surfacing as submissions arrive',
    },
  ];

  const statusPills = [
    { label: 'Delivered', count: summary.totals.success, tone: 'text-emerald-600 border-emerald-200 dark:border-emerald-800' },
    { label: 'Pending', count: summary.totals.pending, tone: 'text-amber-600 border-amber-200 dark:border-amber-800' },
    { label: 'Failed', count: summary.totals.failed, tone: 'text-rose-600 border-rose-200 dark:border-rose-800' },
  ];

  return (
    <Card className="pro-card">
      <CardHeader className="space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Operational Intelligence
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">
              Live submissions, device mix, and workflow health pulled straight from your form activity.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {statusPills.map((pill) => (
              <span key={pill.label} className={`text-xs font-medium border rounded-full px-3 py-1 ${pill.tone}`}>
                {pill.label}: {pill.count}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by form, email, or ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                const states: Array<'all' | 'success' | 'failed' | 'pending'> = ['all', 'success', 'failed', 'pending'];
                const currentIndex = states.indexOf(filterStatus);
                setFilterStatus(states[(currentIndex + 1) % states.length]);
              }}
            >
              <Filter className="h-4 w-4" />
              {filterStatus === 'all' ? 'All statuses' : `Filter: ${filterStatus}`}
            </Button>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Showing {filteredActivities.length} of {summary.total} submissions
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {keySignals.map((signal) => (
            <div
              key={signal.label}
              className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white/60 dark:bg-slate-900/40 shadow-sm"
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">{signal.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{signal.value}</p>
              <p className="text-xs text-slate-500 mt-1">{signal.meta}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white/70 dark:bg-slate-900/40">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Activity Stream</p>
                <p className="text-xs text-slate-500">Most recent submissions across your workspace</p>
              </div>
              <Badge variant="secondary" className="gap-1">
                <ActivityIcon className="h-3 w-3" /> {timelineEvents.length}
              </Badge>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
              </div>
            ) : timelineEvents.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-500">No activity yet. Traffic will populate automatically.</div>
            ) : (
              <ul className="space-y-4">
                {timelineEvents.map((event) => {
                  const StatusIcon = statusConfig[event.status].icon;
                  return (
                    <li key={event.id} className="relative pl-6">
                      <span
                        className={`absolute left-0 top-2 h-2 w-2 rounded-full ${
                          event.status === 'failed'
                            ? 'bg-rose-500'
                            : event.status === 'pending'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                        }`}
                      ></span>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{event.form_name}</p>
                          <p className="text-xs text-slate-500">{event.email || 'N/A'}</p>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(event.date).toLocaleString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <Badge className={`${statusConfig[event.status].color} flex items-center gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[event.status].label}
                        </Badge>
                        <Badge className={`${DEVICE_ACCENTS[formatDeviceLabel(event.device_type)] || DEVICE_ACCENTS.Unknown}`}>
                          {formatDeviceLabel(event.device_type)}
                        </Badge>
                        <span className="text-slate-500 font-mono text-[11px]">
                          {String(event.id).slice(0, 8)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="space-y-5">
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white/60 dark:bg-slate-900/40">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Device mix</p>
                <TrendingUp className="h-4 w-4 text-slate-400" />
              </div>
              {summary.deviceBreakdown.length === 0 ? (
                <p className="text-xs text-slate-500">Device insights unlock automatically once submissions arrive.</p>
              ) : (
                <div className="space-y-3">
                  {summary.deviceBreakdown.slice(0, 4).map((device) => (
                    <div key={device.label}>
                      <div className="flex items-center justify-between text-sm font-medium text-slate-900 dark:text-slate-100">
                        <span>{device.label}</span>
                        <span>{device.percent}%</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${device.percent}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-500">{device.count} submissions</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white/60 dark:bg-slate-900/40">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Form leaderboard</p>
              {summary.formLeaders.length === 0 ? (
                <p className="text-xs text-slate-500">We need a few submissions to rank your forms.</p>
              ) : (
                <div className="space-y-3">
                  {summary.formLeaders.slice(0, 3).map((form) => (
                    <div key={form.name} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{form.name}</p>
                        <p className="text-xs text-slate-500">{form.count} submissions</p>
                      </div>
                      <Badge variant="outline" className="text-[11px]">
                        {100 - form.failureRate}% success
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Detailed activity log</p>
              <p className="text-xs text-slate-500">Export-ready view of every submission</p>
            </div>
            <Button variant="outline" size="sm" className="self-start">
              Download CSV
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-900 dark:text-slate-100 font-semibold mb-1">No activities match this view</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {searchQuery || filterStatus !== 'all'
                  ? 'Adjust your filters to widen the report.'
                  : 'Traffic will appear here once submissions roll in.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="text-left py-3 px-4">Form / ID</th>
                    <th className="text-left py-3 px-4">Timestamp</th>
                    <th className="text-left py-3 px-4">Device</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">User agent</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredActivities.map((activity) => {
                    const StatusIcon = statusConfig[activity.status].icon;
                    const deviceLabel = formatDeviceLabel(activity.device_type);
                    return (
                      <tr key={activity.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-4">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{activity.form_name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {String(activity.id).substring(0, 12)}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Calendar className="h-4 w-4" />
                            {new Date(activity.date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Clock className="h-4 w-4" />
                            {activity.time}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={`${DEVICE_ACCENTS[deviceLabel] || DEVICE_ACCENTS.Unknown}`}>{deviceLabel}</Badge>
                        </td>
                        <td className="py-4 px-4 text-slate-600 dark:text-slate-300">{activity.email || 'N/A'}</td>
                        <td className="py-4 px-4">
                          <Badge className={`${statusConfig[activity.status].color} flex items-center gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig[activity.status].label}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]" title={activity.user_agent}>
                          {truncate(activity.user_agent)}
                        </td>
                        <td className="py-4 px-4">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4 text-slate-500" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
