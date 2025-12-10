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
    description: 'Guaranteed response from on-call engineers with contextual diagnostics and routing.',
    metric: 'Avg. first reply < 2 hrs',
    icon: LifeBuoy,
    href: 'mailto:support@formhook.com',
    action: 'Open ticket'
  },
  {
    title: 'Live Incident Desk',
    description: 'Escalate webhook failures or delivery delays. Pager rotation covers 24/7 critical events.',
    metric: 'P1 pager coverage 24/7',
    icon: Zap,
    href: 'https://status.formhook.com',
    action: 'Check status'
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
      'All live updates ship through status.formhook.com plus in-app banners. Subscribe to status notifications to mirror updates into Slack, Email, or Webhooks.'
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
  { label: 'Status Page', href: 'https://status.formhook.com' },
  { label: 'Security & Compliance', href: '/docs/security' },
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
          <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-xl p-8 md:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="space-y-4">
              <Badge variant="outline" className="w-fit border-blue-200 text-blue-700 dark:border-blue-900/60 dark:text-blue-200 uppercase tracking-wide text-xs">
                Help Desk
              </Badge>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">Human support that knows FormHook inside-out.</h1>
                <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
                  Reach the on-call engineer team, track incidents, or browse verified fixes without leaving the dashboard.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link href="mailto:support@formhook.com">
                    <Mail className="h-4 w-4 mr-2" />
                    Email support
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="https://status.formhook.com" target="_blank" rel="noreferrer">
                    <Activity className="h-4 w-4 mr-2" />
                    View status feed
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex-1 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white p-6 shadow-inner">
              <p className="text-sm uppercase tracking-wide text-white/70">Response Objectives</p>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">P1 / Critical</span>
                  <span className="text-xl font-bold">15 min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">P2 / Degraded</span>
                  <span className="text-xl font-bold">60 min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">P3 / General</span>
                  <span className="text-xl font-bold">1 business day</span>
                </div>
              </div>
              <p className="mt-6 text-sm text-white/80">
                SLA timers reset every time you add new diagnostics. Keep tickets updated for the fastest path to a fix.
              </p>
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
                  <Button asChild variant="outline" className="w-full">
                    <Link href={channel.href} target={channel.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                      {channel.action}
                      <ArrowUpRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
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
              <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
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
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting…' : 'Send to support'}
                  </Button>
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
                  <Button asChild variant="ghost" className="w-full justify-start">
                    <Link href="https://status.formhook.com" target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open detailed status page
                    </Link>
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
                  <Button asChild>
                    <Link href="mailto:support@formhook.com?subject=Book%20office%20hours">
                      Reserve a slot
                      <ArrowUpRight className="h-4 w-4 ml-2" />
                    </Link>
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
