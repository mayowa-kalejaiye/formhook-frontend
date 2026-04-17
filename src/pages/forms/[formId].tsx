import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import DashboardNav from '../../components/DashboardNav';
import BottomGradientRadial from '../../components/BottomGradientRadial';
import AuthLayout from '../../components/AuthLayout';
import { FormOverviewTab } from '../../components/form-tabs/FormOverviewTab';
import { FormWebhooksTab } from '../../components/form-tabs/FormWebhooksTab';
import { FormWebhookLogsTab } from '../../components/form-tabs/FormWebhookLogsTab';
import { FormSubmissionsTab } from '../../components/form-tabs/FormSubmissionsTab';
import { toast, showApiError } from '../../hooks/use-toast';
import { Toaster } from '../../components/ui/toaster';
import { 
  getForm, 
  generateFormToken, 
  revokeFormToken,
  getFormAnalytics,
  getSubmissions,
  getWebhookDeliveries,
  updateFormWebhook
} from '../../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';

// --- Next.js SSG fallback for dynamic route build error ---
export async function getStaticPaths() {
  return { paths: [], fallback: 'blocking' };
}

export async function getStaticProps() {
  return { props: {} };
}
import { Badge } from '../../components/ui/badge';
import { 
  ArrowLeft, 
  Eye, 
  BarChart3, 
  Webhook, 
  Activity, 
  Database,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import SEO from '../../components/SEO';

const DynamicResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const DynamicAreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const DynamicArea = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const DynamicCartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const DynamicXAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const DynamicYAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const DynamicTooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });

type NormalizedAnalyticsPoint = {
  iso: string;
  dateLabel: string;
  submissions: number;
  errors: number;
};

