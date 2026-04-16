"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import AuthLayout from '../components/AuthLayout';
import DashboardNav from '../components/DashboardNav';
import BottomGradientRadial from '../components/BottomGradientRadial';
import { useSidebar } from '../context/SidebarContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { useToast } from '../hooks/use-toast';
import {
  LifeBuoy,
  Mail,
  MessageSquare,
  BookOpen,
  Shield,
  PhoneCall,
  Clock,
  Activity,
  Zap,
  HelpCircle,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';

const supportChannels = [
  {
    title: 'Priority Support Tickets',
    description: 'Direct inbox temporarily paused while we realign routing on formhookapp.com.',
    metric: 'Reopening soon',
    icon: LifeBuoy,
    href: null,
    action: 'Support temporarily paused'
  },
  {
    title: 'Live Incident Desk',
    description: 'Live status feed is on hold while we migrate telemetry to the new domain.',
    metric: 'Status page paused',
    icon: Zap,
    href: null,
    action: 'Status feed on hold'
  },
  {
    title: 'Knowledge Base & Community',
    description: 'Deep dives, recipes, and verified answers shared by the FormHook community team.',
    metric: '200+ articles & playbooks',
    icon: BookOpen,
    href: '/docs',
    action: 'Browse docs'
  }
];

const statusFeed = [
  { label: 'Submission API', status: 'Operational', updated: '5m ago' },
  { label: 'Webhook Delivery', status: 'Degraded latency', updated: '18m ago' },
  { label: 'Dashboard & Auth', status: 'Operational', updated: '43m ago' },
];

const faqItems = [
  {
    question: 'How fast will someone reply to a critical ticket?',
    answer:
      'P1 and P2 tickets page the on-call engineer instantly. You will receive an initial human response within 15 minutes and rolling updates every 30 minutes until resolved.'
  },
  {
    question: 'Can you jump on a call to debug a webhook failure?',
    answer:
      'Yes. Include "Request live call" in the ticket body and share preferred meeting links. For enterprise plans we host a standing Bridge room for extended incidents.'
  },
  {
    question: 'Where can I track active incidents or maintenance windows?',
    answer:
      'Our public status feed is on hold during the formhookapp.com migration. Watch in-app banners or the docs changelog for the latest updates.'
  },
  {
    question: 'Do you offer hands-on onboarding?',
    answer:
      'Starter customers can book a 30-minute kickoff. Professional and above get white-glove onboarding plus architecture reviews as part of the subscription.'
  }
];

const resourceLinks = [
  { label: 'Delivery Troubleshooting Guide', href: '/docs/webhooks/delivery-playbook' },
  { label: 'API Reference', href: '/api-integration' },
  { label: 'Security & Compliance', href: '/docs/security' },
];

const responseStats = [
  { label: 'Avg first reply', value: '11 min', helper: '↓ 4 min vs last week' },
  { label: 'Hands-on resolutions', value: '92%', helper: 'Solved without escalation' },
  { label: 'Live bridge uptime', value: '24/7', helper: 'Pager rotation active' },
];

const pagerSignals = [
  { label: 'Pager duty window', value: 'Always-on critical response', icon: Activity },
  { label: 'SLA guardians', value: 'Senior engineer + success partner', icon: Shield },
  { label: 'Concierge hotline', value: 'Escalate via voice or Slack Connect', icon: PhoneCall },
];

type SupportFormValues = {
  subject: string;
  email: string;
  urgency: 'low' | 'normal' | 'urgent';
  message: string;
  includeLogs: boolean;
};

function HelpDeskContent() {
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<SupportFormValues>({
    defaultValues: {
      subject: '',
      email: '',
      urgency: 'normal',
      message: '',
      includeLogs: true
    }
  });

  const onSubmit = async (values: SupportFormValues) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    toast({
      title: 'Ticket drafted',
      description: 'We logged your request and will reply by email shortly.'
    });
    reset();
  };

  return (
    <BottomGradientRadial>
      <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 ${isCollapsed ? 'md:ml-16' : 'md:ml-64'} transition-all duration-300`}>
        <DashboardNav />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-12">
          <section className="relative overflow-hidden rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 shadow-2xl p-8 md:p-12">
            <div className="absolute inset-0 pointer-events-none opacity-70" aria-hidden>
              <div className="absolute -top-16 -right-10 h-72 w-72 bg-gradient-to-br from-blue-500/40 via-indigo-500/30 to-transparent blur-3xl" />
              <div className="absolute bottom-0 left-0 h-64 w-64 bg-gradient-to-tr from-purple-500/30 via-blue-500/20 to-transparent blur-3xl" />
            </div>
            <div className="relative grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-stretch">
              <div className="space-y-6">
                <Badge variant="outline" className="w-fit border-blue-200 text-blue-700 dark:border-blue-900/60 dark:text-blue-100 uppercase tracking-wide text-xs">
                  Help desk command
                </Badge>
                <div className="space-y-4">
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                    Human engineers, on standby for your production forms.
                  </h1>
                  <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
                    Raise a ticket, jump on a bridge, or audit the live status feed&mdash;without leaving FormHook.
                    Our response team pairs on-call engineers with customer success so every incident ships with context.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {responseStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white/80 dark:bg-white/5 px-4 py-3 shadow-sm"
                    >
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-semibold text-slate-900 dark:text-white">{stat.value}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">{stat.helper}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/docs/webhooks/delivery-playbook">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Browse playbooks
                    </Link>
                  </Button>
                  <Button variant="outline" disabled className="opacity-70 cursor-not-allowed">
                    <Mail className="h-4 w-4 mr-2" />
                    Direct support paused
                  </Button>
                  <Button variant="ghost" disabled className="opacity-70 cursor-not-allowed">
                    <Activity className="h-4 w-4 mr-2" />
                    Status feed on hold
                  </Button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  We are moving customer touchpoints to formhookapp.com. Direct inboxes and the public status page return soon—use the docs meanwhile.
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-300">
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Pager rotation online
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1">
                    450+ verified fixes in KB
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1">
                    Concierge office hours weekly
                  </span>
                </div>
              </div>
              <div className="relative rounded-3xl bg-slate-900 text-white p-6 md:p-8 shadow-2xl border border-white/10 overflow-hidden">
                <div className="absolute inset-0 opacity-30" aria-hidden>
                  <div className="absolute -right-12 top-4 h-48 w-48 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 blur-2xl" />
                </div>
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <p className="text-sm uppercase tracking-widest text-white/70">Realtime pager desk</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                      <span className="h-2 w-2 rounded-full bg-emerald-300 animate-ping" aria-hidden />
                      Online
                    </span>
                  </div>
                  <div className="mt-6 space-y-4">
                    {pagerSignals.map((signal) => (
                      <div key={signal.label} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <div className="rounded-full bg-white/10 p-2">
                          <signal.icon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{signal.label}</p>
                          <p className="text-xs text-white/70">{signal.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="text-sm font-semibold">Need a live bridge?</p>
                    <p className="text-xs text-white/70 mt-1">
                      Share your incident ID and preferred channel. We can spin up Zoom, Meets, or Slack Connect in under 2 minutes.
                    </p>
                    <Button className="mt-4 w-full bg-white text-slate-900 opacity-70 cursor-not-allowed" disabled>
                      Request bridge (paused)
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {supportChannels.map((channel) => (
              <Card key={channel.title} className="h-full border border-slate-200 dark:border-slate-800">
                <CardHeader className="space-y-2">
                  <div className="flex items-center gap-3">
                    <channel.icon className="h-10 w-10 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{channel.title}</CardTitle>
                      <CardDescription>{channel.metric}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300">{channel.description}</p>
                  {channel.href ? (
                    <Button asChild variant="outline" className="w-full">
                      <Link href={channel.href} target={channel.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                        {channel.action}
                        <ArrowUpRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full opacity-60 cursor-not-allowed" disabled>
                      {channel.action}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Send a support ticket
                </CardTitle>
                <CardDescription>Explain the impact, attach logs, and we will route it to the right engineer.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTitle>Ticket intake paused</AlertTitle>
                  <AlertDescription>
                    We are not processing in-app support tickets while we migrate to formhookapp.com. Please use the knowledge base below for now.
                  </AlertDescription>
                </Alert>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <fieldset disabled className="space-y-4 opacity-60 cursor-not-allowed">
                    <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Webhook retries failing for prod form"
                      {...register('subject', { required: 'Subject is required' })}
                      className="mt-1"
                    />
                    {errors.subject && <p className="text-sm text-red-500 mt-1">{errors.subject.message}</p>}
                    </div>
                    <div>
                    <Label htmlFor="email">Reply-to Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: { value: /[^@\s]+@[^@\s]+\.[^@\s]+/, message: 'Enter a valid email' }
                      })}
                      className="mt-1"
                    />
                    {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
                    </div>
                    <div>
                    <Label>Urgency</Label>
                    <Controller
                      name="urgency"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select urgency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    </div>
                    <div>
                    <Label htmlFor="message">Details</Label>
                    <textarea
                      id="message"
                      rows={5}
                      className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Share the timeframe, impact, recent changes, and sample submission IDs."
                      {...register('message', {
                        required: 'Please include details',
                        minLength: { value: 20, message: 'Add at least 20 characters' }
                      })}
                    />
                    {errors.message && <p className="text-sm text-red-500 mt-1">{errors.message.message}</p>}
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-dashed border-slate-300 dark:border-slate-700 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">Attach latest request logs</p>
                        <p className="text-xs text-slate-500">We add redacted payloads + delivery traces automatically.</p>
                      </div>
                      <Controller
                        name="includeLogs"
                        control={control}
                        render={({ field }) => (
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        )}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled>
                      Ticket intake paused
                    </Button>
                  </fieldset>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Operational snapshot
                  </CardTitle>
                  <CardDescription>Live look at SLAs and current incident signals.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {statusFeed.map((service) => (
                    <div key={service.label} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 last:border-none last:pb-0">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{service.label}</p>
                        <p className="text-xs text-slate-500">Updated {service.updated}</p>
                      </div>
                      <Badge variant={service.status === 'Operational' ? 'default' : 'destructive'}>
                        {service.status}
                      </Badge>
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full justify-start opacity-70 cursor-not-allowed" disabled>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Status page on hold
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PhoneCall className="h-5 w-5" />
                    Concierge hours
                  </CardTitle>
                  <CardDescription>Book real-time sessions with product specialists.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium">Weekdays</p>
                      <p className="text-xs text-slate-500">08:00 – 18:00 EST</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium">Office hours</p>
                      <p className="text-xs text-slate-500">Live debugging every Wednesday</p>
                    </div>
                  </div>
                  <Button className="opacity-70 cursor-not-allowed" disabled>
                    Concierge booking paused
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle>Frequently asked questions</CardTitle>
                <CardDescription>Answers to the most common production issues.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {faqItems.map((faq, idx) => (
                  <div key={faq.question} className="border border-slate-100 dark:border-slate-800 rounded-xl">
                    <button
                      className="w-full flex items-center justify-between px-4 py-3"
                      onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                      aria-expanded={activeFaq === idx}
                      aria-controls={`faq-${idx}`}
                    >
                      <span className="font-medium text-left text-slate-900 dark:text-white">{faq.question}</span>
                      <ArrowUpRight className={`h-4 w-4 transition-transform ${activeFaq === idx ? 'rotate-45' : ''}`} />
                    </button>
                    {activeFaq === idx && (
                      <p id={`faq-${idx}`} className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800">
                        {faq.answer}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle>Self-serve resources</CardTitle>
                <CardDescription>Shareable docs and tooling to unblock your team faster.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {resourceLinks.map((resource) => (
                  <Link
                    key={resource.label}
                    href={resource.href}
                    className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                    target={resource.href.startsWith('http') ? '_blank' : undefined}
                    rel="noreferrer"
                  >
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{resource.label}</span>
                    <ArrowUpRight className="h-4 w-4 text-slate-500" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </BottomGradientRadial>
  );
}

export default function HelpPage() {
  return (
    <AuthLayout>
      <HelpDeskContent />
    </AuthLayout>
  );
}
