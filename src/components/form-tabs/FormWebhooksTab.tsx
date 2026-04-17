import React from 'react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Webhook } from 'lucide-react';

interface FormWebhooksTabProps {
  form: any;
  webhookUrl: string;
  setWebhookUrl: (url: string) => void;
  webhookEnabled: boolean;
  setWebhookEnabled: (enabled: boolean) => void;
  handleUpdateWebhook: () => void;
}

export function FormWebhooksTab({
  form,
  webhookUrl,
  setWebhookUrl,
  webhookEnabled,
  setWebhookEnabled,
  handleUpdateWebhook,
}: FormWebhooksTabProps) {
  return (
    <Card className="shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <CardHeader className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/30 dark:to-purple-900/30 border-b border-slate-200 dark:border-slate-700">
        <CardTitle className="text-xl flex items-center gap-2">
          <Webhook className="h-5 w-5 text-blue-600" />
          Webhook Configuration
        </CardTitle>
        <CardDescription>Send submissions to your backend or third-party service in real-time</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <Switch 
            checked={webhookEnabled} 
            onCheckedChange={setWebhookEnabled}
            id="webhook-enabled"
          />
          <Label htmlFor="webhook-enabled" className="flex-1 font-medium text-slate-900 dark:text-slate-100 cursor-pointer">
            Enable Webhook Delivery
          </Label>
        </div>

        {webhookEnabled && (
          <>
            {/* Webhook URL Input */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="webhook-url" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Webhook URL *
                </Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://your-api.com/webhook/formhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="mt-2"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  FormHook will POST form submissions to this URL in real-time
                </p>
              </div>
            </div>

            {/* Payload Format Reference */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 p-4 space-y-3">
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-2">📬 Webhook Payload Format</h4>
                <p className="text-xs text-blue-800 dark:text-blue-200 mb-3">
                  Each form submission sends a POST request to your endpoint with this JSON structure:
                </p>
              </div>
              <pre className="text-xs bg-white dark:bg-slate-900 p-3 rounded border border-blue-200 dark:border-blue-700/50 overflow-x-auto text-slate-900 dark:text-slate-100">
{`{
  "form_id": "${form?.id || 'form-uuid'}",
  "submission_id": "sub_xxxxxxxxxxxx",
  "data": {
    "email": "user@example.com",
    "message": "Hello FormHook",
    // ... all form fields
  },
  "metadata": {
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
    "submitted_at": "2024-01-15T10:30:00Z",
    "country": "US",
    "city": "New York"
  }
}`}
              </pre>
            </div>

            {/* Save Button */}
            <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button 
                onClick={handleUpdateWebhook}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Save Webhook Configuration
              </Button>
            </div>
          </>
        )}

        {/* Empty State */}
        {!webhookEnabled && (
          <div className="text-center py-8 space-y-3">
            <Webhook className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-slate-500 dark:text-slate-400">Webhook delivery is disabled</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Enable webhooks above to start receiving form submissions on your server
            </p>
          </div>
        )}

        {/* Help Section */}
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">💡 Best Practices</p>
          <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside">
            <li>Use HTTPS to encrypt data in transit</li>
            <li>Implement exponential backoff retry logic</li>
            <li>Store webhook delivery logs for debugging</li>
            <li>Validate webhook signatures if configured</li>
            <li>Respond with 2xx status code within 30 seconds</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