const formatDateLabel = (iso: string) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const groupSubmissionsByDay = (entries: any[] = []) => {
  const counts = new Map<string, number>();
  entries.forEach((entry) => {
    const raw = entry?.submitted_at || entry?.created_at || entry?.date || entry?.timestamp;
    const date = raw ? new Date(raw) : new Date();
    if (Number.isNaN(date.getTime())) return;
    const key = date.toISOString().split('T')[0];
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
};

const normalizeAnalyticsSeries = (
  analyticsData: any,
  fallbackSubmissions: any[] = []
): NormalizedAnalyticsPoint[] => {
  const candidateSeries =
    analyticsData?.time_series ||
    analyticsData?.daily_data ||
    analyticsData?.dailyData ||
    analyticsData?.data ||
    analyticsData?.daily_stats ||
    [];

  let normalized: NormalizedAnalyticsPoint[] = Array.isArray(candidateSeries)
    ? candidateSeries
        .map((entry) => {
          const rawDate = entry?.date || entry?.day || entry?.timestamp || entry?.label;
          if (!rawDate) return null;
          const parsed = new Date(rawDate);
          if (Number.isNaN(parsed.getTime())) return null;
          const iso = parsed.toISOString();
          return {
            iso,
            dateLabel: formatDateLabel(iso),
            submissions: Number(entry?.count ?? entry?.submissions ?? entry?.value ?? entry?.total ?? 0),
            errors: Number(entry?.errors ?? entry?.failed ?? entry?.failures ?? 0),
          };
        })
        .filter(Boolean) as NormalizedAnalyticsPoint[]
    : [];

  if (!normalized.length && fallbackSubmissions?.length) {
    const grouped = groupSubmissionsByDay(fallbackSubmissions);
    normalized = grouped.map(({ date, count }) => {
      const iso = new Date(date).toISOString();
      return {
        iso,
        dateLabel: formatDateLabel(iso),
        submissions: count,
        errors: 0,
      };
    });
  }

  return normalized.sort((a, b) => new Date(a.iso).getTime() - new Date(b.iso).getTime());
};

const deriveStatusBreakdown = (analyticsData: any, fallbackSubmissions: any[] = []) => {
  const raw = analyticsData?.status_breakdown || analyticsData?.statusBreakdown;
  const breakdown = {
    success: 0,
    failed: 0,
    pending: 0,
    spam: 0,
  };

  if (raw && typeof raw === 'object') {
    breakdown.success = raw.success ?? raw.delivered ?? raw.completed ?? 0;
    breakdown.failed = raw.failed ?? raw.errors ?? raw.error ?? raw.bounced ?? 0;
    breakdown.pending = raw.pending ?? raw.in_progress ?? raw.queued ?? 0;
    breakdown.spam = raw.spam ?? raw.filtered ?? 0;
    return breakdown;
  }

  fallbackSubmissions?.forEach((submission) => {
    const status = (submission?.status || submission?.delivery_status || 'success').toString().toLowerCase();
    if (status.includes('fail') || status.includes('error')) breakdown.failed += 1;
    else if (status.includes('pending')) breakdown.pending += 1;
    else if (status.includes('spam')) breakdown.spam += 1;
    else breakdown.success += 1;
  });

  return breakdown;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function FormSettingsPage() {
  const router = useRouter();
  const { formId } = router.query;
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requireToken, setRequireToken] = useState(false);
  const [token, setToken] = useState<string|null>(null);
  const [showToken, setShowToken] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(false);
  
  // Analytics data
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  // Submissions data
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [submissionsPerPage] = useState(10);
  
  // Webhook data
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [webhookLogsLoading, setWebhookLogsLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEnabled, setWebhookEnabled] = useState(false);

  useEffect(() => {
    if (!formId) return;
    (async () => {
      setLoading(true);
      try {
        console.log('[FormDetail] Loading form:', formId);
        const data = await getForm(formId as string);
        console.log('[FormDetail] Form data:', data);
        setForm(data);
        setRequireToken(!!data.require_token);
        setToken(data.token || null);
        setWebhookUrl(data.webhook_url || '');
        setWebhookEnabled(!!data.webhook_enabled);
      } catch (e) {
        console.error('[FormDetail] Error loading form:', e);
        // Use centralized API error handling to show user-friendly toasts
        showApiError(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [formId]);

  // Load analytics when tab is active
  const loadAnalytics = async () => {
    if (!formId || analyticsLoading) return;
    setAnalyticsLoading(true);
    try {
      console.log('[FormDetail] Loading analytics for form:', formId);
      const data = await getFormAnalytics(formId as string, { interval: 'day' });
      console.log('[FormDetail] Analytics data received:', data);
      
      // Check if backend returned fallback data (indicated by _fallback flag)
      if (data && (data as any)._fallback) {
        console.log('[FormDetail] Backend analytics unavailable, computing from submissions');
        setAnalytics(createFallbackAnalytics());
      } else if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        // Valid backend analytics
        setAnalytics(data);
      } else {
        // Empty or invalid response - create fallback analytics
        console.log('[FormDetail] Invalid analytics response, using fallback');
        setAnalytics(createFallbackAnalytics());
      }
    } catch (e) {
      // Should never throw now, but just in case
      console.log('[FormDetail] Unexpected error loading analytics, using fallback:', e);
      setAnalytics(createFallbackAnalytics());
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Create fallback analytics from submission data
  const createFallbackAnalytics = () => {
    if (!submissions || submissions.length === 0) {
      return {
        total_submissions: 0,
        success_rate: 1.0,
        avg_response_time: null,
        daily_data: [],
        fallback: true,
        message: 'No submission data available'
      };
    }

    // Calculate basic stats from submissions
    const successfulSubmissions = submissions.filter(s => 
      !s.status || s.status === 'success' || s.status === 'delivered' || s.status === 'received'
    ).length;
    
    const successRate = submissions.length > 0 ? successfulSubmissions / submissions.length : 1.0;

    // Group submissions by date for daily data
    const dailyStats: { [key: string]: { date: string; count: number } } = submissions.reduce((acc, submission) => {
      let date;
      if (submission.created_at) {
        date = new Date(submission.created_at).toISOString().split('T')[0];
      } else if (submission.submitted_at) {
        date = new Date(submission.submitted_at).toISOString().split('T')[0];
      } else if (submission.date) {
        date = new Date(submission.date).toISOString().split('T')[0];
      } else {
        date = new Date().toISOString().split('T')[0]; // fallback to today
      }
      
      if (!acc[date]) {
        acc[date] = { date, count: 0 };
      }
      acc[date].count++;
      return acc;
    }, {});

    const daily_data = Object.values(dailyStats).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      total_submissions: submissions.length,
      success_rate: successRate,
      avg_response_time: null, // Can't calculate from submission data
      daily_data: daily_data,
      fallback: true,
      message: 'Generated from submission data'
    };
  };

  const analyticsSeries = useMemo(() => normalizeAnalyticsSeries(analytics, submissions), [analytics, submissions]);

  const statusBreakdown = useMemo(() => deriveStatusBreakdown(analytics, submissions), [analytics, submissions]);

  const statusBreakdownTotal = useMemo(
    () => Object.values(statusBreakdown).reduce((sum, value) => sum + (value || 0), 0),
    [statusBreakdown]
  );

  const totalAnalyticsSubmissions = useMemo(() => {
    const fromAnalytics =
      analytics?.total_submissions ??
      analytics?.totalSubmissions ??
      analytics?.submission_count ??
      null;
    if (typeof fromAnalytics === 'number' && fromAnalytics > 0) return fromAnalytics;
    if (statusBreakdownTotal > 0) return statusBreakdownTotal;
    const fromSeries = analyticsSeries.reduce((sum, point) => sum + (point.submissions || 0), 0);
    if (fromSeries > 0) return fromSeries;
    return submissions.length;
  }, [analytics, statusBreakdownTotal, analyticsSeries, submissions.length]);

  const computedSuccessRate = useMemo(() => {
    if (statusBreakdownTotal > 0) {
      return clamp((statusBreakdown.success || 0) / statusBreakdownTotal, 0, 1);
    }
    const candidateRate = analytics?.success_rate ?? analytics?.successRate;
    if (typeof candidateRate === 'number' && !Number.isNaN(candidateRate)) {
      return clamp(candidateRate, 0, 1);
    }
    if (totalAnalyticsSubmissions > 0) {
      return clamp(
        (totalAnalyticsSubmissions - (statusBreakdown.failed || 0)) / totalAnalyticsSubmissions,
        0,
        1
      );
    }
    return 1;
  }, [statusBreakdown, statusBreakdownTotal, analytics, totalAnalyticsSubmissions]);

  const failureCount = useMemo(() => {
    const failed = statusBreakdown.failed || 0;
    if (failed > 0) return failed;
    const estimatedFailures = Math.round((1 - computedSuccessRate) * totalAnalyticsSubmissions);
    return Math.max(estimatedFailures, 0);
  }, [statusBreakdown, computedSuccessRate, totalAnalyticsSubmissions]);

  const avgDailySubmissions = useMemo(() => {
    if (!analyticsSeries.length) return totalAnalyticsSubmissions;
    return totalAnalyticsSubmissions / analyticsSeries.length || 0;
  }, [analyticsSeries, totalAnalyticsSubmissions]);

  const chartData = useMemo(
    () =>
      analyticsSeries.map((point) => ({
        date: point.dateLabel,
        submissions: point.submissions,
        errors: point.errors,
      })),
    [analyticsSeries]
  );

  const analyticsInsights = useMemo(() => {
    if (!analyticsSeries.length) {
      return {
        lastSevenTotal: 0,
        prevSevenTotal: 0,
        momentumPercent: 0,
        descriptor: 'Awaiting data',
        tone: 'text-slate-500',
        bestDayLabel: '—',
        bestDayValue: 0,
        quietDayLabel: '—',
        quietDayValue: 0,
        predictedNextSeven: Math.round(avgDailySubmissions * 7) || 0,
        latestLabel: '—',
        latestVolume: 0,
      };
    }

    const lastSeven = analyticsSeries.slice(-7);
    const prevSeven = analyticsSeries.slice(
      Math.max(analyticsSeries.length - 14, 0),
      Math.max(analyticsSeries.length - 7, 0)
    );
    const lastSevenTotal = lastSeven.reduce((sum, point) => sum + point.submissions, 0);
    const prevSevenTotal = prevSeven.reduce((sum, point) => sum + point.submissions, 0);
    const momentumPercent = prevSevenTotal > 0
      ? ((lastSevenTotal - prevSevenTotal) / prevSevenTotal) * 100
      : lastSevenTotal > 0
        ? 100
        : 0;
    const descriptor = momentumPercent > 8 ? 'Trending up' : momentumPercent < -8 ? 'Cooling off' : 'Holding steady';
    const tone = momentumPercent >= 0 ? 'text-emerald-600' : 'text-rose-600';
    const bestDayPoint = analyticsSeries.reduce(
      (best, point) => (point.submissions > best.submissions ? point : best),
      analyticsSeries[0]
    );
    const quietDayPoint = analyticsSeries.reduce(
      (worst, point) => (point.submissions < worst.submissions ? point : worst),
      analyticsSeries[0]
    );
    const bestDayLabel = bestDayPoint
      ? new Date(bestDayPoint.iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      : '—';
    const quietDayLabel = quietDayPoint
      ? new Date(quietDayPoint.iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      : '—';
    const latestPoint = analyticsSeries[analyticsSeries.length - 1];
    const latestLabel = latestPoint
      ? new Date(latestPoint.iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '—';
    const latestVolume = latestPoint?.submissions ?? 0;

    return {
      lastSevenTotal,
      prevSevenTotal,
      momentumPercent,
      descriptor,
      tone,
      bestDayLabel,
      bestDayValue: bestDayPoint?.submissions ?? 0,
      quietDayLabel,
      quietDayValue: quietDayPoint?.submissions ?? 0,
      predictedNextSeven: Math.round(avgDailySubmissions * 7) || 0,
      latestLabel,
      latestVolume,
    };
  }, [analyticsSeries, avgDailySubmissions]);

  const reliabilityScore = useMemo(() => {
    const failureRatio = totalAnalyticsSubmissions > 0 ? failureCount / totalAnalyticsSubmissions : 0;
    const baseScore = (computedSuccessRate || 0) * 100 - failureRatio * 25 + analyticsInsights.momentumPercent / 5;
    return clamp(Math.round(baseScore), 0, 100);
  }, [computedSuccessRate, failureCount, totalAnalyticsSubmissions, analyticsInsights.momentumPercent]);

  const reliabilityLabel = reliabilityScore >= 85 ? 'Excellent health' : reliabilityScore >= 60 ? 'Stable but monitor' : 'Needs attention';
  const reliabilityCopy = reliabilityScore >= 85
    ? 'Payloads are landing reliably with minimal retries.'
    : reliabilityScore >= 60
      ? 'Most submissions succeed, but keep an eye on recent errors.'
      : 'Elevated failures detected. Recheck webhook endpoints and auth tokens.';

  const statusColors: Record<string, string> = {
    success: 'bg-emerald-500',
    delivered: 'bg-emerald-500',
    pending: 'bg-amber-500',
    queued: 'bg-blue-500',
    deferred: 'bg-indigo-500',
    failed: 'bg-rose-500',
    bounced: 'bg-rose-500',
    rejected: 'bg-red-500',
    spam: 'bg-slate-500',
  };

  const statusLabels: Record<string, string> = {
    success: 'Delivered',
    delivered: 'Delivered',
    failed: 'Failed',
    bounced: 'Bounced',
    rejected: 'Rejected',
    pending: 'Pending',
    queued: 'Queued',
    deferred: 'Deferred',
    spam: 'Filtered',
  };

  const statusBreakdownEntries = useMemo(
    () =>
      Object.entries(statusBreakdown)
        .filter(([, value]) => (value || 0) > 0)
        .sort((a, b) => (b[1] || 0) - (a[1] || 0)),
    [statusBreakdown]
  );

  const fallbackNotice = Boolean(analytics?.fallback);

  const insightRows = [
    {
      label: 'Peak activity',
      value: analyticsInsights.bestDayLabel,
      meta: analyticsInsights.bestDayValue ? `${analyticsInsights.bestDayValue} submissions` : 'Awaiting data',
    },
    {
      label: 'Quietest day',
      value: analyticsInsights.quietDayLabel,
      meta: analyticsInsights.quietDayValue ? `${analyticsInsights.quietDayValue} submissions` : 'Awaiting data',
    },
    {
      label: 'Next 7-day forecast',
      value: analyticsInsights.predictedNextSeven ? `${analyticsInsights.predictedNextSeven.toLocaleString()} submissions` : '—',
      meta: 'Projection based on current average',
    },
    {
      label: 'Latest daily volume',
      value: analyticsInsights.latestLabel,
      meta: analyticsInsights.latestVolume ? `${analyticsInsights.latestVolume} submissions` : 'Awaiting data',
    },
  ];

  const statHighlights = [
    {
      label: 'Total submissions',
      value: totalAnalyticsSubmissions.toLocaleString(),
      helper: analyticsSeries.length ? `Across ${analyticsSeries.length} days` : 'All time total',
    },
    {
      label: 'Success rate',
      value: `${(computedSuccessRate * 100).toFixed(1)}%`,
      helper: `${(statusBreakdown.success || 0).toLocaleString()} delivered`,
    },
    {
      label: 'Failures',
      value: failureCount.toLocaleString(),
      helper: 'Errors and retries',
    },
    {
      label: 'Average / day',
      value: avgDailySubmissions ? avgDailySubmissions.toFixed(1) : '0',
      helper: chartData.length ? `Mean across ${chartData.length} days` : 'Awaiting data',
    },
  ];

  // Load submissions with pagination
  const loadSubmissions = async (page = 0) => {
    if (!formId || submissionsLoading) return;
    setSubmissionsLoading(true);
    try {
      console.log('[FormDetail] Loading submissions for form:', formId, 'page:', page);
      const data = await getSubmissions(formId as string, {
        limit: submissionsPerPage,
        offset: page * submissionsPerPage
      });
      console.log('[FormDetail] Submissions data:', data);
      
      // Handle different response formats
      if (Array.isArray(data)) {
        // Backend returns submissions array directly
        setSubmissions(data);
        setTotalSubmissions(data.length); // We can't know total from this format, so use current length
        setCurrentPage(page);
        toast({ title: 'Success', description: `Loaded ${data.length} submissions`, variant: 'default' });
      } else if (data && data.submissions && Array.isArray(data.submissions)) {
        // Backend returns object with submissions property
        setSubmissions(data.submissions || []);
        setTotalSubmissions(data.total || 0);
        setCurrentPage(page);
        toast({ title: 'Success', description: `Loaded ${data.submissions.length} submissions`, variant: 'default' });
      } else if (data && Array.isArray(data.results)) {
        // Handle paginated results format
        setSubmissions(data.results || []);
        setTotalSubmissions(data.count || data.total || 0);
        setCurrentPage(page);
        toast({ title: 'Success', description: `Loaded ${data.results.length} submissions`, variant: 'default' });
      } else {
        setSubmissions([]);
        setTotalSubmissions(0);
        toast({ title: 'No Data', description: 'No submissions found for this form yet.', variant: 'default' });
      }
    } catch (e) {
      console.error('[FormDetail] Error loading submissions:', e);
      showApiError(e);
      setSubmissions([]);
      setTotalSubmissions(0);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  // Load webhook logs
  const loadWebhookLogs = async () => {
    if (!formId || webhookLogsLoading) return;
    setWebhookLogsLoading(true);
    try {
      console.log('[FormDetail] Loading webhook logs for form:', formId);
      const data = await getWebhookDeliveries(formId as string);
      console.log('[FormDetail] Webhook logs:', data);
      setWebhookLogs(data || []);
    } catch (e) {
      console.error('[FormDetail] Error loading webhook logs:', e);
      showApiError(e);
    } finally {
      setWebhookLogsLoading(false);
    }
  };

  const handleUpdateWebhook = async () => {
    if (!formId) return;
    try {
      console.log('[FormDetail] Updating webhook:', { url: webhookUrl, enabled: webhookEnabled });
      await updateFormWebhook(formId as string, { 
        webhook_url: webhookEnabled ? webhookUrl : null 
      });
      toast({ title: 'Success', description: 'Webhook configuration updated.' });
      // Reload form to get updated data
      const data = await getForm(formId as string);
      setForm(data);
      setWebhookUrl(data.webhook_url || '');
      setWebhookEnabled(!!data.webhook_enabled);
    } catch (e) {
      console.error('[FormDetail] Error updating webhook:', e);
      showApiError(e);
    }
  };

  const handleToggleRequireToken = async (checked: boolean) => {
    setRequireToken(checked);
    toast({ title: 'Updated', description: 'Token authentication setting updated.' });
  };

  const handleGenerateToken = async () => {
    if (!formId) return;
    setTokenLoading(true);
    try {
      const res = await generateFormToken(formId as string);
      setToken(res.token || res.api_token);
      setShowToken(true);
      setRequireToken(true);
      toast({ title: "Token generated", description: "Copy this token now. You won't see it again." });
      
      // Reload form to get updated require_token flag
      const updatedForm = await getForm(formId as string);
      setForm(updatedForm);
    } catch (error: any) {
      console.error('[FormDetail] Error generating token:', error);
      showApiError(error);
    } finally {
      setTokenLoading(false);
    }
  };

  const handleRevokeToken = async () => {
    if (!formId) return;
    if (!window.confirm('This will break any form submissions using the current token. Continue?')) return;
    setTokenLoading(true);
    try {
      const result = await revokeFormToken(formId as string);
      if (!result || result.ok === false) {
        // Let centralized handler adaptively show the right toast message
        // Pass the structured result so showApiError can inspect status/server message
        showApiError(result as any, { fallbackTitle: 'Revoke Token Failed' });
        setTokenLoading(false);
        return;
      }

      // Success
      setToken(null);
      setShowToken(false);
      setRequireToken(false);
      toast({ title: 'Token revoked', description: 'API token revoked.' });

      // Reload form to get updated require_token flag
      const updatedForm = await getForm(formId as string);
      setForm(updatedForm);
    } catch (error: any) {
      console.error('[FormDetail] Error revoking token:', error);
      // Use centralized API error handling for unexpected errors
      showApiError(error);
    } finally {
      setTokenLoading(false);
    }
  };

  // --- Embed Snippet ---
  const embedSnippet = () => {
    if (!form || !form.fields) {
      return `<form action="https://formhook-backend.onrender.com/forms/${form?.id || 'FORM_ID'}/submit" method="POST">
  <!-- No fields defined yet -->
  <button type="submit">Submit</button>
</form>`;
    }

    let snippet = `<form action="https://formhook-backend.onrender.com/forms/${form.id}/submit" method="POST">\n`;
    
    // Add authentication note if required
    if (requireToken && token) {
      snippet += `  <!-- IMPORTANT: Add Authorization header to your request -->\n`;
      snippet += `  <!-- Authorization: Bearer ${token} -->\n\n`;
    }
    
    // Generate HTML for each field based on the form's actual fields
    const fieldsHtml = form.fields.map(field => {
      const commonAttrs = `name="data[${field.name}]"${field.required ? ' required' : ''}`;
      const placeholder = field.label ? ` placeholder="${field.label}"` : '';
      
      switch (field.type) {
        case 'text':
          return `  <input ${commonAttrs} type="text"${placeholder} />`;
        
        case 'email':
          return `  <input ${commonAttrs} type="email"${placeholder} />`;
        
        case 'number':
          let numberAttrs = '';
          if (field.validation?.min !== undefined) numberAttrs += ` min="${field.validation.min}"`;
          if (field.validation?.max !== undefined) numberAttrs += ` max="${field.validation.max}"`;
          return `  <input ${commonAttrs} type="number"${placeholder}${numberAttrs} />`;
        
        case 'textarea':
          let textareaAttrs = '';
          if (field.validation?.minLength) textareaAttrs += ` minlength="${field.validation.minLength}"`;
          if (field.validation?.maxLength) textareaAttrs += ` maxlength="${field.validation.maxLength}"`;
          return `  <textarea ${commonAttrs}${placeholder}${textareaAttrs}></textarea>`;
        
        case 'select':
          const options = (field.options || []).filter(Boolean);
          if (options.length === 0) {
            return `  <select ${commonAttrs}>\n    <option value="">Select ${field.label}</option>\n  </select>`;
          }
          const optionsHtml = options.map(opt => `    <option value="${opt}">${opt}</option>`).join('\n');
          return `  <select ${commonAttrs}>\n    <option value="">Select ${field.label}</option>\n${optionsHtml}\n  </select>`;
        
        case 'checkbox':
          return `  <label>\n    <input ${commonAttrs} type="checkbox" value="true" />\n    ${field.label}\n  </label>`;
        
        case 'radio':
          const radioOptions = (field.options || []).filter(Boolean);
          if (radioOptions.length === 0) {
            return `  <!-- Radio field "${field.name}" has no options defined -->`;
          }
          return radioOptions.map(opt => 
            `  <label>\n    <input name="data[${field.name}]" type="radio" value="${opt}"${field.required ? ' required' : ''} />\n    ${opt}\n  </label>`
          ).join('\n');
        
        case 'file':
          let fileAttrs = '';
          if (field.validation?.accept) fileAttrs += ` accept="${field.validation.accept}"`;
          if (field.validation?.multiple) fileAttrs += ' multiple';
          return `  <input ${commonAttrs} type="file"${fileAttrs} />`;
        
        case 'tel':
          return `  <input ${commonAttrs} type="tel"${placeholder} />`;
        
        case 'url':
          return `  <input ${commonAttrs} type="url"${placeholder} />`;
        
        case 'date':
          return `  <input ${commonAttrs} type="date" />`;
        
        case 'time':
          return `  <input ${commonAttrs} type="time" />`;
        
        case 'datetime-local':
          return `  <input ${commonAttrs} type="datetime-local" />`;
        
        default:
          return `  <!-- Unsupported field type: ${field.type} for field: ${field.name} -->`;
      }
    }).filter(Boolean);
    
    if (fieldsHtml.length > 0) {
      snippet += fieldsHtml.join('\n') + '\n\n';
    } else {
      snippet += '  <!-- No valid fields defined -->\n\n';
    }
    
    // Add submit button
    snippet += '  <button type="submit">Submit</button>\n';
    snippet += '</form>';
    
    return snippet;
  };

  // Auto-load submissions when form is loaded
  useEffect(() => {
    if (form && formId && !submissionsLoading) {
      console.log('[FormDetail] Auto-loading submissions after form loaded...');
      loadSubmissions(0);
    }
  }, [form]);

  if (loading) {
    return (
      <AuthLayout>
        <BottomGradientRadial>
          <div className="min-h-screen flex flex-col md:ml-56 transition-all duration-300 ease-in-out">
            <DashboardNav />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-4">
              <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <span className="text-gray-600 text-lg font-medium">Loading form...</span>
                </div>
              </div>
            </main>
          </div>
        </BottomGradientRadial>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <SEO
        title={form?.name ? `${form.name} · Settings` : 'Form Settings'}
        description={form?.description || 'Configure and manage your form settings.'}
        url={`${(process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')}/forms/${form?.id || ''}`}
        image={`${(process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')}/og-image-2.svg`}
      />
      <BottomGradientRadial>
        <div className="min-h-screen flex flex-col md:ml-56 transition-all duration-300 ease-in-out">
          <DashboardNav />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-4">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
              <Link href="/forms" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </Link>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <Settings className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-purple-800 dark:text-purple-200 tracking-tight">
                  {form?.name || 'Form Settings'}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Configure and manage your form settings
                </p>
              </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 flex flex-wrap gap-2 w-full">
                <TabsTrigger value="overview" className="flex items-center gap-2 flex-shrink-0">
                  <Eye className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2 flex-shrink-0" onClick={loadAnalytics}>
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="webhooks" className="flex items-center gap-2 flex-shrink-0">
                  <Webhook className="h-4 w-4" />
                  Webhooks
                </TabsTrigger>
                <TabsTrigger value="logs" className="flex items-center gap-2 flex-shrink-0" onClick={loadWebhookLogs}>
                  <Activity className="h-4 w-4" />
                  Webhook Logs
                </TabsTrigger>
                <TabsTrigger value="submissions" className="flex items-center gap-2 flex-shrink-0" onClick={() => loadSubmissions(0)}>
                  <Database className="h-4 w-4" />
                  Submissions
                </TabsTrigger>
              </TabsList>
          <TabsContent value="overview">
            <FormOverviewTab
              form={form}
              requireToken={requireToken}
              token={token}
              showToken={showToken}
              tokenLoading={tokenLoading}
              setShowToken={setShowToken}
              handleToggleRequireToken={handleToggleRequireToken}
              handleGenerateToken={handleGenerateToken}
              handleRevokeToken={handleRevokeToken}
              embedSnippet={embedSnippet}
            />
          </TabsContent>
          <TabsContent value="analytics">
            <Card className="mb-8 shadow-lg border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Form Analytics
                </CardTitle>
                <CardDescription>Submission and delivery analytics for this form.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {analyticsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading analytics...</span>
                  </div>
                ) : !analytics && !chartData.length ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No analytics data available yet</p>
                    <Button onClick={loadAnalytics} disabled={analyticsLoading}>
                      {analyticsLoading ? 'Loading...' : 'Load analytics'}
                    </Button>
                  </div>
                ) : (
                  <>
                    {fallbackNotice && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        Backend analytics endpoints are waking up. Showing live numbers computed from recent submissions until the API responds.
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                      {statHighlights.map((stat) => (
                        <div key={stat.label} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/60 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
                          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                          <p className="text-xs text-slate-500 mt-1">{stat.helper}</p>
                        </div>
                      ))}
                    </div>

                    {chartData.length > 0 && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Submission cadence</p>
                              <p className="text-xs text-slate-500">Last {chartData.length} days</p>
                            </div>
                            <span className="text-xs text-slate-500">Latest: {analyticsInsights.latestLabel}</span>
                          </div>
                          <div className="h-72">
                            <DynamicResponsiveContainer width="100%" height="100%">
                              <DynamicAreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                <DynamicCartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <DynamicXAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <DynamicYAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} axisLine={false} tickLine={false} />
                                <DynamicTooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} labelStyle={{ fontWeight: 600 }} />
                                <DynamicArea type="monotone" dataKey="submissions" stroke="#2563eb" fill="#bfdbfe" fillOpacity={0.35} strokeWidth={2} />
                                <DynamicArea type="monotone" dataKey="errors" stroke="#f87171" fill="#fecaca" fillOpacity={0.25} strokeWidth={1.5} />
                              </DynamicAreaChart>
                            </DynamicResponsiveContainer>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Momentum</p>
                            <p className={`mt-2 text-3xl font-semibold ${analyticsInsights.tone}`}>
                              {analyticsInsights.momentumPercent >= 0 ? '+' : ''}
                              {analyticsInsights.momentumPercent.toFixed(1)}%
                            </p>
                            <p className="text-xs text-slate-500">vs previous 7 days · {analyticsInsights.descriptor}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">
                              Latest day: <span className="font-semibold">{analyticsInsights.latestLabel}</span> · {analyticsInsights.latestVolume.toLocaleString()} submissions
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Reliability score</p>
                            <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{reliabilityScore}</p>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{reliabilityLabel}</p>
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed">{reliabilityCopy}</p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Forecast</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                              {analyticsInsights.predictedNextSeven.toLocaleString()} submissions
                            </p>
                            <p className="text-xs text-slate-500">Projected next 7 days</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 space-y-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Status breakdown</p>
                          <p className="text-xs text-slate-500">Based on recent submissions</p>
                        </div>
                        {statusBreakdownEntries.length ? (
                          <div className="space-y-3">
                            {statusBreakdownEntries.map(([key, value]) => {
                              const percent = statusBreakdownTotal > 0 ? (value / statusBreakdownTotal) * 100 : 0;
                              return (
                                <div key={key}>
                                  <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                                    <span>{statusLabels[key] || key}</span>
                                    <span>
                                      {value.toLocaleString()} · {percent.toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                                    <div
                                      className={`h-full rounded-full ${statusColors[key] || 'bg-slate-500'}`}
                                      style={{ width: `${percent}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">Status metadata not available yet.</p>
                        )}
                      </div>
                      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 space-y-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Insight highlights</p>
                          <p className="text-xs text-slate-500">Automatically generated heuristics</p>
                        </div>
                        <div className="space-y-4">
                          {insightRows.map((row) => (
                            <div key={row.label} className="border-b border-slate-100 dark:border-slate-800 pb-3 last:border-none last:pb-0">
                              <p className="text-[11px] uppercase tracking-wide text-slate-500">{row.label}</p>
                              <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{row.value}</p>
                              <p className="text-xs text-slate-500">{row.meta}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Button onClick={loadAnalytics} disabled={analyticsLoading}>
                        {analyticsLoading ? 'Refreshing...' : 'Refresh analytics'}
                      </Button>
                      <p className="text-xs text-slate-500">Source: /forms/{form?.id || '...'}/analytics</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="webhooks">
            <FormWebhooksTab
              form={form}
              webhookUrl={webhookUrl}
              setWebhookUrl={setWebhookUrl}
              webhookEnabled={webhookEnabled}
              setWebhookEnabled={setWebhookEnabled}
              handleUpdateWebhook={handleUpdateWebhook}
            />
          </TabsContent>
          <TabsContent value="logs">
            <FormWebhookLogsTab
              form={form}
              webhookLogs={webhookLogs}
              webhookLogsLoading={webhookLogsLoading}
              webhookEnabled={webhookEnabled}
              loadWebhookLogs={loadWebhookLogs}
            />
          </TabsContent>
          <TabsContent value="submissions">
            <FormSubmissionsTab
              form={form}
              submissions={submissions}
              submissionsLoading={submissionsLoading}
              totalSubmissions={totalSubmissions}
              currentPage={currentPage}
              submissionsPerPage={submissionsPerPage}
              loadSubmissions={loadSubmissions}
            />
          </TabsContent>
            </Tabs>

            <Toaster />
          </main>
        </div>
      </BottomGradientRadial>
    </AuthLayout>
  );
}

