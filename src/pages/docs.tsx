"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SEO from '@/components/SEO';
import BottomGradientRadial from '@/components/BottomGradientRadial';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Box,
  CheckCircle2,
  Code2,
  Copy,
  Cpu,
  ExternalLink,
  FileCode2,
  GitBranch,
  Layers,
  LifeBuoy,
  PlugZap,
  PlayCircle,
  Server,
  Shield,
  ShieldCheck,
  Sparkle,
  TrendingUp,
  Workflow
} from 'lucide-react';

type ApiHealthState = {
  status: string;
  latencyMs?: number | null;
  region?: string | null;
  updatedAt?: string | null;
};

const lastUpdated = 'December 10, 2025';

const docNav = [
  { title: 'Overview', href: '#overview' },
  { title: 'Quick actions', href: '#quick-actions' },
  { title: 'FAQ', href: '#faq' },
  {
    title: 'Getting started',
    href: '#getting-started',
    children: [
      { title: 'Hero path', href: '#hero-path' },
      { title: 'Embeds & SDKs', href: '#embeds' },
      { title: 'Local development', href: '#local-dev' }
    ]
  },
  { title: 'API & code', href: '#api-reference' },
  { title: 'Dashboard & analytics', href: '#dashboard-analytics' },
  { title: 'Automations & webhooks', href: '#automations' },
  { title: 'Notifications & governance', href: '#notifications' },
  { title: 'Operations', href: '#operations' },
  { title: 'Reliability', href: '#reliability' },
  { title: 'Security & compliance', href: '#security' },
  { title: 'Troubleshooting', href: '#troubleshooting' },
  { title: 'Resources', href: '#resources' }
];

const whatsInDoc = [
  {
    title: 'Implementation guides',
    description: 'Wire forms, SDKs, automations, and alerts in one place.',
    icon: Code2
  },
  {
    title: 'Operational playbooks',
    description: 'Dashboards, quotas, and escalation tips for non-devs.',
    icon: Workflow
  },
  {
    title: 'Security notes',
    description: 'Compliance controls, webhook signatures, and retention.',
    icon: Shield
  }
];

const statusQuickLinks = [
  { label: 'Status history', href: 'https://status.formhookapp.com', external: true },
  { label: 'Incident hub', href: 'https://formhook.notion.site/FormHook-Incident-Hub-e2f1be6e21da475b9c8b6d4ddad0f8d7', external: true },
  { label: 'Contact support', href: 'mailto:support@formhookapp.com', external: true }
];

const quickActionCards = [
  {
    title: 'Get started fast',
    description: 'Provision a form slug, set sandbox secrets, and ship your first payload.',
    href: '#hero-path',
    label: 'Launch checklist'
  },
  {
    title: 'Jump to API',
    description: 'Use REST + webhook references with schemas, limits, and examples.',
    href: '#api-reference',
    label: 'Open reference'
  },
  {
    title: 'Guides for non-devs',
    description: 'Dashboards, alerts, and runbooks tailored for ops, support, and success.',
    href: '#operations',
    label: 'View playbooks'
  }
];

const heroPathSteps = [
  {
    title: 'Provision a form slug',
    description: 'Create a project or call POST /v1/forms to mint IDs plus signing secrets for every environment.',
    learnHref: '/dashboard?modal=new-form',
    icon: PlugZap
  },
  {
    title: 'Embed or proxy submissions',
    description: 'Point HTML forms, React hooks, or Server Actions at https://api.formhookapp.com/f/<id> with CORS + spam guardrails.',
    learnHref: '#embeds',
    icon: Code2
  },
  {
    title: 'Fan out automation',
    description: 'Attach Slack, CRM, or custom webhooks. Durable queues replay automatically with HMAC signatures.',
    learnHref: '#automations',
    icon: GitBranch
  },
  {
    title: 'Measure + govern',
    description: 'Use dashboards for live health, set retention rules, and export audit logs for governance teams.',
    learnHref: '#dashboard-analytics',
    icon: CheckCircle2
  }
];

