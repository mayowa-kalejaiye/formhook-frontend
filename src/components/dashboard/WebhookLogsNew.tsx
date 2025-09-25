"use client";
import React, { useState, useEffect } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../ui/button";
import { RefreshCcw, Globe, CheckCircle, XCircle, Clock, AlertTriangle, ExternalLink, Eye } from "lucide-react";
import { fetchWithAuth } from '../../services/api';

interface WebhookDelivery {
  id: string;
  form_id: string;
  submission_id: number;
  webhook_url: string;
  status: 'SUCCESS' | 'FAILED' | 'RETRY' | 'PENDING';
  attempts: number;
  max_attempts: number;
  last_attempt_at: string;
  next_retry_at?: string;
  response_code?: number;
  response_body?: string;
  error_message?: string;
  headers_sent?: Record<string, string>;
  duration_ms?: number;
  created_at: string;
}

export default function WebhookLogs() {
  const [webhookLogs, setWebhookLogs] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWebhookLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchWithAuth('/webhook-deliveries?limit=10');
      setWebhookLogs(response.deliveries || []);
    } catch (err) {
      console.error('Failed to fetch webhook logs:', err);
      setError('Failed to load webhook logs');
      setWebhookLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryFailed = async () => {
    try {
      setLoading(true);
      await fetchWithAuth('/webhook-deliveries/retry-failed', {
        method: 'POST',
      });
      await fetchWebhookLogs();
    } catch (err) {
      console.error('Failed to retry webhooks:', err);
      alert('Failed to retry failed webhooks');
    }
  };

  useEffect(() => {
    fetchWebhookLogs();
  }, []);
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'RETRY':
        return <RefreshCcw className="h-4 w-4 text-yellow-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="w-full mt-10 p-6 bg-gradient-to-tr from-[#0014FF]/60 to-[#0f172a]/80 dark:bg-[#0f172a] rounded-2xl shadow-xl border-0 relative overflow-hidden">
      {/* Subtle noise overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "url('/grain.svg')", opacity: 0.13 }} />
      <div className="flex items-center justify-between mb-4 z-10">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Recent Webhook Deliveries
        </h2>
        <div className="flex gap-2">
          <Button 
            onClick={handleRetryFailed}
            disabled={loading}
            className="flex gap-2 bg-orange-600/80 hover:bg-orange-700/80 text-white border border-orange-500/20"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Retry Failed
          </Button>
          <Button 
            onClick={fetchWebhookLogs}
            disabled={loading}
            className="flex gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="h-64 w-full rounded-lg bg-black/10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="ml-3 text-white">Loading submissions...</span>
        </div>
      ) : (
        <div className="h-64 w-full rounded-lg bg-black/10 overflow-auto">
          {error ? (
            <div className="text-center py-10 text-red-400">
              <div className="flex flex-col items-center gap-2">
                <AlertTriangle className="w-8 h-8" />
                <span>{error}</span>
                <Button onClick={fetchWebhookLogs} className="mt-2 bg-white/10 hover:bg-white/20">
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <table className="min-w-full text-sm text-left text-slate-300">
              <thead className="sticky top-0 bg-[#0f172a]">
                <tr>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">URL</th>
                  <th className="px-4 py-2">Submission</th>
                  <th className="px-4 py-2">Attempts</th>
                  <th className="px-4 py-2">Response</th>
                  <th className="px-4 py-2">Last Attempt</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {webhookLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <Globe className="w-8 h-8 text-slate-700" />
                        <span>No webhook deliveries found.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  webhookLogs.map((delivery) => (
                    <tr key={delivery.id} className="hover:bg-white/5">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(delivery.status)}
                          <span className="capitalize">{delivery.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 max-w-xs">
                        <div className="truncate text-xs font-mono">
                          {delivery.webhook_url}
                        </div>
                      </td>
                      <td className="px-4 py-2">#{delivery.submission_id}</td>
                      <td className="px-4 py-2">{delivery.attempts}/{delivery.max_attempts}</td>
                      <td className="px-4 py-2">
                        {delivery.response_code && (
                          <span className={
                            delivery.response_code >= 200 && delivery.response_code < 300
                              ? 'text-green-400'
                              : 'text-red-400'
                          }>
                            HTTP {delivery.response_code}
                          </span>
                        )}
                        {delivery.duration_ms && (
                          <div className="text-xs text-slate-500">{delivery.duration_ms}ms</div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {formatDate(delivery.last_attempt_at)}
                      </td>
                      <td className="px-4 py-2">
                        <Button
                          onClick={() => {
                            const details = [
                              `URL: ${delivery.webhook_url}`,
                              `Status: ${delivery.status}`,
                              `Submission: #${delivery.submission_id}`,
                              `Attempts: ${delivery.attempts}/${delivery.max_attempts}`,
                              `Response: HTTP ${delivery.response_code || 'N/A'}`,
                              `Duration: ${delivery.duration_ms || 0}ms`,
                              `Last Attempt: ${formatDate(delivery.last_attempt_at)}`,
                              delivery.error_message ? `Error: ${delivery.error_message}` : ''
                            ].filter(Boolean);
                            alert(details.join('\n'));
                          }}
                          className="p-1 h-auto bg-transparent hover:bg-white/10 text-slate-400 hover:text-white"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </Card>
  );
}
