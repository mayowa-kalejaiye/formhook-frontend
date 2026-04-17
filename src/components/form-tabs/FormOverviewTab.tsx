import React from 'react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Copy, ExternalLink, Globe, Key, Code, Code2 } from 'lucide-react';

interface FormOverviewTabProps {
  form: any;
  requireToken: boolean;
  token: string | null;
  showToken: boolean;
  tokenLoading: boolean;
  setShowToken: (show: boolean) => void;
  handleToggleRequireToken: (checked: boolean) => void;
  handleGenerateToken: () => void;
  handleRevokeToken: () => void;
  embedSnippet: () => string;
}

export function FormOverviewTab({
  form,
  requireToken,
  token,
  showToken,
  tokenLoading,
  setShowToken,
  handleToggleRequireToken,
  handleGenerateToken,
  handleRevokeToken,
  embedSnippet,
}: FormOverviewTabProps) {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://formhookapp.vercel.app';
  const publicUrl = `${currentOrigin}/f/${form?.id}`;

  return (
    <div className="space-y-6">
      {/* Basic Form Information */}
      <Card className="shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <CardHeader className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="text-xl flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Form Information
          </CardTitle>
          <CardDescription>Basic settings and access details</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Form Name</p>
              <p className="text-lg font-medium text-slate-900 dark:text-slate-100">{form?.name}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created</p>
              <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
                {form?.created_at 
                  ? new Date(form.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : '-'}
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Public Form URL</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={publicUrl}
                readOnly
                aria-label="Public form URL"
                title="Public form URL"
                className="flex-1 px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-sm font-mono border border-slate-200 dark:border-slate-700"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigator.clipboard.writeText(publicUrl)}
                className="flex-shrink-0"
                title="Copy URL"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(publicUrl, '_blank')}
                className="flex-shrink-0"
                title="Open form"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Token Section */}
      <Card className="shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <CardHeader className="bg-gradient-to-r from-indigo-50/80 to-blue-50/80 dark:from-indigo-900/30 dark:to-blue-900/30 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="text-xl flex items-center gap-2">
            <Key className="h-5 w-5 text-indigo-600" />
            API Token Authentication
          </CardTitle>
          <CardDescription>Optional security layer for programmatic submissions</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <Switch 
              checked={requireToken} 
              onCheckedChange={handleToggleRequireToken}
              id="require-token"
            />
            <Label htmlFor="require-token" className="flex-1 font-medium text-slate-900 dark:text-slate-100 cursor-pointer">
              Require Token Authentication
            </Label>
          </div>

          {requireToken && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Your API Token</p>
                {!token ? (
                  <Button 
                    onClick={handleGenerateToken} 
                    disabled={tokenLoading} 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {tokenLoading ? 'Generating...' : '+ Generate API Token'}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    {showToken ? (
                      <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50">
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300 mb-2">Token (keep this secret!)</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-2 bg-white dark:bg-slate-900 rounded px-3 py-2 text-xs font-mono text-amber-900 dark:text-amber-100 break-all">
                            {token}
                          </code>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(token)}
                            title="Copy token"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">⚠️ Copy this now. You won't see it again.</p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <code className="text-xs font-mono text-slate-500 tracking-wider">••••••••••••••••••••••••••••••••</code>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {!showToken && (
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setShowToken(true)}
                        >
                          Reveal Token
                        </Button>
                      )}
                      <Button 
                        variant="destructive" 
                        className="flex-1"
                        onClick={handleRevokeToken} 
                        disabled={tokenLoading}
                      >
                        {tokenLoading ? 'Revoking...' : 'Revoke Token'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Quick Start Guide */}
      {requireToken && (
        <Card className="shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <CardHeader className="bg-gradient-to-r from-purple-50/80 to-pink-50/80 dark:from-purple-900/30 dark:to-pink-900/30 border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="text-xl flex items-center gap-2">
              <Code2 className="h-5 w-5 text-purple-600" />
              API Token — Quick Start
            </CardTitle>
            <CardDescription>How to submit data programmatically when token authentication is enabled</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Option 1: Server-to-Server (Recommended)</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Direct API call from your server. Most secure approach.</p>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <pre className="text-xs font-mono text-slate-900 dark:text-slate-100 overflow-x-auto whitespace-pre-wrap break-words">
{`curl -X POST https://formhook-backend-rnvw.onrender.com/forms/${form?.id || '<FORM_ID>'}/submit \\
  -H "Authorization: Bearer <YOUR_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "data": {
      "email": "user@example.com",
      "message": "Hello FormHook"
    }
  }'`}
                  </pre>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Option 2: Browser + Server Proxy</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Keeps your token secret. Browser sends to your server, which forwards to FormHook.</p>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <pre className="text-xs font-mono text-slate-900 dark:text-slate-100 overflow-x-auto whitespace-pre-wrap break-words">
{`// On your server endpoint:
app.post('/api/submit-form', async (req, res) => {
  const response = await fetch(
    'https://formhook-backend-rnvw.onrender.com/forms/${form?.id || '<FORM_ID>'}/submit',
    {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer <YOUR_TOKEN>',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    }
  );
  return response.json();
});`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700 dark:text-yellow-300 mb-2">⚠️ Security Best Practices</p>
              <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-disc list-inside">
                <li>Never expose tokens in browser JavaScript or client-side code</li>
                <li>Store tokens in environment variables on your server</li>
                <li>Rotate tokens periodically if compromised</li>
                <li>Use HTTPS for all API requests</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Embed Snippet */}
      <Card className="shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <CardHeader className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/30 dark:to-emerald-900/30 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="text-xl flex items-center gap-2">
            <Code className="h-5 w-5 text-green-600" />
            Embed Snippet
          </CardTitle>
          <CardDescription>HTML form code to embed on your website</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <pre className="p-4 text-xs font-mono text-slate-900 dark:text-slate-100 overflow-x-auto whitespace-pre-wrap break-words max-h-96 overflow-y-auto">{embedSnippet()}</pre>
          </div>
          <Button 
            onClick={() => navigator.clipboard.writeText(embedSnippet())}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Embed Snippet
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