const embedOptions = [
  {
    label: 'Drop-in HTML form',
    description: 'Great for marketing pages and Jamstack exports. No build tooling required.',
    snippet: `<form action="https://api.formhookapp.com/f/your-form-id" method="POST">
  <input type="email" name="email" required />
  <button type="submit">Notify me</button>
</form>`
  },
  {
    label: 'React Hook Form handler',
    description: 'Keep validation inside React and proxy to FormHook once inputs pass.',
    snippet: `const onSubmit = handleSubmit(async (values) => {
  const res = await fetch('https://api.formhookapp.com/f/your-form-id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values)
  });
  if (!res.ok) throw new Error('submission failed');
});`
  },
  {
    label: 'cURL smoke test',
    description: 'Verify networking from preview environments or CI pipelines.',
    snippet: `curl -X POST https://api.formhookapp.com/f/your-form-id \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@formhookapp.com","source":"docs"}'`
  }
];

const localDevChecklist = [
  {
    title: 'Use sandbox credentials',
    detail: 'Create sandbox project tokens and load them into .env before running npm run dev.',
    tip: 'Never paste production secrets into git history.'
  },
  {
    title: 'Proxy through Next.js handlers',
    detail: 'Route client submissions via Route Handlers so secrets stay server-side and cookies remain HTTP-only.',
    tip: 'Leverage Next middleware for auth, rate limits, and logging.'
  },
  {
    title: 'Verify signatures early',
    detail: 'Use identical HMAC helpers locally so prod payloads never surprise you.',
    tip: 'Log headers plus the raw body to trace mismatches safely.'
  }
];

const developerGuides = [
  {
    title: 'REST API reference',
    description: 'CRUD for forms, submissions, secrets, and delivery settings with scopes + schemas.',
    link: 'https://api.formhookapp.com/docs'
  },
  {
    title: 'Framework recipes',
    description: 'Next.js App Router, Remix loaders, and Laravel controllers you can paste in.',
    link: '/api-integration'
  },
  {
    title: 'Validation & filtering',
    description: 'Server transforms, zod/Valibot helpers, and spam heuristics before persistence.',
    link: '/api-integration#validation'
  },
  {
    title: 'Observability hooks',
    description: 'Send traces to OpenTelemetry, Honeycomb, or Datadog with structured spans.',
    link: '/analytics'
  }
];

const codeTabSamples = [
  {
    value: 'html',
    label: 'HTML',
    language: 'html',
    request: `<form action="https://api.formhookapp.com/f/frm_live_123" method="POST">
  <input name="email" type="email" required />
  <button type="submit">Notify me</button>
</form>`,
    response: 'HTTP/1.1 302 Accepted\nLocation: https://formhookapp.com/success',
    description: 'Use pure HTML for marketing pages or static exports.'
  },
  {
    value: 'react',
    label: 'React',
    language: 'tsx',
    request: `const onSubmit = async (values: FormValues) => {
  const res = await fetch('https://api.formhookapp.com/f/frm_live_123', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values)
  });
  if (!res.ok) throw new Error('submission failed');
  return res.json();
};`,
    response: `{
  "status": "accepted",
  "submission_id": "sub_8d91f",
  "received_at": "2025-12-10T15:42:11Z"
}`,
    description: 'Pair with React Hook Form or custom hooks.'
  },
  {
    value: 'curl',
    label: 'cURL',
    language: 'bash',
    request: `curl -X POST https://api.formhookapp.com/f/frm_live_123 \
  -H 'Content-Type: application/json' \
  -d '{"email":"ops@formhookapp.com","source":"docs"}'`,
    response: `{
  "status": "accepted",
  "retry": false
}`,
    description: 'Smoke test networking from CI/CD or preview stacks.'
  },
  {
    value: 'next',
    label: 'Next.js',
    language: 'ts',
    request: `export async function submit(formData: FormData) {
  const payload = Object.fromEntries(formData);
  const res = await fetch('https://api.formhookapp.com/f/frm_live_123', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('form submission failed');
  return res.json();
}`,
    response: `{
  "ok": true,
  "queued_at": "2025-12-10T15:42:11Z"
}`,
    description: 'Use Route Handlers or Server Actions to keep secrets server-side.'
  }
];

