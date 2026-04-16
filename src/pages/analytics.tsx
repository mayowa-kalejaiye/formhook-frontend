"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Compass,
  Globe2,
  RefreshCw,
  Shield,
  Siren,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import DashboardNav from '../components/DashboardNav';
import BottomGradientRadial from '../components/BottomGradientRadial';
import AuthLayout from '../components/AuthLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useSidebar } from '../context/SidebarContext';
import { getForms, getSubmissions } from '../services/api';
import { showApiError } from '../hooks/use-toast';

type TimeRange = '24h' | '7d' | '30d' | '90d';

type FormOption = {
  id: string;
  name: string;
};

type SubmissionRecord = {
  id: number;
  form_id: string;
  form_name: string;
  ip_address?: string;
  created_at: string;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  threat_score?: number | null;
  device_type?: string | null;
};

type TrendPoint = {
  bucket: string;
  events: number;
  uniqueIps: number;
  avgThreat: number;
};

const CHART_COLORS = ['#0f766e', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6'];

const riskPalette: Record<string, string> = {
  Low: '#10b981',
  Medium: '#f59e0b',
  High: '#ef4444',
  Unknown: '#64748b',
};

const riskDotClass: Record<string, string> = {
  Low: 'bg-emerald-500',
  Medium: 'bg-amber-500',
  High: 'bg-rose-500',
  Unknown: 'bg-slate-500',
};

function formatRangeLabel(range: TimeRange): string {
  if (range === '24h') return 'Last 24 hours';
  if (range === '7d') return 'Last 7 days';
  if (range === '30d') return 'Last 30 days';
  return 'Last 90 days';
}

function getRangeStart(range: TimeRange): Date {
  const now = new Date();
  if (range === '24h') return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (range === '7d') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (range === '30d') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toHourKey(date: Date): string {
  const hour = date.getHours().toString().padStart(2, '0');
  return `${date.toISOString().slice(0, 10)} ${hour}:00`;
}

function normalizeFormsPayload(payload: any): FormOption[] {
  const raw = Array.isArray(payload) ? payload : payload?.data;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((form: any) => ({ id: String(form.id), name: String(form.name || 'Untitled form') }))
    .filter((f) => Boolean(f.id));
}

function shortLabel(value: string, max = 20): string {
  if (!value) return 'Unknown';
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}...`;
}

function safeThreat(value: number | null | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function AnalyticsPageContent() {
  const { isCollapsed } = useSidebar();

  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedForm, setSelectedForm] = useState<'all' | string>('all');
  const [forms, setForms] = useState<FormOption[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const formsPayload = await getForms();
      const normalizedForms = normalizeFormsPayload(formsPayload);
      setForms(normalizedForms);

      const start = getRangeStart(timeRange).toISOString();
      const formTargets =
        selectedForm === 'all'
          ? normalizedForms
          : normalizedForms.filter((form) => form.id === selectedForm);

      if (!formTargets.length) {
        setSubmissions([]);
        return;
      }

      const responses = await Promise.all(
        formTargets.map(async (form) => {
          const rows = await getSubmissions(form.id, { limit: 1000, date_from: start });
          return Array.isArray(rows)
            ? rows.map((row: any) => ({
                id: Number(row.id),
                form_id: String(row.form_id || form.id),
                form_name: form.name,
                ip_address: row.ip_address,
                created_at: row.created_at,
                country: row.country,
                region: row.region,
                city: row.city,
                threat_score: row.threat_score,
                device_type: row.device_type,
              }))
            : [];
        })
      );

      setSubmissions(responses.flat());
    } catch (error) {
      showApiError(error, { fallbackTitle: 'Analytics Error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [selectedForm, timeRange]);

  const filteredSubmissions = useMemo(() => {
    const rangeStart = getRangeStart(timeRange).getTime();
    return submissions
      .filter((row) => new Date(row.created_at).getTime() >= rangeStart)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [submissions, timeRange]);

  const trendSeries = useMemo<TrendPoint[]>(() => {
    const byBucket = new Map<string, { events: number; ips: Set<string>; threatTotal: number }>();

    filteredSubmissions.forEach((row) => {
      const created = new Date(row.created_at);
      const bucket = timeRange === '24h' ? toHourKey(created) : toDateKey(created);
      const current = byBucket.get(bucket) || { events: 0, ips: new Set<string>(), threatTotal: 0 };
      current.events += 1;
      if (row.ip_address) current.ips.add(row.ip_address);
      current.threatTotal += safeThreat(row.threat_score);
      byBucket.set(bucket, current);
    });

    return Array.from(byBucket.entries()).map(([bucket, value]) => ({
      bucket,
      events: value.events,
      uniqueIps: value.ips.size,
      avgThreat: value.events > 0 ? Number((value.threatTotal / value.events).toFixed(1)) : 0,
    }));
  }, [filteredSubmissions, timeRange]);

  const formBreakdown = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>();
    filteredSubmissions.forEach((row) => {
      const key = row.form_id;
      const current = counts.get(key) || { name: row.form_name, count: 0 };
      current.count += 1;
      counts.set(key, current);
    });

    return Array.from(counts.entries())
      .map(([formId, data]) => ({ formId, form: shortLabel(data.name, 24), fullName: data.name, events: data.count }))
      .sort((a, b) => b.events - a.events);
  }, [filteredSubmissions]);

  const countryBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    filteredSubmissions.forEach((row) => {
      const country = row.country && row.country.trim() ? row.country : 'Unknown';
      counts.set(country, (counts.get(country) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([country, events]) => ({ country: shortLabel(country, 16), fullCountry: country, events }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 10);
  }, [filteredSubmissions]);

  const riskBreakdown = useMemo(() => {
    const totals = { Low: 0, Medium: 0, High: 0, Unknown: 0 };

    filteredSubmissions.forEach((row) => {
      if (row.threat_score === null || row.threat_score === undefined) {
        totals.Unknown += 1;
      } else if (row.threat_score >= 70) {
        totals.High += 1;
      } else if (row.threat_score >= 30) {
        totals.Medium += 1;
      } else {
        totals.Low += 1;
      }
    });

    return Object.entries(totals).map(([name, value]) => ({
      name,
      value,
      fill: riskPalette[name],
    }));
  }, [filteredSubmissions]);

  const deviceBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    filteredSubmissions.forEach((row) => {
      const label = row.device_type && row.device_type.trim() ? row.device_type : 'unknown';
      counts.set(label, (counts.get(label) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([device, events]) => ({ device: shortLabel(device, 12), fullDevice: device, events }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 6);
  }, [filteredSubmissions]);

  const riskEvents = useMemo(() => {
    return [...filteredSubmissions]
      .filter((row) => safeThreat(row.threat_score) >= 60)
      .sort((a, b) => safeThreat(b.threat_score) - safeThreat(a.threat_score))
      .slice(0, 8);
  }, [filteredSubmissions]);

  const metrics = useMemo(() => {
    const totalEvents = filteredSubmissions.length;
    const activeForms = new Set(filteredSubmissions.map((row) => row.form_id)).size;
    const uniqueCountries = new Set(
      filteredSubmissions
        .map((row) => (row.country && row.country.trim() ? row.country : null))
        .filter(Boolean)
    ).size;
    const avgThreat =
      totalEvents > 0
        ? Number(
            (
              filteredSubmissions.reduce((sum, row) => sum + safeThreat(row.threat_score), 0) /
              totalEvents
            ).toFixed(1)
          )
        : 0;
    const rangeDays = timeRange === '24h' ? 1 : Number(timeRange.replace('d', ''));
    const avgPerDay = Number((totalEvents / rangeDays).toFixed(1));

    const recentSlice = trendSeries.slice(-7);
    const previousSlice = trendSeries.slice(-14, -7);
    const recentTotal = recentSlice.reduce((sum, row) => sum + row.events, 0);
    const previousTotal = previousSlice.reduce((sum, row) => sum + row.events, 0);
    const momentum = previousTotal > 0 ? Number((((recentTotal - previousTotal) / previousTotal) * 100).toFixed(1)) : 0;

    return {
      totalEvents,
      activeForms,
      uniqueCountries,
      avgThreat,
      avgPerDay,
      momentum,
      recentTotal,
      previousTotal,
    };
  }, [filteredSubmissions, trendSeries, timeRange]);

  const insights = useMemo(() => {
    const topForm = formBreakdown[0];
    const topCountry = countryBreakdown[0];
    const highRiskCount = riskBreakdown.find((r) => r.name === 'High')?.value || 0;
    const geoCoverage =
      metrics.totalEvents > 0
        ? Math.round(
            (filteredSubmissions.filter((row) => row.country && row.country !== 'Unknown').length /
              metrics.totalEvents) *
              100
          )
        : 0;

    const concentration =
      topForm && metrics.totalEvents > 0
        ? Math.round((topForm.events / metrics.totalEvents) * 100)
        : 0;

    return [
      {
        title: 'Traffic momentum',
        value:
          metrics.momentum === 0
            ? 'Flat trend'
            : metrics.momentum > 0
            ? `Up ${metrics.momentum}%`
            : `Down ${Math.abs(metrics.momentum)}%`,
        detail: `Recent 7 buckets: ${metrics.recentTotal} events vs ${metrics.previousTotal} prior.`,
        icon: metrics.momentum >= 0 ? TrendingUp : TrendingDown,
      },
      {
        title: 'Concentration risk',
        value: topForm ? `${concentration}% from ${topForm.form}` : 'No dominant source',
        detail: topForm
          ? `Largest source processed ${topForm.events} events in ${formatRangeLabel(timeRange).toLowerCase()}.`
          : 'Create traffic on at least one endpoint to evaluate concentration.',
        icon: Compass,
      },
      {
        title: 'Geo coverage',
        value: `${geoCoverage}% mapped`,
        detail: topCountry
          ? `Top geography is ${topCountry.fullCountry} with ${topCountry.events} events.`
          : 'No country metadata yet for this range.',
        icon: Globe2,
      },
      {
        title: 'Risk pressure',
        value: `${highRiskCount} high-risk events`,
        detail:
          highRiskCount > 0
            ? 'Review suspicious payloads and automate mitigation for repeated sources.'
            : 'No high-risk events detected in this range.',
        icon: Siren,
      },
    ];
  }, [countryBreakdown, filteredSubmissions, formBreakdown, metrics, riskBreakdown, timeRange]);

  const hasData = filteredSubmissions.length > 0;

  return (
    <BottomGradientRadial>
      <div className={`min-h-screen flex flex-col ${isCollapsed ? 'md:ml-16' : 'md:ml-56'} transition-all duration-300 ease-in-out`}>
        <DashboardNav />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-8">
          <div className="mb-8 rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-gradient-to-br from-cyan-200/60 via-amber-100/70 to-white dark:from-cyan-950/40 dark:via-amber-950/20 dark:to-slate-900 p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  <Activity className="h-3.5 w-3.5" />
                  Traffic Intelligence
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Events, Risk, and Reliability
                </h1>
                <p className="mt-2 text-slate-700 dark:text-slate-300 max-w-2xl">
                  Operator-grade analytics built from live payloads: volume trends, source concentration, geographies, and threat signals.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Select value={selectedForm} onValueChange={setSelectedForm}>
                  <SelectTrigger className="w-[220px] bg-white/80 dark:bg-slate-900/60 border-slate-300 dark:border-slate-700">
                    <SelectValue placeholder="All forms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All forms</SelectItem>
                    {forms.map((form) => (
                      <SelectItem key={form.id} value={form.id}>
                        {form.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
                  <SelectTrigger className="w-[180px] bg-white/80 dark:bg-slate-900/60 border-slate-300 dark:border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={loadData} disabled={loading} className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900">
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Total Events</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{metrics.totalEvents.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">{formatRangeLabel(timeRange)}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Active Sources</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{metrics.activeForms}</p>
                <p className="text-xs text-slate-500 mt-1">Forms with traffic in range</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Average / Day</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{metrics.avgPerDay}</p>
                <p className="text-xs text-slate-500 mt-1">Baseline intake velocity</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Unique Countries</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{metrics.uniqueCountries}</p>
                <p className="text-xs text-slate-500 mt-1">Geo coverage footprint</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Average Threat</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{metrics.avgThreat}</p>
                <p className="text-xs text-slate-500 mt-1">0 to 100 risk index</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {insights.map((insight) => {
              const Icon = insight.icon;
              return (
                <Card key={insight.title} className="border-slate-200 dark:border-slate-800">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">{insight.title}</p>
                        <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{insight.value}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{insight.detail}</p>
                      </div>
                      <div className="rounded-xl p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {!loading && !hasData && (
            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="p-14 text-center">
                <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">No traffic yet for this filter</p>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Send events to your endpoint and this page will immediately surface trends, concentration, and risk signals.
                </p>
              </CardContent>
            </Card>
          )}

          {hasData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle>Traffic Trend</CardTitle>
                    <CardDescription>Volume, unique sources, and average threat over time buckets.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={320} minWidth={0} minHeight={240}>
                      <AreaChart data={trendSeries}>
                        <defs>
                          <linearGradient id="eventsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.45} />
                            <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.25} />
                        <XAxis dataKey="bucket" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="events" stroke="#0ea5e9" fill="url(#eventsGradient)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle>Top Event Sources</CardTitle>
                    <CardDescription>Which forms are carrying your traffic load.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={320} minWidth={0} minHeight={240}>
                      <BarChart data={formBreakdown.slice(0, 8)} layout="vertical" margin={{ left: 20, right: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.18} />
                        <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis dataKey="form" type="category" tick={{ fontSize: 11 }} width={140} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="events" fill="#0f766e" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle>Geography Distribution</CardTitle>
                    <CardDescription>Top countries by received event volume.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={220}>
                      <BarChart data={countryBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.18} />
                        <XAxis dataKey="country" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="events" radius={[8, 8, 0, 0]}>
                          {countryBreakdown.map((row, index) => (
                            <Cell key={row.fullCountry} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle>Risk Profile</CardTitle>
                    <CardDescription>Threat score distribution from ingested events.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                        <PieChart>
                          <Pie data={riskBreakdown} dataKey="value" nameKey="name" innerRadius={52} outerRadius={86} paddingAngle={3}>
                            {riskBreakdown.map((entry) => (
                              <Cell key={entry.name} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {riskBreakdown.map((item) => (
                        <div key={item.name} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${riskDotClass[item.name] || 'bg-slate-500'}`}></span>
                            <span className="text-sm text-slate-700 dark:text-slate-300">{item.name}</span>
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle>Device Breakdown</CardTitle>
                    <CardDescription>Traffic composition by detected device type.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {deviceBreakdown.length ? (
                        deviceBreakdown.map((row) => {
                          const share = metrics.totalEvents ? Math.round((row.events / metrics.totalEvents) * 100) : 0;
                          return (
                            <div key={row.fullDevice}>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-slate-700 dark:text-slate-300">{row.fullDevice}</span>
                                <span className="font-semibold text-slate-900 dark:text-slate-100">{row.events} ({share}%)</span>
                              </div>
                              <progress className="h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-slate-200 dark:[&::-webkit-progress-bar]:bg-slate-800 [&::-webkit-progress-value]:bg-cyan-600 [&::-moz-progress-bar]:bg-cyan-600" value={Math.min(share, 100)} max={100} />
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-slate-500">No device metadata collected in this range.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle>High-Risk Queue</CardTitle>
                    <CardDescription>Recent events that should be reviewed first.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {riskEvents.length ? (
                        riskEvents.map((row) => (
                          <div
                            key={`${row.form_id}-${row.id}`}
                            className="rounded-lg border border-rose-200/70 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/20 p-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{row.form_name}</p>
                              <Badge className="bg-rose-600 hover:bg-rose-600 text-white">Risk {safeThreat(row.threat_score)}</Badge>
                            </div>
                            <div className="mt-1 text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-2">
                              <span>{new Date(row.created_at).toLocaleString()}</span>
                              <span>•</span>
                              <span>{row.ip_address || 'No IP'}</span>
                              <span>•</span>
                              <span>{row.country || 'Unknown country'}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 p-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">No urgent risk events</p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">Current range has no items above risk score 60.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {loading && (
            <div className="mt-8 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Loading analytics...
            </div>
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
