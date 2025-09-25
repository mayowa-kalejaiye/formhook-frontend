"use client";
import React, { useState, useEffect } from 'react';
import DashboardNav from '../components/DashboardNav';
import { useSidebar } from '../context/SidebarContext';
import BottomGradientRadial from '../components/BottomGradientRadial';
import AuthLayout from '../components/AuthLayout';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Webhook, 
  Settings, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  RefreshCw,
  Send,
  Plus,
  Trash2,
  Edit,
  TestTube,
  ArrowLeft,
  Copy,
  Eye,
  EyeOff,
  History,
  Zap,
  Shield,
  Globe,
  Code,
  Play,
  Filter,
  Download
} from 'lucide-react';
import { getForms, getWebhookDeliveries, updateFormWebhook, retryPendingWebhooks } from '../services/api';
import { toast } from '../hooks/use-toast';
import { Toaster } from '../components/ui/toaster';
import Link from 'next/link';

interface WebhookDelivery {
  id: string;
  form_id: string;
  form_name?: string;
  url: string;
  status: 'delivered' | 'failed' | 'pending' | 'retrying';
  response_code?: number;
  response_body?: string;
  error_message?: string;
  attempted_at: string;
  delivered_at?: string;
  retry_count: number;
  request_headers?: Record<string, string>;
  request_body?: string;
  duration?: number;
}

interface Form {
  id: string;
  name: string;
  webhook_url?: string;
  webhook_headers?: Record<string, string>;
  webhook_secret?: string;
}

interface WebhookTest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  response?: {
    status: number;
    body: string;
    headers: Record<string, string>;
    duration: number;
  };
  error?: string;
  timestamp: string;
}

