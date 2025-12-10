import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PrivateRoute from '@/components/PrivateRoute';
import { DashboardSummary, getDashboardSummary } from '@/services/api';
import { showApiError } from '@/hooks/use-toast';

const REFRESH_INTERVAL_MS = 60_000; // refresh every minute

function DashboardView() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDashboardSummary();
      setSummary(data);
    } catch (error) {
      showApiError(error, { fallbackTitle: 'Failed to load dashboard' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
    const id = setInterval(loadSummary, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [loadSummary]);

  const stats = useMemo(() => {
    return {
      totalForms: summary?.total_forms ?? 0,
      totalSubmissions: summary?.total_submissions ?? 0,
      webhookFailures: summary?.webhook_stats?.failed ?? 0,
      webhookPending: summary?.webhook_stats?.pending ?? 0,
    };
  }, [summary]);

  const recent = summary?.recent_submissions ?? [];
  const trend = summary?.trend ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Developer Dashboard</h2>
          <p className="text-sm text-gray-500">Live data from the FormHook backend (auto-refreshes every minute)</p>
        </div>
        <button
          onClick={loadSummary}
          className="px-3 py-2 rounded border text-sm hover:bg-gray-50"
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Forms" value={stats.totalForms} />
        <StatCard label="Total Submissions" value={stats.totalSubmissions} />
        <StatCard label="Webhook Failures" value={stats.webhookFailures} tone="destructive" />
        <StatCard label="Webhook Pending" value={stats.webhookPending} />
      </div>

      <section>
        <h3 className="font-semibold mb-2">7-day Trend</h3>
        <div className="bg-white border rounded p-3 space-y-2 max-h-56 overflow-y-auto">
          {trend.slice(-7).map((day) => (
            <div key={day.date} className="flex justify-between text-sm">
              <span className="text-gray-500">{new Date(day.date).toLocaleDateString()}</span>
              <span className="font-medium">{day.count} submissions</span>
            </div>
          ))}
          {!trend.length && <p className="text-sm text-gray-500">No recent submissions yet.</p>}
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Recent Submissions</h3>
        <div className="space-y-3">
          {loading && <div className="text-sm text-gray-500">Loading…</div>}
          {!loading && !recent.length && <div className="text-sm text-gray-500">No submissions recorded yet.</div>}
          {recent.map((s) => (
            <article key={s.id} className="p-3 border rounded bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-gray-600">{new Date(s.created_at).toLocaleString()}</div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Form {s.form_id}</div>
              </div>
              <div className="mt-2 text-sm space-y-1">
                <div><strong>IP:</strong> {s.ip_address}</div>
                {s.country && (
                  <div>
                    <strong>Location:</strong> {s.city ? `${s.city}, ` : ''}{s.region ? `${s.region}, ` : ''}{s.country}
                  </div>
                )}
                {typeof s.threat_score === 'number' && s.threat_score > 0 && (
                  <div className="text-red-600"><strong>Threat score:</strong> {s.threat_score}</div>
                )}
                <details className="mt-2">
                  <summary className="text-sm text-blue-600 cursor-pointer">View payload</summary>
                  <pre className="mt-2 text-xs whitespace-pre-wrap bg-gray-50 p-2 rounded">{JSON.stringify(s.data, null, 2)}</pre>
                </details>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: number;
  tone?: 'default' | 'destructive';
};

function StatCard({ label, value, tone = 'default' }: StatCardProps) {
  const toneClass = tone === 'destructive' ? 'text-red-600' : 'text-gray-900';
  return (
    <div className="p-4 bg-white border rounded">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

export default function DevDashboardPage() {
  return (
    <PrivateRoute>
      <DashboardView />
    </PrivateRoute>
  );
}
