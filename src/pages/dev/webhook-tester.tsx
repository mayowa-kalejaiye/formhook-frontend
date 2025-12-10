import React, { useState } from 'react';
import PrivateRoute from '@/components/PrivateRoute';

function WebhookTesterView() {
  const [url, setUrl] = useState('');
  const [payload, setPayload] = useState('{"hello":"world"}');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    setResult(null);
    try {
      const resp = await fetch('/api/dev/test-webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url, payload: JSON.parse(payload) }),
      });
      const json = await resp.json();
      setResult(json);
    } catch (err: any) {
      setResult({ ok: false, error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Webhook Tester</h2>
      <div className="space-y-3 max-w-2xl">
        <div>
          <label className="block text-sm font-medium">Webhook URL</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} className="mt-1 block w-full border rounded px-2 py-1" />
        </div>

        <div>
          <label className="block text-sm font-medium">JSON Payload</label>
          <textarea value={payload} onChange={(e) => setPayload(e.target.value)} rows={8} className="mt-1 block w-full border rounded px-2 py-1" />
        </div>

        <div className="flex gap-2">
          <button onClick={send} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
            {loading ? 'Sending…' : 'Send Webhook'}
          </button>
        </div>

        {result && (
          <div className="mt-4 p-3 bg-gray-50 border rounded">
            <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WebhookTesterPage() {
  return (
    <PrivateRoute>
      <WebhookTesterView />
    </PrivateRoute>
  );
}
