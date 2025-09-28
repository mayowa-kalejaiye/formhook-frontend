"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  RefreshCcw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ExternalLink,
  Eye,
  MoreHorizontal,
  Globe
} from 'lucide-react';
import { fetchWithAuth } from '../../services/api';

interface WebhookDelivery {
  id: number;
  form_id: string;
  submission_id: number;
  webhook_url: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'RETRY';
  attempts: number;
  last_attempt_at: string;
  next_retry_at?: string;
  response_code?: number;
  error_message?: string;
  success: boolean;
  headers_sent: Record<string, string>;
  response_body?: string;
  retry_count: number;
  duration_ms: number;
}

export default function WebhookLogs() {
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWebhookLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchWithAuth('/webhook-deliveries?limit=10');
      setDeliveries(response.deliveries || []);
    } catch (err) {
      console.error('Failed to fetch webhook logs:', err);
      setError('Failed to load webhook logs');
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhookLogs();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'FAILED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'RETRY':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'PENDING':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const handleRetryWebhooks = async () => {
    try {
      setLoading(true);
      await fetchWithAuth('/webhook-deliveries/retry-failed', {
        method: 'POST',
      });
      // Refresh logs after retry
      await fetchWebhookLogs();
    } catch (err) {
      console.error('Failed to retry webhooks:', err);
      alert('Failed to retry failed webhooks');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Webhook Delivery Logs
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={handleRetryWebhooks} 
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white text-sm px-3 py-2"
            >
              <RefreshCcw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Retry Failed
            </Button>
            <Button 
              onClick={fetchWebhookLogs}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2"
            >
              <RefreshCcw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading webhook logs...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
            <p>{error}</p>
            <Button onClick={fetchWebhookLogs} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No webhook deliveries found</p>
                <p className="text-sm mt-1">Deliveries will appear here when webhooks are triggered</p>
              </div>
            ) : (
            deliveries.map((delivery) => (
              <div 
                key={delivery.id} 
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`text-xs px-2 py-1 ${getStatusColor(delivery.status)}`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(delivery.status)}
                          {delivery.status}
                        </div>
                      </Badge>
                      <span className="text-sm text-gray-600 dark:text-gray-400" title={`Global database submission ID: ${delivery.submission_id}`}>
                        Submission #{delivery.submission_id}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                        <span className="text-blue-600 dark:text-blue-400 truncate">
                          {delivery.webhook_url}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>Attempts: {delivery.attempts}</span>
                        <span>Duration: {delivery.duration_ms}ms</span>
                        {delivery.response_code && (
                          <span className={
                            delivery.response_code >= 200 && delivery.response_code < 300
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }>
                            HTTP {delivery.response_code}
                          </span>
                        )}
                        <span>Last: {formatDate(delivery.last_attempt_at)}</span>
                        {delivery.next_retry_at && (
                          <span className="text-yellow-600 dark:text-yellow-400">
                            Next retry: {formatDate(delivery.next_retry_at)}
                          </span>
                        )}
                      </div>
                      
                      {delivery.error_message && (
                        <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-red-700 dark:text-red-300 text-sm">
                            {delivery.error_message}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-4">
                    <Button 
                      onClick={() => {
                        const details = [
                          `Webhook URL: ${delivery.webhook_url}`,
                          `Status: ${delivery.status}`,
                          `Attempts: ${delivery.attempts}`,
                          `Response Code: ${delivery.response_code || 'N/A'}`,
                          `Duration: ${delivery.duration_ms}ms`,
                          `Headers Sent: ${JSON.stringify(delivery.headers_sent, null, 2)}`,
                          `Response Body: ${delivery.response_body || 'No response body'}`,
                          `Error: ${delivery.error_message || 'None'}`
                        ];
                        alert(`Webhook Delivery Details:\n\n${details.join('\n')}`);
                      }}
                      className="bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 p-2 h-8 w-8"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button 
                      onClick={() => {
                        const action = window.confirm(`Retry webhook delivery to ${delivery.webhook_url}?`);
                        if (action) {
                          alert("Webhook retry functionality would be implemented here");
                        }
                      }}
                      className="bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 p-2 h-8 w-8"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