const dashboardHighlights = [
  {
    title: 'Live submission timeline',
    description: 'Filter by form, source, or environment to spot spikes before they threaten SLAs.',
    stat: '<200ms median ingest latency',
    icon: TrendingUp
  },
  {
    title: 'Attribution layers',
    description: 'Slice by UTM, device class, or geo so GTM partners see what is working.',
    stat: '15+ built-in dimensions',
    icon: Layers
  },
  {
    title: 'Error budgets',
    description: 'Track webhook failures, API throttles, and spam catches with CSV exports.',
    stat: 'Realtime breach alerts',
    icon: Cpu
  }
];

const webhookGuides = [
  {
    title: 'Treat webhooks as code',
    summary: 'Store definitions in git or Terraform so every environment matches production.',
    steps: [
      'Name each destination clearly (crm-prod, slack-alerts, etc.).',
      'Rotate signing secrets quarterly through your secret manager.',
      'Use PATCH /v1/forms/{id}/webhooks to sync infrastructure changes.'
    ]
  },
  {
    title: 'Stay resilient',
    summary: 'Durable queues never drop payloads, but good hygiene shortens recovery time.',
    steps: [
      'Watch retry counts in the dashboard or GET /v1/webhooks/{id}/attempts.',
      'Pause noisy destinations instead of deleting them to keep replay context.',
      'Use exponential backoff with jitter on receivers to prevent thundering herds.'
    ]
  },
  {
    title: 'Secure delivery',
    summary: 'Every payload ships with HMAC headers so authenticity is easy to prove.',
    steps: [
      'Reject mismatched signatures immediately and log the checksum.',
      'Regenerate secrets via POST /v1/webhooks/{id}/rotate without downtime.',
      'Store payload digests for post-incident forensics.'
    ]
  }
];

const notificationTips = [
  {
    title: 'Channel priorities',
    detail: 'Urgent submissions land in Slack/Teams; audits arrive as daily email digests.'
  },
  {
    title: 'Digest windows',
    detail: 'Batch lower-priority forms hourly to keep inboxes calm.'
  },
  {
    title: 'Role-based visibility',
    detail: 'Share notification rules so finance only sees invoices while support handles incidents.'
  }
];

const operatorJourneys = [
  {
    title: 'Teams & permissions',
    summary: 'Granular roles for collaborators, auditors, and contractors with scoped tokens.'
  },
  {
    title: 'Workflow automation',
    summary: 'Trigger approvals, CRM updates, or nurture drips from a single POST /v1/automations.'
  },
  {
    title: 'Data governance',
    summary: 'Retention windows, redaction jobs, and export logging for compliance partners.'
  },
  {
    title: 'Insights for managers',
    summary: 'Dashboards explain region/device trends and API health in plain language.'
  }
];

const reliabilityCommitments = [
  {
    title: 'Global edge intake',
    content: '20+ Anycast regions dedupe, encrypt, and queue traffic before it touches storage.'
  },
  {
    title: 'Retry-first delivery engine',
    content: 'Each webhook keeps exponential backoff with jitter, regenerated signatures, and diff snapshots.'
  },
  {
    title: 'Audit-ready storage',
    content: 'Submissions live in encrypted partitions with per-customer keys and queryable access logs.'
  },
  {
    title: 'Transparent roadmaps',
    content: 'Weekly changelogs, public RFCs, and migration kits ahead of GA changes.'
  }
];

const securityFocus = [
  {
    title: 'Regional processing',
    detail: 'Choose US or EU ingestion to satisfy residency requirements and minimize latency.'
  },
  {
    title: 'Role-aware dashboards',
    detail: 'SSO + scoped API tokens restrict who can view PII or rotate secrets.'
  },
  {
    title: 'Data lifecycle controls',
    detail: 'Apply retention policies, redaction jobs, and automated exports so records never outstay policy.'
  }
];

const troubleshootingGuides = [
  {
    title: 'Webhook 410 responses',
    symptom: 'Downstream service removed an endpoint and retries began to fail.',
    resolution: 'Pause the destination, patch the URL, then replay from the dashboard to backfill submissions.'
  },
  {
    title: 'Unexpected spam spikes',
    symptom: 'Submission counts surge while conversion KPIs fall.',
    resolution: 'Enable honeypot fields, IP throttles, and review the spam queue before escalating.'
  },
  {
    title: 'Signature mismatch',
    symptom: 'Your server rejects HMAC headers after a deploy.',
    resolution: 'Confirm the raw body stays unparsed, double-check UTF-8 encoding, and rotate secrets if compromise is suspected.'
  }
];

