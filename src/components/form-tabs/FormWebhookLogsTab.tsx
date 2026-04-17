import React from 'react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { Badge } from '../ui/badge';
import { Activity, CheckCircle2, AlertCircle, Clock, RotateCcw } from 'lucide-react';

interface WebhookLog {
  id?: string | number;
  form_id?: string;
  submission_id?: number;
  webhook_url?: string;
  status?: string;
  response_code?: number;
  error_message?: string;
  attempts?: number;
  last_attempt_at?: string;
  attempted_at?: string;
  created_at?: string;
  timestamp?: string;
  response_time?: number;
  form_name?: string;
}

interface FormWebhookLogsTabProps {
  form: any;
  webhookLogs: WebhookLog[];
  webhookLogsLoading: boolean;
  webhookEnabled: boolean;
  loadWebhookLogs: () => void;
}

const getStatusIcon = (status?: string) => {
  const normalizedStatus = (status || '').toLowerCase();
  if (normalizedStatus === 'success' || normalizedStatus === 'delivered') {
    return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  } else if (normalizedStatus === 'failed' || normalizedStatus === 'error') {
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  } else if (normalizedStatus === 'pending' || normalizedStatus === 'retrying') {
    return <Clock className="h-4 w-4 text-amber-600" />;
  }
  return <Clock className="h-4 w-4 text-slate-400" />;
};

const getStatusBadgeVariant = (status?: string) => {
  const normalizedStatus = (status || '').toLowerCase();
  if (normalizedStatus === 'success' || normalizedStatus === 'delivered') {
    return 'default';
  } else if (normalizedStatus === 'failed' || normalizedStatus === 'error') {
    return 'destructive';
  }
  return 'secondary';
};

const getStatusLabel = (status?: string) => {
  const normalizedStatus = (status || '').toLowerCase();
  if (normalizedStatus === 'success') return 'Delivered';
  if (normalizedStatus === 'delivered') return 'Delivered';
  if (normalizedStatus === 'failed') return 'Failed';
  if (normalizedStatus === 'error') return 'Error';
  if (normalizedStatus === 'pending') return 'Pending';
  if (normalizedStatus === 'retrying') return 'Retrying';
  return status || 'Unknown';
};

export function FormWebhookLogsTab({
  form,
  webhookLogs,
  webhookLogsLoading,
  webhookEnabled,
  loadWebhookLogs,
}: FormWebhookLogsTabProps) {
  return (
    <Card className="shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <CardHeader className="bg-gradient-to-r from-indigo-50/80 to-blue-50/80 dark:from-indigo-900/30 dark:to-blue-900/30 border-b border-slate-200 dark:border-slate-700">
        <CardTitle className="text-xl flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-600" />
          Webhook Deliveries
        </CardTitle>
        <CardDescription>Real-time delivery logs and status for all webhook attempts</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {webhookLogsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-slate-600 dark:text-slate-400">Loading webhook logs...</span>
          </div>
        ) : webhookLogs.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{webhookLogs.length} Recent Deliveries</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Showing latest webhook delivery attempts
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadWebhookLogs} 
                disabled={webhookLogsLoading}
              >
                {webhookLogsLoading ? 'Refreshing...' : 'Refresh Logs'}
              </Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                  <TableRow className="border-b border-slate-200 dark:border-slate-700">
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="min-w-48">Webhook URL</TableHead>
                    <TableHead className="w-24">Code</TableHead>
                    <TableHead className="w-32">Time</TableHead>
                    <TableHead className="w-24">Response</TableHead>
                    <TableHead className="w-20 text-right">Attempts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhookLogs.map((log, idx) => (
                    <TableRow 
                      key={log.id || idx}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <Badge variant={getStatusBadgeVariant(log.status) as any} className="text-xs">
                            {getStatusLabel(log.status)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all">
                          {log.webhook_url || form?.webhook_url || '-'}
                        </code>
                      </TableCell>
                      <TableCell>
                        {log.response_code ? (
                          <Badge 
                            variant={log.response_code >= 200 && log.response_code < 300 ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {log.response_code}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                        {log.created_at 
                          ? new Date(log.created_at).toLocaleString('en-US', { 
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })
                          : log.timestamp 
                            ? new Date(log.timestamp).toLocaleString('en-US', { 
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })
                            : log.attempted_at
                              ? new Date(log.attempted_at).toLocaleString('en-US', { 
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })
                              : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                        {log.response_time ? `${log.response_time}ms` : '—'}
                      </TableCell>
                      <TableCell className="text-right text-xs text-slate-600 dark:text-slate-400">
                        {log.attempts || 1}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 space-y-3">
            <Activity className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="font-medium text-slate-900 dark:text-slate-100">No webhook deliveries yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {webhookEnabled
                ? 'Webhook deliveries will appear here once form submissions are received'
                : 'Enable webhook configuration above to see delivery logs'}
            </p>
            <Button variant="outline" onClick={loadWebhookLogs} className="mt-4">
              <RotateCcw className="h-4 w-4 mr-2" />
              Refresh Logs
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
