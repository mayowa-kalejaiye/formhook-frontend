import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardNav from '../../../components/DashboardNav';
import { useSidebar } from '../../../context/SidebarContext';
import StickyDock from '../../../components/StickyDock';
import Footer2 from '../../../components/Footer2';
import BottomGradientRadial from '../../../components/BottomGradientRadial';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/common/Button';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts';
import axios from 'axios';

const presets = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

function getDateRange(days) {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - days + 1);
  return {
    date_from: from.toISOString().slice(0, 10) + 'T00:00:00',
    date_to: to.toISOString().slice(0, 10) + 'T23:59:59',
  };
}

export default function FormAnalytics() {
  const router = useRouter();
  const { formId } = router.query;
  const { isCollapsed } = useSidebar();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preset, setPreset] = useState(30);

  useEffect(() => {
    if (!formId) return;
    setLoading(true);
    setError('');
    const { date_from, date_to } = getDateRange(preset);
    const token = localStorage.getItem('token');
    axios
      .get(`/forms/${formId}/analytics`, {
        baseURL: '',
        headers: { Authorization: `Bearer ${token}` },
        params: { date_from, date_to },
      })
      .then(res => setData(res.data || []))
      .catch(() => setError('Could not load analytics'))
      .finally(() => setLoading(false));
  }, [formId, preset]);

  return (
    <BottomGradientRadial>
      <div className={`min-h-screen flex flex-col ${isCollapsed ? 'md:ml-16' : 'md:ml-56'} transition-all duration-300 ease-in-out`}>
        <DashboardNav />
        <StickyDock />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 pt-8">
          <Card className="mb-8 bg-white/80 dark:bg-black/80 border border-purple-100 shadow">
            <CardHeader>
              <CardTitle>Form Analytics</CardTitle>
              <CardDescription>Submission and delivery analytics for this form.</CardDescription>
              <div className="mt-4 flex gap-2">
                {presets.map(p => (
                  <Button key={p.days} variant={preset === p.days ? 'default' : 'outline'} onClick={() => setPreset(p.days)}>
                    {p.label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center text-purple-400 py-12 animate-pulse">Loading analytics...</div>
              ) : error ? (
                <div className="text-center text-red-500 py-12">{error}</div>
              ) : data.length === 0 ? (
                <div className="text-center text-purple-400 py-12">No analytics data for this range.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Chart 1: Line Chart for submissions and failed_webhooks */}
                  <div>
                    <div className="font-semibold mb-2">Submissions & Failed Webhooks</div>
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#a78bfa' }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#a78bfa' }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="submissions" stroke="#6366f1" strokeWidth={2} dot={false} name="Submissions" />
                        <Line type="monotone" dataKey="failed_webhooks" stroke="#f43f5e" strokeWidth={2} dot={false} name="Failed Webhooks" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Chart 2: Area Chart for emails_sent and unique_ips */}
                  <div>
                    <div className="font-semibold mb-2">Emails Sent & Unique IPs</div>
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#a78bfa' }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#a78bfa' }} />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="emails_sent" stackId="1" stroke="#7c3aed" fill="#a78bfa55" name="Emails Sent" />
                        <Area type="monotone" dataKey="unique_ips" stackId="1" stroke="#10b981" fill="#10b98133" name="Unique IPs" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
        <Footer2 />
      </div>
    </BottomGradientRadial>
  );
}