const diagramCards = [
  {
    title: 'Ingestion flow',
    description: 'Clients hit Anycast edge nodes, payloads queue durably, then land in your timeline.',
    nodes: ['Client form', 'Edge intake', 'Durable queue', 'Timeline'],
    accent: 'from-sky-500/30 via-blue-500/20 to-indigo-500/10'
  },
  {
    title: 'Webhook retry ladder',
    description: 'Retries escalate with jitter while signatures regenerate for every attempt.',
    nodes: ['Attempt 1', 'Backoff', 'Queue', 'Destination'],
    accent: 'from-amber-500/30 via-orange-500/20 to-red-500/10'
  }
];

const faqEntries = [
  {
    q: 'What environments are available?',
    a: 'Every workspace gets a sandbox token and a production token, so you can wire QA or preview traffic without touching live data. Broader workspace controls are on the roadmap—ping us if you need early access.',
    ctaLabel: 'Manage tokens',
    ctaHref: '/api-tokens'
  },
  {
    q: 'How do I keep secrets safe?',
    a: 'Client code never needs private keys. Proxy submissions through server actions, verify HMAC headers, and rotate secrets quarterly.',
    ctaLabel: 'Read security guide',
    ctaHref: '#security'
  },
  {
    q: 'Can I import existing submissions?',
    a: 'Bulk import tooling is coming soon. For now, email support and we will help load CSV exports or replay submissions on your behalf.',
    ctaLabel: 'Contact support',
    ctaHref: 'mailto:support@formhookapp.com?subject=FormHook%20Import%20Assist'
  },
  {
    q: 'Do you support HIPAA or GDPR?',
    a: 'Infrastructure stays encrypted, regional residency is available, and field-level masking plus retention rules meet most regulator requirements.',
    ctaLabel: 'Talk to support',
    ctaHref: 'mailto:support@formhookapp.com?subject=FormHook%20Compliance'
  }
];

const resourceLinks = [
  {
    label: 'API integration guide',
    href: '/api-integration',
    description: 'End-to-end tutorial for wiring FormHook into your stack.'
  },
  {
    label: 'Product release notes',
    href: 'https://formhook.notion.site/FormHook-Release-Notes-ccf3cae43b9546a5a62a4b4e0a1d73e7',
    description: 'Track the latest launches, fixes, and roadmap context.',
    external: true
  },
  {
    label: 'Billing & seats',
    href: '/account?tab=billing',
    description: 'Manage invoices, seats, and SSO policies from one screen.'
  },
  {
    label: 'Support desk',
    href: 'mailto:support@formhookapp.com',
    description: 'Escalate incidents or schedule enterprise reviews.'
  }
];

const operatorCallout = {
  title: 'Operator tips',
  bullets: [
    'Pin error budgets to #oncall so incident responders see deltas instantly.',
    'Use hourly digests for low-priority forms to keep inboxes calm.',
    'Export CSV snapshots weekly so finance and CX can reconcile conversions.'
  ]
};

const securityCallout = {
  title: 'Security notes',
  bullets: [
    'All webhook payloads include SHA-256 HMAC headers signed per destination.',
    'PII can be masked automatically before it hits downstream systems.',
    'Regional residency controls are in planning—tell support if your workload requires data to stay in a specific region.'
  ]
};

