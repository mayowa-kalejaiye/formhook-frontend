// --- Next.js SSG fallback for dynamic route build error ---
export async function getStaticPaths() {
  return { paths: [], fallback: 'blocking' };
}

export async function getStaticProps() {
  return { props: {} };
}

import React, { useEffect, useState } from 'react';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { toast } from '../../hooks/use-toast';
import axios from 'axios';
import { useRouter } from 'next/router';
import { getForm, getSubmissions, exportSubmissions, getFormAnalytics, generateApiToken, revokeApiToken, updateFormWebhook } from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';

export default function FormSettingsPage() {
  const router = useRouter();
  const { formId } = router.query;
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requireToken, setRequireToken] = useState(false);
  const [token, setToken] = useState<string|null>(null);
  const [showToken, setShowToken] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(false);
  // ...add state for analytics, submissions, etc. as needed...

  useEffect(() => {
    if (!formId) return;
    (async () => {
      setLoading(true);
      try {
        const data = await getForm(formId as string);
        setForm(data);
        setRequireToken(!!data.require_token);
        setToken(data.token || null);
      } catch (e) {
        toast({ title: 'Error', description: 'Failed to load form', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [formId]);

  const handleToggleRequireToken = async (checked: boolean) => {
    setRequireToken(checked);
    try {
      // Use the correct API to update require_token (e.g., updateForm or patchForm)
      // Replace 'updateForm' with the actual function in your services/api
      await updateForm(formId as string, { require_token: checked });
      setForm(f => f ? { ...f, require_token: checked } : f);
      toast({ title: 'Updated', description: 'Token authentication setting updated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update setting', variant: 'destructive' });
    }
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
    let snippet = `<form action="https://formhook-backend.onrender.com/forms/${form?.id}/submit" method="POST">\n`;
    if (requireToken && token) {
      snippet += `  <!-- Add this header to your request -->\n  Authorization: Bearer <form_token>\n`;
    }
    
    // Generate HTML for each field based on the form's actual fields
    const fieldsHtml = (form?.fields || []).map(f => {
      if (f.type === 'text' || f.type === 'email') {
        return `  <input name="data[${f.name}]" type="${f.type}" placeholder="${f.label}"${f.required ? ' required' : ''} />`;
      } else if (f.type === 'textarea') {
        return `  <textarea name="data[${f.name}]" placeholder="${f.label}"${f.required ? ' required' : ''}></textarea>`;
      } else if (f.type === 'checkbox') {
        return `  <label><input type="checkbox" name="data[${f.name}]"${f.required ? ' required' : ''}/> ${f.label}</label>`;
      } else if (f.type === 'select') {
        return `  <select name="data[${f.name}]"${f.required ? ' required' : ''}>${(f.options || []).filter(Boolean).map(opt => `\n    <option>${opt}</option>`).join('')}\n  </select>`;
      }
      return '';
    }).join('\n');
    
    snippet += fieldsHtml ? `\n${fieldsHtml}\n` : '\n  <!-- No fields defined -->\n';
    snippet += '  <button type="submit">Submit</button>\n</form>';
    return snippet;
  };

  if (loading) return <div className="p-8 text-center text-blue-400">Loading...</div>;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="logs">Webhook Logs</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
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
                      <Button onClick={handleGenerateToken} disabled={tokenLoading} variant="outline">{tokenLoading ? 'Generating...' : 'Generate API Token'}</Button>
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
                        <Button onClick={handleRevokeToken} disabled={tokenLoading} variant="destructive">{tokenLoading ? 'Revoking...' : 'Revoke Token'}</Button>
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
                  <Button size="sm" onClick={() => navigator.clipboard.writeText(embedSnippet())}>Copy Snippet</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="analytics">
            <Card className="mb-8 shadow border border-blue-100 bg-white/90 dark:bg-black/80">
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Submission and delivery analytics for this form.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-purple-400 py-12">Analytics charts go here.</div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="webhooks">
            <Card className="mb-8 shadow border border-blue-100 bg-white/90 dark:bg-black/80">
              <CardHeader>
                <CardTitle>Webhook Configuration</CardTitle>
                <CardDescription>Send submissions to your backend or third-party service.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ...webhook config UI here... */}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="logs">
            <Card className="mb-8 shadow border border-blue-100 bg-white/90 dark:bg-black/80">
              <CardHeader>
                <CardTitle>Webhook Deliveries</CardTitle>
                <CardDescription>Recent webhook delivery attempts for this form.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-400 py-8">Webhook logs table goes here.</div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="submissions">
            <Card className="shadow-xl border border-blue-100 bg-white/90 dark:bg-black/80">
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/30 dark:to-purple-900/30">
                <div>
                  <CardTitle className="text-2xl font-bold text-blue-900 dark:text-blue-200">{form?.name || 'Form Submissions'}</CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-300">View, filter, and export all submissions for this form.</CardDescription>
                </div>
                {/* Add export and pagination logic as needed */}
              </CardHeader>
              <CardContent>
                {/* ...submissions table/filter UI here... */}
              </CardContent>
              <CardFooter className="flex items-center justify-between mt-4">
                <div className="text-xs text-gray-400">Page {/* page + 1 */}</div>
                <div className="space-x-2">
                  <Button size="sm" variant="outline">Prev</Button>
                  <Button size="sm" variant="outline">Next</Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
function updateForm(arg0: string, arg1: { require_token: boolean; }) {
  throw new Error('Function not implemented.');
}