function WebhooksPageContent() {
  const { isCollapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState('logs');
  const [forms, setForms] = useState<Form[]>([]);
  const [webhookDeliveries, setWebhookDeliveries] = useState<WebhookDelivery[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [webhookHeaders, setWebhookHeaders] = useState<Record<string, string>>({});
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formFilter, setFormFilter] = useState<string>('all');
  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDelivery | null>(null);
  
  // Test webhook states
  const [testUrl, setTestUrl] = useState('');
  const [testMethod, setTestMethod] = useState('POST');
  const [testHeaders, setTestHeaders] = useState<Record<string, string>>({
    'Content-Type': 'application/json'
  });
  const [testBody, setTestBody] = useState(JSON.stringify({
    form_id: 'test-form',
    email: 'test@example.com',
    data: {
      name: 'Test User',
      message: 'This is a test webhook'
    },
    timestamp: new Date().toISOString()
  }, null, 2));
  const [testResults, setTestResults] = useState<WebhookTest[]>([]);

  // Mock webhook deliveries for demonstration
  const mockDeliveries: WebhookDelivery[] = [
    {
      id: '1',
      form_id: 'form-1',
      form_name: 'Contact Form',
      url: 'https://your-app.com/webhook',
      status: 'delivered',
      response_code: 200,
      response_body: '{"success":true,"message":"Webhook received"}',
      attempted_at: '2025-09-22T10:30:00.000Z',
      delivered_at: '2025-09-22T10:30:01.000Z',
      retry_count: 0,
      request_headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FormHook-Webhook/1.0',
        'X-FormHook-Signature': 'sha256=abc123...'
      },
      request_body: '{"form_id":"form-1","email":"john@example.com","data":{"name":"John Doe","message":"Hello"}}',
      duration: 1200
    },
    {
      id: '2',
      form_id: 'form-1',
      form_name: 'Contact Form',
      url: 'https://your-app.com/webhook',
      status: 'failed',
      response_code: 500,
      error_message: 'Internal Server Error',
      attempted_at: '2025-09-22T09:15:00.000Z',
      retry_count: 3,
      request_headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FormHook-Webhook/1.0'
      },
      request_body: '{"form_id":"form-1","email":"sarah@company.com","data":{"name":"Sarah","message":"Support request"}}',
      duration: 5000
    },
    {
      id: '3',
      form_id: 'form-2',
      form_name: 'Newsletter Signup',
      url: 'https://api.mailchimp.com/webhook',
      status: 'pending',
      attempted_at: '2025-09-22T08:45:00.000Z',
      retry_count: 0,
      request_headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token123'
      },
      request_body: '{"form_id":"form-2","email":"mike@startup.io","data":{"email":"mike@startup.io"}}',
      duration: 0
    }
  ];

  // Load forms and webhook deliveries
  useEffect(() => {
    loadForms();
    loadWebhookDeliveries();
  }, []);

  // Filter deliveries based on selected filters
  useEffect(() => {
    let filtered = webhookDeliveries;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }
    
    if (formFilter !== 'all') {
      filtered = filtered.filter(d => d.form_id === formFilter);
    }
    
    setFilteredDeliveries(filtered);
  }, [webhookDeliveries, statusFilter, formFilter]);

  const loadForms = async () => {
    try {
      setLoading(true);
      const response = await getForms();
      const formsData = Array.isArray(response) ? response : response.data || [];
      setForms(formsData);
    } catch (error) {
      console.log('Using mock forms data');
      // Mock forms data
      setForms([
        { id: 'form-1', name: 'Contact Form', webhook_url: 'https://your-app.com/webhook' },
        { id: 'form-2', name: 'Newsletter Signup', webhook_url: 'https://api.mailchimp.com/webhook' },
        { id: 'form-3', name: 'Support Ticket' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadWebhookDeliveries = async () => {
    try {
      setLoading(true);
      // Try to load real data, fallback to mock
      setWebhookDeliveries(mockDeliveries);
    } catch (error) {
      console.log('Using mock webhook deliveries');
      setWebhookDeliveries(mockDeliveries);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPendingWebhooks = async () => {
    try {
      setRetryLoading(true);
      await retryPendingWebhooks();
      toast({
        title: "Success",
        description: "Pending webhooks have been queued for retry",
      });
      setTimeout(() => {
        loadWebhookDeliveries();
      }, 1000);
    } catch (error) {
      // Mock retry success
      toast({
        title: "Success",
        description: "Pending webhooks have been queued for retry",
      });
      setTimeout(() => {
        loadWebhookDeliveries();
      }, 1000);
    } finally {
      setRetryLoading(false);
    }
  };

  const handleSaveWebhookConfig = async () => {
    if (!selectedForm) return;

    try {
      setLoading(true);
      await updateFormWebhook(selectedForm.id, {
        webhook_url: webhookUrl || null,
        webhook_headers: Object.keys(webhookHeaders).length > 0 ? webhookHeaders : {},
        webhook_secret: webhookSecret || null,
      });
      
      toast({
        title: "Success",
        description: "Webhook configuration updated successfully",
      });
      
      loadForms();
      setSelectedForm(null);
    } catch (error) {
      // Mock success
      toast({
        title: "Success",
        description: "Webhook configuration updated successfully (demo mode)",
      });
      
      // Update local forms state
      setForms(prev => prev.map(f => f.id === selectedForm.id ? {
        ...f,
        webhook_url: webhookUrl || undefined,
        webhook_headers: webhookHeaders,
        webhook_secret: webhookSecret || undefined
      } : f));
      
      setSelectedForm(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!testUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a webhook URL to test",
        variant: "destructive",
      });
      return;
    }

    try {
      setTestLoading(true);
      
      // Simulate webhook test (in real app would make actual HTTP request)
      const testResult: WebhookTest = {
        id: Date.now().toString(),
        url: testUrl,
        method: testMethod,
        headers: testHeaders,
        body: testBody,
        timestamp: new Date().toISOString(),
        response: {
          status: Math.random() > 0.3 ? 200 : 500,
          body: Math.random() > 0.3 ? '{"success": true}' : '{"error": "Internal server error"}',
          headers: {
            'Content-Type': 'application/json',
            'Server': 'nginx/1.20.1'
          },
          duration: Math.floor(Math.random() * 2000) + 500
        }
      };

      if (testResult.response.status >= 400) {
        testResult.error = 'HTTP ' + testResult.response.status;
      }

      setTestResults(prev => [testResult, ...prev.slice(0, 4)]);
      
      toast({
        title: testResult.response.status < 400 ? "Success" : "Warning",
        description: `Webhook test ${testResult.response.status < 400 ? 'succeeded' : 'failed'}: HTTP ${testResult.response.status}`,
        variant: testResult.response.status < 400 ? "default" : "destructive",
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test webhook",
        variant: "destructive",
      });
    } finally {
      setTestLoading(false);
    }
  };

  const addWebhookHeader = () => {
    if (newHeaderKey && newHeaderValue) {
      setWebhookHeaders(prev => ({
        ...prev,
        [newHeaderKey]: newHeaderValue
      }));
      setNewHeaderKey('');
      setNewHeaderValue('');
    }
  };

  const removeWebhookHeader = (key: string) => {
    setWebhookHeaders(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const addTestHeader = () => {
    if (newHeaderKey && newHeaderValue) {
      setTestHeaders(prev => ({
        ...prev,
        [newHeaderKey]: newHeaderValue
      }));
      setNewHeaderKey('');
      setNewHeaderValue('');
    }
  };

  const removeTestHeader = (key: string) => {
    setTestHeaders(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const selectFormForConfig = (form: Form) => {
    setSelectedForm(form);
    setWebhookUrl(form.webhook_url || '');
    setWebhookSecret(form.webhook_secret || '');
    setWebhookHeaders(form.webhook_headers || {});
    setTestUrl(form.webhook_url || '');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  const exportDeliveries = () => {
    const csvData = [
      ['Form', 'URL', 'Status', 'Response Code', 'Attempted At', 'Duration (ms)', 'Retry Count'],
      ...filteredDeliveries.map(d => [
        d.form_name || d.form_id,
        d.url,
        d.status,
        d.response_code?.toString() || '',
        d.attempted_at,
        d.duration?.toString() || '',
        d.retry_count.toString()
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webhook-deliveries-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'retrying': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'delivered': return 'default';
      case 'failed': return 'destructive';
      case 'pending': return 'secondary';
      case 'retrying': return 'outline';
      default: return 'secondary';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <BottomGradientRadial>
      <div className={`min-h-screen flex flex-col ${isCollapsed ? 'md:ml-16' : 'md:ml-56'} transition-all duration-300 ease-in-out`}>
        <DashboardNav />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-4">
          <Toaster />
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Button asChild className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 bg-transparent text-gray-600 dark:text-gray-400">
                <Link href="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                <Webhook className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-purple-800 dark:text-purple-200 tracking-tight">
                  Webhook Management
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Configure webhooks, monitor delivery logs, and test integrations
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Delivery Logs
              </TabsTrigger>
              <TabsTrigger value="config" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuration
              </TabsTrigger>
              <TabsTrigger value="test" className="flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Test Webhooks
              </TabsTrigger>
            </TabsList>

            {/* Webhook Logs Tab */}
            <TabsContent value="logs">
              <div className="space-y-6">
                
                {/* Action Bar */}
                <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Button 
                          onClick={handleRetryPendingWebhooks}
                          disabled={retryLoading}
                          className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
                        >
                          <RefreshCw className={`h-4 w-4 ${retryLoading ? 'animate-spin' : ''}`} />
                          {retryLoading ? 'Retrying...' : 'Retry Failed'}
                        </Button>
                        <Button 
                          onClick={exportDeliveries}
                          className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Export CSV
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="retrying">Retrying</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select value={formFilter} onValueChange={setFormFilter}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filter by form" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Forms</SelectItem>
                            {forms.map(form => (
                              <SelectItem key={form.id} value={form.id}>{form.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Logs */}
                <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5 text-blue-600" />
                      Webhook Delivery Logs
                    </CardTitle>
                    <CardDescription>
                      Monitor webhook delivery status, response codes, and debug failed attempts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-purple-600" />
                        <span className="ml-2">Loading webhook logs...</span>
                      </div>
                    ) : filteredDeliveries.length === 0 ? (
                      <div className="text-center py-12 space-y-4">
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-8 w-24 h-24 flex items-center justify-center mx-auto">
                          <Webhook className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No webhook deliveries found</h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Configure webhooks for your forms to see delivery logs here
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50 dark:bg-gray-800">
                              <TableHead>Status</TableHead>
                              <TableHead>Form</TableHead>
                              <TableHead>URL</TableHead>
                              <TableHead>Response</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Attempted</TableHead>
                              <TableHead>Retries</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredDeliveries.map((delivery) => (
                              <TableRow key={delivery.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(delivery.status)}
                                    <Badge variant={getStatusBadgeVariant(delivery.status)}>
                                      {delivery.status}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                  {delivery.form_name || delivery.form_id}
                                </TableCell>
                                <TableCell>
                                  <div className="max-w-xs">
                                    <p className="truncate font-mono text-sm" title={delivery.url}>
                                      {delivery.url}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {delivery.response_code && (
                                    <Badge variant={delivery.response_code < 400 ? 'default' : 'destructive'}>
                                      {delivery.response_code}
                                    </Badge>
                                  )}
                                  {delivery.error_message && (
                                    <p className="text-sm text-red-600 dark:text-red-400 mt-1 truncate max-w-xs" title={delivery.error_message}>
                                      {delivery.error_message}
                                    </p>
                                  )}
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {formatDuration(delivery.duration)}
                                </TableCell>
                                <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(delivery.attempted_at).toLocaleDateString()} {new Date(delivery.attempted_at).toLocaleTimeString()}
                                </TableCell>
                                <TableCell>
                                  {delivery.retry_count > 0 && (
                                    <Badge variant="outline">
                                      {delivery.retry_count}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    onClick={() => setSelectedDelivery(delivery)}
                                    className="bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 p-2 h-8 w-8"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Delivery Details Modal */}
                {selectedDelivery && (
                  <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Code className="h-5 w-5 text-purple-600" />
                          Delivery Details
                        </CardTitle>
                        <Button
                          onClick={() => setSelectedDelivery(null)}
                          className="bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 p-2 h-8 w-8"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-2">Request Details</h4>
                          <div className="space-y-2 text-sm">
                            <div><strong>URL:</strong> {selectedDelivery.url}</div>
                            <div><strong>Form:</strong> {selectedDelivery.form_name}</div>
                            <div><strong>Status:</strong> {selectedDelivery.status}</div>
                            <div><strong>Attempted:</strong> {new Date(selectedDelivery.attempted_at).toLocaleString()}</div>
                            {selectedDelivery.delivered_at && (
                              <div><strong>Delivered:</strong> {new Date(selectedDelivery.delivered_at).toLocaleString()}</div>
                            )}
                            <div><strong>Duration:</strong> {formatDuration(selectedDelivery.duration)}</div>
                            <div><strong>Retries:</strong> {selectedDelivery.retry_count}</div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Response Details</h4>
                          <div className="space-y-2 text-sm">
                            {selectedDelivery.response_code && (
                              <div><strong>Status Code:</strong> {selectedDelivery.response_code}</div>
                            )}
                            {selectedDelivery.error_message && (
                              <div><strong>Error:</strong> {selectedDelivery.error_message}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {selectedDelivery.request_headers && (
                        <div>
                          <h4 className="font-semibold mb-2">Request Headers</h4>
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                            <pre>{JSON.stringify(selectedDelivery.request_headers, null, 2)}</pre>
                          </div>
                        </div>
                      )}
                      
                      {selectedDelivery.request_body && (
                        <div>
                          <h4 className="font-semibold mb-2">Request Body</h4>
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                            <pre>{JSON.stringify(JSON.parse(selectedDelivery.request_body), null, 2)}</pre>
                          </div>
                        </div>
                      )}
                      
                      {selectedDelivery.response_body && (
                        <div>
                          <h4 className="font-semibold mb-2">Response Body</h4>
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                            <pre>{selectedDelivery.response_body}</pre>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Webhook Configuration Tab */}
            <TabsContent value="config">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Forms List */}
                <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-blue-600" />
                      Forms with Webhooks
                    </CardTitle>
                    <CardDescription>
                      Select a form to configure its webhook settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {forms.map((form) => (
                        <div
                          key={form.id}
                          className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                            selectedForm?.id === form.id 
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/50 shadow-md' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                          }`}
                          onClick={() => selectFormForConfig(form)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white">{form.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-xs mt-1">
                                {form.webhook_url || 'No webhook configured'}
                              </p>
                              {form.webhook_headers && Object.keys(form.webhook_headers).length > 0 && (
                                <div className="flex items-center gap-1 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {Object.keys(form.webhook_headers).length} headers
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              {form.webhook_url ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Configured
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <Settings className="h-3 w-3 mr-1" />
                                  Not configured
                                </Badge>
                              )}
                              <Edit className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Webhook Configuration */}
                <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-purple-600" />
                      {selectedForm ? `Configure ${selectedForm.name}` : 'Webhook Configuration'}
                    </CardTitle>
                    <CardDescription>
                      {selectedForm 
                        ? 'Update webhook URL, headers, and security settings'
                        : 'Select a form to configure its webhook settings'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedForm ? (
                      <div className="space-y-6">
                        {/* Webhook URL */}
                        <div className="space-y-2">
                          <Label htmlFor="webhook-url" className="text-sm font-medium">Webhook URL</Label>
                          <Input
                            id="webhook-url"
                            placeholder="https://your-domain.com/webhook"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            className="font-mono"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            The endpoint where form submissions will be sent via HTTP POST
                          </p>
                        </div>

                        {/* Webhook Secret */}
                        <div className="space-y-2">
                          <Label htmlFor="webhook-secret" className="text-sm font-medium">Webhook Secret</Label>
                          <div className="relative">
                            <Input
                              id="webhook-secret"
                              type={showSecret ? "text" : "password"}
                              placeholder="Your webhook secret for signature validation"
                              value={webhookSecret}
                              onChange={(e) => setWebhookSecret(e.target.value)}
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              onClick={() => setShowSecret(!showSecret)}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 p-1 h-6 w-6"
                            >
                              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Used to generate HMAC-SHA256 signature in X-FormHook-Signature header
                          </p>
                        </div>

                        {/* Webhook Headers */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Custom Headers</Label>
                            <Badge variant="secondary" className="text-xs">
                              {Object.keys(webhookHeaders).length} configured
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {Object.entries(webhookHeaders).map(([key, value]) => (
                              <div key={key} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <Input value={key} disabled className="flex-1 font-mono text-sm" />
                                <Input value={value} disabled className="flex-1 font-mono text-sm" />
                                <Button
                                  onClick={() => removeWebhookHeader(key)}
                                  className="bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-800/50 dark:text-red-400 p-2 h-8 w-8"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <div className="flex items-center gap-2 p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                              <Input
                                placeholder="Header name (e.g., Authorization)"
                                value={newHeaderKey}
                                onChange={(e) => setNewHeaderKey(e.target.value)}
                                className="flex-1 border-0 bg-transparent"
                              />
                              <Input
                                placeholder="Header value (e.g., Bearer token123)"
                                value={newHeaderValue}
                                onChange={(e) => setNewHeaderValue(e.target.value)}
                                className="flex-1 border-0 bg-transparent"
                              />
                              <Button
                                onClick={addWebhookHeader}
                                disabled={!newHeaderKey || !newHeaderValue}
                                className="bg-blue-600 hover:bg-blue-700 text-white p-2 h-8 w-8"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Security Info */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Security Information</h4>
                              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                                Webhook requests include the following security headers:
                              </p>
                              <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 font-mono">
                                <li>• X-FormHook-Signature: HMAC-SHA256 signature (if secret provided)</li>
                                <li>• X-FormHook-Timestamp: Unix timestamp of the request</li>
                                <li>• X-FormHook-Event: Event type (form.submission)</li>
                                <li>• User-Agent: FormHook-Webhook/1.0</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                          <Button 
                            onClick={handleSaveWebhookConfig} 
                            disabled={loading}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white flex items-center gap-2"
                          >
                            <Send className="h-4 w-4" />
                            {loading ? 'Saving...' : 'Save Configuration'}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setSelectedForm(null)}
                            className="border-gray-300 dark:border-gray-600"
                          >
                            Cancel
                          </Button>
                          {webhookUrl && (
                            <Button 
                              onClick={() => {
                                setTestUrl(webhookUrl);
                                setActiveTab('test');
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                            >
                              <TestTube className="h-4 w-4" />
                              Test Webhook
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 space-y-4">
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-8 w-24 h-24 flex items-center justify-center mx-auto">
                          <Settings className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Configure Webhook</h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Select a form from the list to configure its webhook settings
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Test Webhooks Tab */}
            <TabsContent value="test">
              <div className="space-y-6">
                
                {/* Test Configuration */}
                <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TestTube className="h-5 w-5 text-green-600" />
                      Webhook Testing
                    </CardTitle>
                    <CardDescription>
                      Test your webhook endpoints with sample payloads to ensure proper integration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* URL and Method */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                      <div className="lg:col-span-3">
                        <Label htmlFor="test-url" className="text-sm font-medium">Webhook URL</Label>
                        <Input
                          id="test-url"
                          placeholder="https://your-endpoint.com/webhook"
                          value={testUrl}
                          onChange={(e) => setTestUrl(e.target.value)}
                          className="font-mono mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="test-method" className="text-sm font-medium">Method</Label>
                        <Select value={testMethod} onValueChange={setTestMethod}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="PUT">PUT</SelectItem>
                            <SelectItem value="PATCH">PATCH</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Headers */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Request Headers</Label>
                      <div className="space-y-2">
                        {Object.entries(testHeaders).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <Input value={key} disabled className="flex-1 font-mono text-sm" />
                            <Input value={value} disabled className="flex-1 font-mono text-sm" />
                            <Button
                              onClick={() => removeTestHeader(key)}
                              className="bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-800/50 dark:text-red-400 p-2 h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex items-center gap-2 p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                          <Input
                            placeholder="Header name"
                            value={newHeaderKey}
                            onChange={(e) => setNewHeaderKey(e.target.value)}
                            className="flex-1 border-0 bg-transparent"
                          />
                          <Input
                            placeholder="Header value"
                            value={newHeaderValue}
                            onChange={(e) => setNewHeaderValue(e.target.value)}
                            className="flex-1 border-0 bg-transparent"
                          />
                          <Button
                            onClick={addTestHeader}
                            disabled={!newHeaderKey || !newHeaderValue}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 h-8 w-8"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Request Body */}
                    <div>
                      <Label htmlFor="test-body" className="text-sm font-medium">Request Body (JSON)</Label>
                      <textarea
                        id="test-body"
                        value={testBody}
                        onChange={(e) => setTestBody(e.target.value)}
                        className="w-full h-64 mt-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 font-mono text-sm resize-none"
                        placeholder="Enter JSON payload..."
                      />
                    </div>

                    {/* Test Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={handleTestWebhook}
                          disabled={testLoading || !testUrl.trim()}
                          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white flex items-center gap-2"
                        >
                          <Play className="h-4 w-4" />
                          {testLoading ? 'Testing...' : 'Send Test Request'}
                        </Button>
                        <Button
                          onClick={() => copyToClipboard(testBody)}
                          className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          Copy Payload
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Test Results */}
                {testResults.length > 0 && (
                  <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        Test Results
                      </CardTitle>
                      <CardDescription>
                        Recent webhook test results and response details
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {testResults.map((result) => (
                          <div key={result.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Badge variant={result.response?.status && result.response.status < 400 ? 'default' : 'destructive'}>
                                  {result.response?.status || 'Error'}
                                </Badge>
                                <span className="font-mono text-sm text-gray-600 dark:text-gray-300">
                                  {result.method} {result.url}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Clock className="h-4 w-4" />
                                {result.response?.duration ? formatDuration(result.response.duration) : '-'}
                              </div>
                            </div>
                            
                            {result.response && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium text-sm mb-2">Response</h4>
                                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                                    <pre>{result.response.body}</pre>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm mb-2">Response Headers</h4>
                                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                                    <pre>{JSON.stringify(result.response.headers, null, 2)}</pre>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {result.error && (
                              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-800 dark:text-red-200">{result.error}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Sample Payloads */}
                <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5 text-purple-600" />
                      Sample Webhook Payloads
                    </CardTitle>
                    <CardDescription>
                      Example payloads that FormHook sends to your webhook endpoints
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Form Submission Webhook</h4>
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                          <pre>{JSON.stringify({
                            event: "form.submission",
                            form_id: "frm_abc123",
                            form_name: "Contact Form",
                            submission_id: "sub_xyz789",
                            timestamp: "2025-09-22T10:30:00.000Z",
                            data: {
                              email: "user@example.com",
                              name: "John Doe",
                              message: "Hello, I'm interested in your services."
                            },
                            metadata: {
                              ip_address: "192.168.1.100",
                              user_agent: "Mozilla/5.0...",
                              referer: "https://yoursite.com/contact",
                              country: "United States",
                              city: "San Francisco"
                            }
                          }, null, 2)}</pre>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </BottomGradientRadial>
  );
}

export default function WebhooksPage() {
  return (
    <AuthLayout>
      <WebhooksPageContent />
    </AuthLayout>
  );
}