function DocsPage() {
  const [apiHealth, setApiHealth] = useState<ApiHealthState>({ status: 'Checking…' });
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchHealth = async () => {
      try {
        const response = await fetch('https://api.formhookapp.com/health');
        const data = await response.json();

        if (!isMounted) {
          return;
        }

        setApiHealth({
          status: data?.status ?? 'Operational',
          latencyMs: data?.latency_ms ?? data?.latency ?? null,
          region: data?.region ?? null,
          updatedAt: data?.checked_at ?? new Date().toISOString()
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setApiHealth((prev) => ({
          status: prev.status === 'Checking…' ? 'Operational (cached)' : prev.status,
          latencyMs: prev.latencyMs ?? null,
          region: prev.region ?? null,
          updatedAt: prev.updatedAt ?? new Date().toISOString()
        }));
      } finally {
        if (isMounted) {
          setHealthLoading(false);
        }
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 60_000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const statusColor = useMemo(() => {
    if (apiHealth.status.toLowerCase().includes('degraded')) {
      return 'bg-amber-500';
    }
    if (apiHealth.status.toLowerCase().includes('incident')) {
      return 'bg-red-500';
    }
    return 'bg-emerald-500';
  }, [apiHealth.status]);

  return (
    <>
      <SEO title="FormHook Documentation" description="Implementation guides, API references, governance tips, and real-world playbooks for teams shipping on FormHook." />
      <BottomGradientRadial>
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/70 px-4 py-3 text-sm" aria-label="Docs metadata banner">
              <div className="flex items-center gap-2">
                <span className={`inline-flex h-2.5 w-2.5 rounded-full ${statusColor}`} />
                <span className="font-semibold">API status:</span>
                <span>{apiHealth.status}</span>
                {apiHealth.latencyMs ? <span className="text-slate-500">({apiHealth.latencyMs} ms)</span> : null}
              </div>
              <div className="text-slate-500">Docs last updated {lastUpdated}</div>
            </div>

            <section id="overview" className="rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-800 text-white p-8 md:p-12 shadow-2xl">
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-wide">
                    <BookOpen className="h-3.5 w-3.5" /> Doc control center
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black leading-tight">Operate every FormHook workflow from one mission control.</h1>
                  <p className="text-lg text-white/70 max-w-2xl">
                    Build forms, watch ingest health, wire automations, and brief operators without bouncing between tabs. This playbook keeps developers and stakeholders in sync.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button asChild className="bg-blue-500 hover:bg-blue-400 text-white text-base px-6 py-5">
                      <Link href="/api-integration">
                        Explore API
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-base px-6 py-5">
                      <Link href="/dashboard">
                        Open dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3" aria-label="What's in this doc">
                    {whatsInDoc.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.title} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <Icon className="h-4 w-4 text-blue-200" />
                            {item.title}
                          </div>
                          <p className="mt-2 text-xs text-white/70">{item.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-3xl bg-white/10 border border-white/20 p-6 space-y-6" aria-label="API status card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/70">Current API health</p>
                      <p className="text-2xl font-semibold mt-1">{apiHealth.status}</p>
                    </div>
                    <div className="rounded-full bg-white/20 p-3">
                      <Activity className="h-5 w-5" />
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-white/60">Latency</dt>
                      <dd className="text-lg font-semibold">{apiHealth.latencyMs ? `${apiHealth.latencyMs} ms` : healthLoading ? 'Checking…' : 'n/a'}</dd>
                    </div>
                    <div>
                      <dt className="text-white/60">Region</dt>
                      <dd className="text-lg font-semibold">{apiHealth.region ?? 'Global edge'}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-white/60">Last checked</dt>
                      <dd className="text-sm font-medium">{apiHealth.updatedAt ? new Date(apiHealth.updatedAt).toLocaleTimeString() : 'Just now'}</dd>
                    </div>
                  </dl>
                  <div className="space-y-2">
                    {statusQuickLinks.map((link) => (
                      <a key={link.label} href={link.href} target={link.external ? '_blank' : undefined} rel={link.external ? 'noreferrer' : undefined} className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 px-3 py-2 text-sm hover:bg-white/10">
                        <span>{link.label}</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section id="quick-actions" className="space-y-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wide">
                <PlayCircle className="h-4 w-4" /> Quick links
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {quickActionCards.map((card) => (
                  <Card key={card.title} className="border border-slate-200 dark:border-slate-800 h-full">
                    <CardHeader>
                      <CardTitle className="text-xl">{card.title}</CardTitle>
                      <CardDescription>{card.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href={card.href} className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2 text-sm font-semibold dark:bg-white dark:text-slate-900">
                        {card.label}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section id="faq" className="space-y-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wide">
                <Sparkle className="h-4 w-4" /> First answers
              </div>
              <div className="grid gap-4">
                {faqEntries.map((item) => (
                  <details key={item.q} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/70 p-4">
                    <summary className="flex items-center justify-between gap-4 cursor-pointer">
                      <span className="text-lg font-semibold">{item.q}</span>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </summary>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{item.a}</p>
                    {item.ctaHref ? (
                      item.ctaHref.startsWith('mailto:') ? (
                        <a href={item.ctaHref} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-300">
                          {item.ctaLabel}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <Link href={item.ctaHref} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-300">
                          {item.ctaLabel}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )
                    ) : null}
                  </details>
                ))}
              </div>
            </section>

            <div className="lg:hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">On this page</p>
              <div className="grid gap-2">
                {docNav.map((item) => (
                  <Link key={item.title} href={item.href} className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm">
                    <span>{item.title}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-12">
              <aside className="hidden lg:block">
                <div className="sticky top-28 space-y-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">On this page</p>
                  <nav className="space-y-3 text-sm font-medium">
                    {docNav.map((item) => (
                      <div key={item.title} className="space-y-2">
                        <Link href={item.href} className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 px-3 py-2 hover:border-blue-500">
                          <span>{item.title}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                        {item.children ? (
                          <div className="space-y-1 border-l border-slate-200 dark:border-slate-800 pl-3">
                            {item.children.map((child) => (
                              <Link key={child.title} href={child.href} className="block text-slate-500 hover:text-blue-600">
                                {child.title}
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </nav>
                </div>
              </aside>

              <div className="space-y-16">
                <DocSection id="getting-started" eyebrow="Start here" title="Getting FormHook wired into your stack" summary="Use these blueprints to cover creation, embeds, automation, and operations without guesswork.">
                  <div id="hero-path" className="space-y-8">
                    <h3 className="text-xl font-semibold">Hero path timeline</h3>
                    <div className="space-y-6">
                      {heroPathSteps.map((step, index) => {
                        const Icon = step.icon;
                        return (
                          <div key={step.title} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-semibold">{index + 1}</div>
                              {index < heroPathSteps.length - 1 ? <div className="flex-1 w-px bg-slate-200 dark:bg-slate-800" /> : null}
                            </div>
                            <Card className="flex-1 border border-slate-200 dark:border-slate-800">
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                  <Icon className="h-5 w-5 text-blue-500" />
                                  {step.title}
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <p className="text-sm text-slate-600 dark:text-slate-300">{step.description}</p>
                                <Link href={step.learnHref} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-300">
                                  Learn more
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                              </CardContent>
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </DocSection>

                <DocSection id="embeds" eyebrow="Embeds & SDKs" title="Pick the integration style that fits" summary="Drop-in HTML works for marketing teams, while React, cURL, and server actions keep developers productive.">
                  <div className="grid gap-6 md:grid-cols-3">
                    {embedOptions.map((option) => (
                      <Card key={option.label} className="border border-slate-200 dark:border-slate-800">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Code2 className="h-4 w-4 text-indigo-500" />
                            {option.label}
                          </CardTitle>
                          <CardDescription>{option.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <pre className="rounded-xl bg-slate-900 text-slate-100 text-xs p-4 overflow-auto">
{option.snippet}
                          </pre>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DocSection>

                <DocSection id="local-dev" eyebrow="Local development" title="Checklist before you push" summary="Mirror production behavior in preview builds so shipping day has no surprises.">
                  <div className="grid gap-6 md:grid-cols-3">
                    {localDevChecklist.map((item) => (
                      <Card key={item.title} className="border border-slate-200 dark:border-slate-800 h-full">
                        <CardHeader>
                          <CardTitle className="text-base">{item.title}</CardTitle>
                          <CardDescription>{item.detail}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{item.tip}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DocSection>

                <DocSection id="api-reference" eyebrow="Developers" title="Deep technical reference" summary="Endpoints, SDK notes, schemas, and rate limits—everything required to automate FormHook.">
                  <div className="grid gap-6 md:grid-cols-2">
                    {developerGuides.map((guide) => (
                      <Card key={guide.title} className="border border-slate-200 dark:border-slate-800 h-full">
                        <CardHeader>
                          <CardTitle className="text-xl flex items-center gap-2">
                            <Code2 className="h-5 w-5 text-blue-500" />
                            {guide.title}
                          </CardTitle>
                          <CardDescription>{guide.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button asChild variant="link" className="px-0">
                            <Link href={guide.link}>
                              Open section
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <CodeTabs />
                  <div className="grid gap-6 md:grid-cols-2">
                    {diagramCards.map((diagram) => (
                      <FlowDiagram key={diagram.title} {...diagram} />
                    ))}
                  </div>
                </DocSection>

                <DocSection id="dashboard-analytics" eyebrow="Dashboards" title="Analytics operators trust" summary="Real-time charts make it easy to coach support, marketing, and product teams.">
                  <div className="grid gap-6 md:grid-cols-3">
                    {dashboardHighlights.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Card key={item.title} className="border border-slate-200 dark:border-slate-800 h-full">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Icon className="h-5 w-5 text-indigo-500" />
                              {item.title}
                            </CardTitle>
                            <CardDescription>{item.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xs font-semibold text-slate-500">{item.stat}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </DocSection>

                <DocSection id="automations" eyebrow="Automations & webhooks" title="Design resilient downstream workflows" summary="Use these habits to keep every destination current, secure, and observable.">
                  <div className="space-y-6">
                    {webhookGuides.map((guide) => (
                      <Card key={guide.title} className="border border-slate-200 dark:border-slate-800">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <GitBranch className="h-5 w-5 text-blue-500" />
                            {guide.title}
                          </CardTitle>
                          <CardDescription>{guide.summary}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
                            {guide.steps.map((step) => (
                              <li key={step}>{step}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DocSection>

                <DocSection id="notifications" eyebrow="Notifications" title="Keep the right people in the loop" summary="Pair real-time alerts with digest reports so teams stay informed without burnout.">
                  <div className="grid gap-6 md:grid-cols-3">
                    {notificationTips.map((tip) => (
                      <Card key={tip.title} className="border border-slate-200 dark:border-slate-800 h-full">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <LifeBuoy className="h-5 w-5 text-emerald-500" />
                            {tip.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-600 dark:text-slate-300">{tip.detail}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <CalloutCard title={operatorCallout.title} bullets={operatorCallout.bullets} />
                </DocSection>

                <DocSection id="operations" eyebrow="For every teammate" title="Operational guides for non-developers" summary="Customer success, growth, and ops teams rely on FormHook to keep submissions flowing.">
                  <div className="grid gap-6 md:grid-cols-2">
                    {operatorJourneys.map((journey) => (
                      <Card key={journey.title} className="border border-slate-200 dark:border-slate-800 h-full">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Workflow className="h-5 w-5 text-indigo-500" />
                            {journey.title}
                          </CardTitle>
                          <CardDescription>{journey.summary}</CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </DocSection>

                <DocSection id="reliability" eyebrow="Reliability" title="Under-the-hood commitments" summary="Your forms are business critical. Here is how the platform keeps them safe.">
                  <div className="grid gap-6 md:grid-cols-2">
                    {reliabilityCommitments.map((item) => (
                      <Card key={item.title} className="border border-slate-200 dark:border-slate-800 h-full">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-emerald-500" />
                            {item.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DocSection>

                <DocSection id="security" eyebrow="Security" title="Controls security teams expect" summary="Share this section with your GRC partners to speed up reviews.">
                  <div className="grid gap-6 md:grid-cols-3">
                    {securityFocus.map((item) => (
                      <Card key={item.title} className="border border-slate-200 dark:border-slate-800 h-full">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-sky-500" />
                            {item.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-600 dark:text-slate-300">{item.detail}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <CalloutCard title={securityCallout.title} bullets={securityCallout.bullets} />
                </DocSection>

                <DocSection id="troubleshooting" eyebrow="Runbooks" title="Battle-tested responses" summary="Copy these playbooks when things get noisy. Each one keeps on-call engineers and ops managers aligned.">
                  <div className="grid gap-6 md:grid-cols-3">
                    {troubleshootingGuides.map((guide) => (
                      <Card key={guide.title} className="border border-slate-200 dark:border-slate-800 h-full">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Server className="h-5 w-5 text-orange-500" />
                            {guide.title}
                          </CardTitle>
                          <CardDescription>{guide.symptom}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-600 dark:text-slate-300">{guide.resolution}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DocSection>

                <DocSection id="resources" eyebrow="Resources" title="Bookmark the next steps" summary="These links stay in sync with the product so your team has a single source of truth for integrations, governance, and support.">
                  <div className="grid gap-4 md:grid-cols-2">
                    {resourceLinks.map((resource) => (
                      <Card key={resource.label} className="border border-slate-200 dark:border-slate-800">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Box className="h-5 w-5 text-indigo-500" />
                            {resource.label}
                          </CardTitle>
                          <CardDescription>{resource.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {resource.href.startsWith('mailto:') ? (
                            <a href={resource.href} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-300">
                              {resource.external ? 'Open in mail' : 'Open'}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </a>
                          ) : resource.external ? (
                            <a href={resource.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-300">
                              Open
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <Link href={resource.href} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-300">
                              Open
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 p-8 space-y-4 text-center">
                    <h4 className="text-2xl font-bold">Build confidently on FormHook</h4>
                    <p className="text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
                      This page updates with every major release. Bookmark it, share it with teammates, and treat it as your go-to source of truth.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      <Button asChild className="bg-blue-600 hover:bg-blue-700">
                        <Link href="/dashboard">
                          Jump to dashboard
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href="/api-integration">Explore API guide</Link>
                      </Button>
                      <Button asChild variant="ghost">
                        <Link href="/analytics">See analytics in action</Link>
                      </Button>
                    </div>
                  </div>
                </DocSection>
              </div>
            </div>
          </div>
        </main>
      </BottomGradientRadial>
    </>
  );
}

type DocSectionProps = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  children: React.ReactNode;
};

function DocSection({ id, eyebrow, title, summary, children }: DocSectionProps) {
  return (
    <section id={id} className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{eyebrow}</p>
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="text-slate-600 dark:text-slate-300">{summary}</p>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

type FlowDiagramProps = {
  title: string;
  description: string;
  nodes: string[];
  accent: string;
};

function FlowDiagram({ title, description, nodes, accent }: FlowDiagramProps) {
  return (
    <Card className="border border-slate-200 dark:border-slate-800 h-full">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileCode2 className="h-4 w-4 text-indigo-500" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`rounded-2xl border border-slate-100 dark:border-slate-800 bg-gradient-to-r ${accent} p-4 text-xs font-semibold text-slate-800 dark:text-slate-100`}> 
          <div className="flex flex-wrap items-center gap-2">
            {nodes.map((node, idx) => (
              <React.Fragment key={node}>
                <span className="rounded-full bg-white/70 dark:bg-slate-900/70 px-3 py-1 shadow-sm">{node}</span>
                {idx < nodes.length - 1 ? <ArrowRight className="h-3 w-3 text-slate-600" /> : null}
              </React.Fragment>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type CalloutCardProps = {
  title: string;
  bullets: string[];
};

function CalloutCard({ title, bullets }: CalloutCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-blue-50 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CodeTabs() {
  const [activeTab, setActiveTab] = useState(codeTabSamples[0].value);

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Code samples</h3>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-2 bg-slate-100/80 dark:bg-slate-900/40 p-2 rounded-2xl">
          {codeTabSamples.map((sample) => (
            <TabsTrigger key={sample.value} value={sample.value} className="rounded-xl">
              {sample.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {codeTabSamples.map((sample) => (
          <TabsContent key={sample.value} value={sample.value} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-sm font-semibold">{sample.description}</p>
                <p className="text-xs text-slate-400">Language: {sample.language}</p>
              </div>
              <CopyButton value={sample.request} />
            </div>
            <pre className="overflow-auto rounded-2xl bg-black/40 p-4 text-sm">
{sample.request}
            </pre>
            <div className="text-xs uppercase tracking-wide text-slate-400">Expected response</div>
            <pre className="overflow-auto rounded-2xl bg-white/10 text-white p-4 text-sm">
{sample.response}
            </pre>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

type CopyButtonProps = {
  value: string;
};

function CopyButton({ value }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      setCopied(false);
    }
  };

  return (
    <button type="button" onClick={handleCopy} className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold">
      <Copy className="h-3.5 w-3.5" />
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default DocsPage;
