"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Icon components
const DashboardIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="7" height="9" x="3" y="3" rx="1"/>
    <rect width="7" height="5" x="14" y="3" rx="1"/>
    <rect width="7" height="9" x="14" y="12" rx="1"/>
    <rect width="7" height="5" x="3" y="16" rx="1"/>
  </svg>
);

const AnalyticsIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 3v18h18"/>
    <path d="m19 9-5 5-4-4-3 3"/>
  </svg>
);

const UsersIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="m22 21-2-2"/>
    <path d="M16 16.28A13.84 13.84 0 0 1 22 21"/>
  </svg>
);

const FileIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14,2 14,8 20,8"/>
  </svg>
);

interface Tab {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  content: string;
  badge?: number;
}

interface VerticalTabsProps {
  tabs: Tab[];
  className?: string;
}

export default function VerticalTabs({ tabs, className }: VerticalTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div className={`w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-950 ${className || ''}`}>
      <div className="grid gap-0 md:grid-cols-[260px_minmax(0,1fr)]">
        {/* Sidebar */}
        <div className="border-b border-slate-200 bg-slate-50/90 p-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 md:border-b-0 md:border-r">
          <div className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200 ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
                    : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-2xl bg-slate-900/[0.03] dark:bg-white/[0.03]"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                
                <div className="relative z-10 flex items-center gap-3">
                  <Icon className={`h-5 w-5 transition-colors ${
                    isActive ? "text-slate-900 dark:text-white" : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200"
                  }`} />
                  <span className="font-medium">{tab.title}</span>
                  {tab.badge && (
                    <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {tab.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        </div>

        {/* Content */}
        <div className="min-w-0 p-6 sm:p-8 lg:p-10 overflow-auto">
        <AnimatePresence mode="wait">
          {tabs.map((tab) => {
            if (activeTab !== tab.id) return null;
            
            return (
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <div className="mb-5 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm dark:bg-white dark:text-slate-900">
                    <tab.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 break-words">
                      {tab.title}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Step {tabs.findIndex((t) => t.id === tab.id) + 1} of {tabs.length}
                    </p>
                  </div>
                </div>
                <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 break-words whitespace-normal">
                  {tab.content}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}

// Demo component tailored for FormHook
export function VerticalTabsDemo() {
  // Icons for each step (can be replaced with custom icons later)
  const FormIcon = DashboardIcon; // "Create Forms"
  const CollectIcon = UsersIcon; // "Collect Submissions"
  const WebhookIcon = FileIcon; // "Setup Webhooks"
  const AnalyticsStepIcon = AnalyticsIcon; // "Analyze Data"

  const tabs: Tab[] = [
    {
      id: "create-forms",
      title: "Create Forms",
      icon: FormIcon,
      content:
        "Spin up a new form in seconds using the FormHook dashboard or API. No backend required—just define your fields and get a unique endpoint for instant integration.",
    },
    {
      id: "collect-submissions",
      title: "Collect Submissions",
      icon: CollectIcon,
      content:
        "Embed once and start collecting instantly. Every submission is securely stored, spam-filtered, and available in your dashboard in real time.",
    },
    {
      id: "setup-webhooks",
      title: "Setup Webhooks",
      icon: WebhookIcon,
      content:
        "Connect your forms to external services. FormHook triggers webhooks on every submission, with automatic retry support for reliable delivery.",
    },
    {
      id: "analyze-data",
      title: "Analyze Data",
      icon: AnalyticsStepIcon,
      content:
        "Track submissions, conversion rates, and trends over time. Simple, actionable analytics help you understand your form’s performance at a glance.",
    },
  ];

  return <VerticalTabs tabs={tabs} />;
}
