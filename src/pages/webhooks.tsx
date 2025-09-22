"use client";
import React, { useState, useEffect } from 'react';
import DashboardNav from '../components/DashboardNav';
import { useSidebar } from '../context/SidebarContext';
import BottomGradientRadial from '../components/BottomGradientRadial';
import AuthLayout from '../components/AuthLayout';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/common/Button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
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
  Edit
} from 'lucide-react';
import { getForms, getWebhookDeliveries, updateFormWebhook, retryPendingWebhooks } from '../services/api';
import { toast } from '../hooks/use-toast';
import { Toaster } from '../components/ui/toaster';

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
}

interface Form {
  id: string;
  name: string;
  webhook_url?: string;
  webhook_headers?: Record<string, string>;
  webhook_secret?: string;
}

function WebhooksPageContent() {
  const { isCollapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState('logs');
  const [forms, setForms] = useState<Form[]>([]);
  const [webhookDeliveries, setWebhookDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [webhookHeaders, setWebhookHeaders] = useState<Record<string, string>>({});
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');

  // Load forms and webhook deliveries
  useEffect(() => {
    loadForms();
    loadWebhookDeliveries();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      const response = await getForms();
      setForms(response.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load forms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWebhookDeliveries = async () => {
    try {
      setLoading(true);
      // Load deliveries for all forms
      const allDeliveries: WebhookDelivery[] = [];
      for (const form of forms) {
        if (form.webhook_url) {
          try {
            const deliveries = await getWebhookDeliveries(form.id);
            const formDeliveries = (deliveries.data || []).map((delivery: any) => ({
              ...delivery,
              form_name: form.name,
            }));
            allDeliveries.push(...formDeliveries);
          } catch (error) {
            // Skip if no deliveries for this form
          }
        }
      }
      setWebhookDeliveries(allDeliveries.sort((a, b) => 
        new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime()
      ));
    } catch (error) {
      console.error('Error loading webhook deliveries:', error);
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
      // Reload deliveries after retry
      setTimeout(() => {
        loadWebhookDeliveries();
      }, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to retry pending webhooks",
        variant: "destructive",
      });
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
      
      // Refresh forms list
      loadForms();
      setSelectedForm(null);
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to update webhook configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const selectFormForConfig = (form: Form) => {
    setSelectedForm(form);
    setWebhookUrl(form.webhook_url || '');
    setWebhookSecret(form.webhook_secret || '');
    setWebhookHeaders(form.webhook_headers || {});
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

  return (
    <BottomGradientRadial>
      <div className={`min-h-screen flex flex-col ${isCollapsed ? 'md:ml-16' : 'md:ml-56'} transition-all duration-300 ease-in-out`}>
        <DashboardNav />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-4">
          <Toaster />
          
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Webhook className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-purple-800 dark:text-purple-200 tracking-tight">
                Webhooks
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Manage webhook configurations and monitor delivery logs
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Button 
              onClick={handleRetryPendingWebhooks}
              disabled={retryLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${retryLoading ? 'animate-spin' : ''}`} />
              {retryLoading ? 'Retrying...' : 'Retry Failed Webhooks'}
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Delivery Logs
              </TabsTrigger>
              <TabsTrigger value="config" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuration
              </TabsTrigger>
            </TabsList>

            {/* Webhook Logs Tab */}
            <TabsContent value="logs">
              <Card>
                <CardHeader>
                  <CardTitle>Webhook Delivery Logs</CardTitle>
                  <CardDescription>
                    Monitor webhook delivery status and debug failed attempts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-purple-600" />
                      <span className="ml-2">Loading webhook logs...</span>
                    </div>
                  ) : webhookDeliveries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No webhook deliveries found</p>
                      <p className="text-sm mt-1">Configure webhooks for your forms to see delivery logs</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Form</TableHead>
                            <TableHead>URL</TableHead>
                            <TableHead>Response</TableHead>
                            <TableHead>Attempted</TableHead>
                            <TableHead>Retries</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {webhookDeliveries.map((delivery) => (
                            <TableRow key={delivery.id}>
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
                              <TableCell className="max-w-xs truncate" title={delivery.url}>
                                {delivery.url}
                              </TableCell>
                              <TableCell>
                                {delivery.response_code && (
                                  <Badge variant={delivery.response_code < 400 ? 'default' : 'destructive'}>
                                    {delivery.response_code}
                                  </Badge>
                                )}
                                {delivery.error_message && (
                                  <p className="text-sm text-red-600 mt-1 truncate max-w-xs" title={delivery.error_message}>
                                    {delivery.error_message}
                                  </p>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {new Date(delivery.attempted_at).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {delivery.retry_count > 0 && (
                                  <Badge variant="outline">
                                    {delivery.retry_count}
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Webhook Configuration Tab */}
            <TabsContent value="config">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Forms List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Forms with Webhooks</CardTitle>
                    <CardDescription>
                      Select a form to configure its webhook settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {forms.map((form) => (
                        <div
                          key={form.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedForm?.id === form.id 
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-950' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                          onClick={() => selectFormForConfig(form)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{form.name}</h4>
                              <p className="text-sm text-gray-500 truncate max-w-xs">
                                {form.webhook_url || 'No webhook configured'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {form.webhook_url ? (
                                <Badge>Configured</Badge>
                              ) : (
                                <Badge variant="secondary">Not configured</Badge>
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
                <Card>
                  <CardHeader>
                    <CardTitle>
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
                      <div className="space-y-4">
                        {/* Webhook URL */}
                        <div className="space-y-2">
                          <Label htmlFor="webhook-url">Webhook URL</Label>
                          <Input
                            id="webhook-url"
                            placeholder="https://your-domain.com/webhook"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                          />
                        </div>

                        {/* Webhook Secret */}
                        <div className="space-y-2">
                          <Label htmlFor="webhook-secret">Webhook Secret (optional)</Label>
                          <Input
                            id="webhook-secret"
                            type="password"
                            placeholder="Your webhook secret for signature validation"
                            value={webhookSecret}
                            onChange={(e) => setWebhookSecret(e.target.value)}
                          />
                        </div>

                        {/* Webhook Headers */}
                        <div className="space-y-2">
                          <Label>Custom Headers</Label>
                          <div className="space-y-2">
                            {Object.entries(webhookHeaders).map(([key, value]) => (
                              <div key={key} className="flex items-center gap-2">
                                <Input value={key} disabled className="flex-1" />
                                <Input value={value} disabled className="flex-1" />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeWebhookHeader(key)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="Header name"
                                value={newHeaderKey}
                                onChange={(e) => setNewHeaderKey(e.target.value)}
                                className="flex-1"
                              />
                              <Input
                                placeholder="Header value"
                                value={newHeaderValue}
                                onChange={(e) => setNewHeaderValue(e.target.value)}
                                className="flex-1"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={addWebhookHeader}
                                disabled={!newHeaderKey || !newHeaderValue}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-4">
                          <Button onClick={handleSaveWebhookConfig} disabled={loading}>
                            <Send className="h-4 w-4 mr-2" />
                            {loading ? 'Saving...' : 'Save Configuration'}
                          </Button>
                          <Button variant="outline" onClick={() => setSelectedForm(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Select a form from the list to configure its webhook</p>
                      </div>
                    )}
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
