// --- Next.js SSG fallback for dynamic route build error ---
export async function getStaticPaths() {
  return { paths: [], fallback: 'blocking' };
}

export async function getStaticProps() {
  return { props: {} };
}

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardNav from '../../components/DashboardNav';
import BottomGradientRadial from '../../components/BottomGradientRadial';
import AuthLayout from '../../components/AuthLayout';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { toast } from '../../hooks/use-toast';
import { Toaster } from '../../components/ui/toaster';
import { 
  getForm, 
  generateApiToken, 
  revokeApiToken,
  getFormAnalytics,
  getSubmissions,
  getWebhookDeliveries,
  updateFormWebhook
} from '../../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { 
  ArrowLeft, 
  Copy, 
  ExternalLink, 
  Eye, 
  BarChart3, 
  Webhook, 
  Activity, 
  Database,
  Settings,
  Calendar,
  Globe,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

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
        const errorMessage = e instanceof Error ? e.message : 'Failed to load form';
        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          toast({ title: 'Form Not Found', description: 'This form does not exist or you do not have access to it.', variant: 'destructive' });
        } else if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
          toast({ title: 'Authentication Required', description: 'Please log in to access this form.', variant: 'destructive' });
        } else {
          toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
        }
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
      console.log('[FormDetail] Analytics data:', data);
      console.log('[FormDetail] Analytics data type:', typeof data);
      console.log('[FormDetail] Analytics data keys:', data ? Object.keys(data) : 'null');
      
      // Handle different response formats more flexibly
      if (data !== null && data !== undefined) {
        // Accept any data that's not null/undefined
        if (typeof data === 'object' && Object.keys(data).length > 0) {
          setAnalytics(data);
          toast({ title: 'Success', description: 'Analytics loaded successfully', variant: 'default' });
        } else if (Array.isArray(data) && data.length > 0) {
          setAnalytics(data);
          toast({ title: 'Success', description: 'Analytics loaded successfully', variant: 'default' });
        } else {
          // Empty object or array - create fallback analytics
          setAnalytics(createFallbackAnalytics());
          toast({ title: 'Limited Analytics', description: 'Using submission data for analytics', variant: 'default' });
        }
      } else {
        // Null or undefined response - create fallback analytics
        setAnalytics(createFallbackAnalytics());
        toast({ title: 'Limited Analytics', description: 'Using submission data for analytics', variant: 'default' });
      }
    } catch (e) {
      console.error('[FormDetail] Error loading analytics:', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to load analytics';
      
      if (errorMessage.includes('500')) {
        // Server error - provide fallback analytics
        setAnalytics(createFallbackAnalytics());
        toast({ 
          title: 'Analytics Unavailable', 
          description: 'Backend analytics not available. Showing basic stats from submissions.', 
          variant: 'default' 
        });
      } else if (errorMessage.includes('404')) {
        // Not found - provide fallback analytics
        setAnalytics(createFallbackAnalytics());
        toast({ 
          title: 'Analytics Not Implemented', 
          description: 'Analytics endpoint not found. Showing basic stats from submissions.', 
          variant: 'default' 
        });
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        toast({ title: 'Authentication Error', description: 'Please log in again to view analytics.', variant: 'destructive' });
        setAnalytics(null);
      } else {
        // Other errors - provide fallback
        setAnalytics(createFallbackAnalytics());
        toast({ 
          title: 'Analytics Error', 
          description: 'Analytics service error. Showing basic stats from submissions.', 
          variant: 'default' 
        });
      }
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
    const dailyStats = submissions.reduce((acc, submission) => {
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
      const errorMessage = e instanceof Error ? e.message : 'Failed to load submissions';
      
      if (errorMessage.includes('404')) {
        toast({ title: 'Submissions Not Available', description: 'Submissions endpoint not found.', variant: 'destructive' });
      } else {
        toast({ title: 'Submissions Error', description: errorMessage, variant: 'destructive' });
      }
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
      toast({ title: 'Error', description: 'Failed to load webhook logs', variant: 'destructive' });
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
      toast({ title: 'Error', description: 'Failed to update webhook', variant: 'destructive' });
    }
  };

  const handleToggleRequireToken = async (checked: boolean) => {
    setRequireToken(checked);
    toast({ title: 'Updated', description: 'Token authentication setting updated.' });
  };

  const handleGenerateToken = async () => {
    setTokenLoading(true);
    try {
      const res = await generateApiToken();
      setToken(res.token);
      setShowToken(true);
      toast({ title: 'Token generated', description: 'Copy this token now. You won’t see it again.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to generate token', variant: 'destructive' });
    } finally {
      setTokenLoading(false);
    }
  };

  const handleRevokeToken = async () => {
    if (!window.confirm('This will break any form submissions using the current token. Continue?')) return;
    setTokenLoading(true);
    try {
      await revokeApiToken();
      setToken(null);
      setShowToken(false);
      toast({ title: 'Token revoked', description: 'API token revoked.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to revoke token', variant: 'destructive' });
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
      <BottomGradientRadial>
        <div className="min-h-screen flex flex-col md:ml-56 transition-all duration-300 ease-in-out">
          <DashboardNav />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-4">

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
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
              <TabsList className="mb-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2" onClick={loadAnalytics}>
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="webhooks" className="flex items-center gap-2">
                  <Webhook className="h-4 w-4" />
                  Webhooks
                </TabsTrigger>
                <TabsTrigger value="logs" className="flex items-center gap-2" onClick={loadWebhookLogs}>
                  <Activity className="h-4 w-4" />
                  Webhook Logs
                </TabsTrigger>
                <TabsTrigger value="submissions" className="flex items-center gap-2" onClick={() => loadSubmissions(0)}>
                  <Database className="h-4 w-4" />
                  Submissions
                </TabsTrigger>
              </TabsList>
          <TabsContent value="overview">
            <Card className="mb-8 shadow border border-blue-100 bg-white/90 dark:bg-black/80">
              <CardHeader>
                <CardTitle>Form Overview</CardTitle>
                <CardDescription>Details and embed snippet for this form.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div><b>Name:</b> {form?.name}</div>
                <div><b>Created:</b> {form?.created_at ? new Date(form.created_at).toLocaleString() : '-'}</div>
                <div><b>Public Link:</b> <a href={`/f/${form?.id}`} className="underline text-blue-700" target="_blank" rel="noopener noreferrer">/f/{form?.id}</a></div>
                <div className="flex items-center gap-4 mt-4">
                  <label className="font-semibold flex items-center gap-2">
                    <input type="checkbox" checked={requireToken} onChange={e => handleToggleRequireToken(e.target.checked)} />
                    Require Token Authentication
                  </label>
                </div>
                {requireToken && (
                  <div className="mt-4 space-y-2">
                    {!token ? (
                      <Button onClick={handleGenerateToken} disabled={tokenLoading}>{tokenLoading ? 'Generating...' : 'Generate API Token'}</Button>
                    ) : (
                      <div className="flex items-center gap-4">
                        {showToken ? (
                          <div className="bg-yellow-50 border border-yellow-200 rounded px-4 py-2 text-yellow-900 font-mono text-xs">
                            <span>{token}</span>
                            <span className="ml-2 text-xs text-yellow-700">Copy this now. You won’t see it again.</span>
                          </div>
                        ) : (
                          <div className="bg-gray-100 border border-gray-200 rounded px-4 py-2 text-gray-500 font-mono text-xs tracking-widest">••••••••••••••••••••••••••••••••</div>
                        )}
                        <Button onClick={handleRevokeToken} disabled={tokenLoading}>{tokenLoading ? 'Revoking...' : 'Revoke Token'}</Button>
                      </div>
                    )}
                    {requireToken && !token && (
                      <div className="text-sm text-yellow-600 mt-2">You must generate a token before submissions or webhooks will work.</div>
                    )}
                  </div>
                )}
                <div className="mt-6">
                  <b>Embed Snippet:</b>
                  <pre className="bg-white rounded p-2 text-xs overflow-x-auto border border-purple-100 mb-2 mt-2">{embedSnippet()}</pre>
                  <Button onClick={() => navigator.clipboard.writeText(embedSnippet())}>Copy Snippet</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="analytics">
            <Card className="mb-8 shadow border border-blue-100 bg-white/90 dark:bg-black/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Form Analytics
                </CardTitle>
                <CardDescription>Submission and delivery analytics for this form.</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading analytics...</span>
                  </div>
                ) : analytics ? (
                  <div className="space-y-6">
                    {/* Show fallback notice if using submission data */}
                    {analytics.fallback && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">Basic Analytics</span>
                        </div>
                        <p className="text-sm text-blue-700">
                          Backend analytics service unavailable. Showing basic statistics calculated from submission data.
                        </p>
                      </div>
                    )}
                    
                    {/* Debug info - only show if not fallback */}
                    {!analytics.fallback && (
                      <div className="bg-gray-100 p-3 rounded text-xs">
                        <strong>Debug - Available Analytics Data:</strong>
                        <pre className="mt-2 text-xs">{JSON.stringify(analytics, null, 2)}</pre>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <h3 className="font-semibold text-blue-900">Total Submissions</h3>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">
                          {analytics.total_submissions || 
                           analytics.totalSubmissions || 
                           analytics.submission_count || 
                           analytics.count || 
                           totalSubmissions || 
                           '0'}
                        </p>
                        {analytics.fallback && (
                          <p className="text-xs text-blue-500 mt-1">From {submissions.length} submissions</p>
                        )}
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <h3 className="font-semibold text-green-900">Success Rate</h3>
                        </div>
                        <p className="text-2xl font-bold text-green-700">
                          {analytics.success_rate ? `${(analytics.success_rate * 100).toFixed(1)}%` : 
                           analytics.successRate ? `${(analytics.successRate * 100).toFixed(1)}%` : 
                           '100%'}
                        </p>
                        {analytics.fallback && (
                          <p className="text-xs text-green-500 mt-1">Estimated from submissions</p>
                        )}
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="h-4 w-4 text-purple-600" />
                          <h3 className="font-semibold text-purple-900">Avg Response Time</h3>
                        </div>
                        <p className="text-2xl font-bold text-purple-700">
                          {analytics.avg_response_time ? `${analytics.avg_response_time}ms` : 
                           analytics.avgResponseTime ? `${analytics.avgResponseTime}ms` : 
                           analytics.response_time ? `${analytics.response_time}ms` : 
                           'N/A'}
                        </p>
                        {analytics.fallback && (
                          <p className="text-xs text-purple-500 mt-1">Not available in basic mode</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Show any available time-series data */}
                    {(analytics.daily_data && analytics.daily_data.length > 0) || 
                     (analytics.dailyData && analytics.dailyData.length > 0) ||
                     (analytics.data && analytics.data.length > 0) ? (
                      <div>
                        <h3 className="font-semibold mb-3">
                          Daily Submissions (Recent days)
                          {analytics.fallback && <span className="text-sm font-normal text-gray-500 ml-2">(from submission data)</span>}
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-xs text-gray-500 mb-2">Daily submission counts:</div>
                          <div className="space-y-1">
                            {(analytics.daily_data || analytics.dailyData || analytics.data || []).slice(-7).map((day, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{day.date || day.day || `Day ${idx + 1}`}</span>
                                <span className="font-medium">{day.count || day.submissions || 0} submissions</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}
                    
                    <div className="flex gap-2">
                      <Button onClick={loadAnalytics} disabled={analyticsLoading}>
                        {analyticsLoading ? 'Refreshing...' : 'Refresh Analytics'}
                      </Button>
                      {analytics.fallback && (
                        <div className="text-xs text-gray-500 flex items-center">
                          <span>⚠️ Backend analytics unavailable - using submission data</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No analytics data available yet</p>
                    <Button onClick={loadAnalytics} disabled={analyticsLoading}>
                      {analyticsLoading ? 'Loading...' : 'Load Analytics'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="webhooks">
            <Card className="mb-8 shadow border border-blue-100 bg-white/90 dark:bg-black/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5 text-blue-600" />
                  Webhook Configuration
                </CardTitle>
                <CardDescription>Send submissions to your backend or third-party service.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={webhookEnabled}
                      onCheckedChange={setWebhookEnabled}
                    />
                    <Label htmlFor="webhook-enabled" className="font-medium">
                      Enable Webhook
                    </Label>
                  </div>
                  
                  {webhookEnabled && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="webhook-url" className="text-sm font-medium">
                          Webhook URL
                        </Label>
                        <Input
                          id="webhook-url"
                          type="url"
                          placeholder="https://your-api.com/webhook"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          FormHook will POST submission data to this URL
                        </p>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-900 mb-2">Webhook Payload Format</h4>
                        <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`{
  "form_id": "${form?.id || 'form-id'}",
  "submission_id": "sub_xxxx",
  "data": {
    // Your form field data
  },
  "metadata": {
    "ip_address": "192.168.1.1",
    "user_agent": "...",
    "submitted_at": "2024-01-01T12:00:00Z"
  }
}`}
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4">
                    <Button onClick={handleUpdateWebhook}>
                      Save Webhook Configuration
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="logs">
            <Card className="mb-8 shadow border border-blue-100 bg-white/90 dark:bg-black/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Webhook Deliveries
                </CardTitle>
                <CardDescription>Recent webhook delivery attempts for this form.</CardDescription>
              </CardHeader>
              <CardContent>
                {webhookLogsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading webhook logs...</span>
                  </div>
                ) : webhookLogs.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">
                        Showing {webhookLogs.length} recent webhook deliveries
                      </p>
                      <Button onClick={loadWebhookLogs} disabled={webhookLogsLoading}>
                        {webhookLogsLoading ? 'Refreshing...' : 'Refresh'}
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>URL</TableHead>
                            <TableHead>Response Code</TableHead>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Response Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {webhookLogs.map((log, idx) => (
                            <TableRow key={log.id || idx}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {log.status === 'success' ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : log.status === 'failed' ? (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-yellow-500" />
                                  )}
                                  <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                                    {log.status || 'pending'}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {log.webhook_url || form?.webhook_url || '-'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={log.response_code >= 200 && log.response_code < 300 ? 'default' : 'destructive'}>
                                  {log.response_code || '-'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {log.created_at ? new Date(log.created_at).toLocaleString() : 
                                 log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                              </TableCell>
                              <TableCell className="text-sm">
                                {log.response_time ? `${log.response_time}ms` : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No webhook deliveries yet</p>
                    <p className="text-sm text-gray-400 mb-4">
                      {webhookEnabled ? 'Webhook deliveries will appear here after form submissions' : 'Enable webhook to see delivery logs'}
                    </p>
                    <Button onClick={loadWebhookLogs} disabled={webhookLogsLoading}>
                      {webhookLogsLoading ? 'Loading...' : 'Refresh Logs'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="submissions">
            <Card className="shadow-xl border border-blue-100 bg-white/90 dark:bg-black/80">
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/30 dark:to-purple-900/30">
                <div>
                  <CardTitle className="text-2xl font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                    <Database className="h-6 w-6" />
                    {form?.name || 'Form Submissions'}
                  </CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-300">
                    View, filter, and export all submissions for this form. Total: {totalSubmissions}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => loadSubmissions(0)} disabled={submissionsLoading}>
                    {submissionsLoading ? 'Loading...' : 'Refresh'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {submissionsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading submissions...</span>
                  </div>
                ) : submissions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Form Submission #</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.map((submission, idx) => (
                          <TableRow key={submission.id || idx}>
                            <TableCell className="font-mono text-xs">
                              <div className="flex items-center gap-2">
                                <Badge className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" title={`Form submission #${idx + 1} (Global database ID: ${submission.id || `sub_${idx}`})`}>
                                  #{idx + 1}
                                </Badge>
                                <span className="text-gray-500 text-xs">({submission.id || `sub_${idx}`})</span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-md">
                              <div className="space-y-1">
                                {submission.data && typeof submission.data === 'object' ? (
                                  Object.entries(submission.data).map(([key, value]) => (
                                    <div key={key} className="text-xs">
                                      <span className="font-medium text-gray-600">{key}:</span>{' '}
                                      <span className="text-gray-800">{String(value)}</span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-gray-500 text-xs">No data</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {submission.ip_address || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                submission.status === 'delivered' ? 'default' :
                                submission.status === 'failed' ? 'destructive' : 'secondary'
                              }>
                                {submission.status || 'received'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() :
                               submission.date ? new Date(submission.date).toLocaleString() :
                               submission.created_at ? new Date(submission.created_at).toLocaleString() :
                               submission.timestamp ? new Date(submission.timestamp).toLocaleString() : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No submissions yet</p>
                    <p className="text-sm text-gray-400 mb-4">
                      Submissions will appear here after someone submits your form
                    </p>
                    <Button onClick={() => loadSubmissions(0)} disabled={submissionsLoading}>
                      {submissionsLoading ? 'Loading...' : 'Check for Submissions'}
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between mt-4">
                <div className="text-xs text-gray-400">
                  Page {currentPage + 1} of {Math.ceil(totalSubmissions / submissionsPerPage) || 1}
                  {totalSubmissions > 0 && ` • Showing ${submissions.length} of ${totalSubmissions} submissions`}
                </div>
                <div className="space-x-2">
                  <Button 
                    disabled={currentPage === 0 || submissionsLoading}
                    onClick={() => loadSubmissions(currentPage - 1)}
                  >
                    Prev
                  </Button>
                  <Button 
                    disabled={submissions.length < submissionsPerPage || submissionsLoading}
                    onClick={() => loadSubmissions(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
            </Tabs>

            <Toaster />
          </main>
        </div>
      </BottomGradientRadial>
    </AuthLayout>
  );
}

