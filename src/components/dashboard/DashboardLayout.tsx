"use client";
import React from "react";
import WelcomeBlock from "./WelcomeBlock";
import MetricsOverview from "./MetricsOverview";
import DashboardCharts from "./DashboardCharts";
import SubmissionViewer from "./SubmissionViewer";
import WebhookLogs from "./WebhookLogs";

interface DashboardLayoutProps {
  username?: string;
  dashboardData?: any;
  loading?: boolean;
}

export default function DashboardLayout({ username = "User", dashboardData, loading = false }: DashboardLayoutProps) {
  // Prepare stats from real data
  const stats = {
    submissions: dashboardData?.total_submissions || 0,
    failedWebhooks: dashboardData?.failed_webhooks || 0
  };

  const metrics = {
    totalSubmissions: dashboardData?.total_submissions || 0,
    activeForms: dashboardData?.active_forms || 0,
    webhookRate: dashboardData?.webhook_success_rate ? `${(dashboardData.webhook_success_rate * 100).toFixed(1)}%` : "N/A",
    tokenUsage: dashboardData?.token_usage || "0/mo",
    loading: loading,
  };

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-[#0f172a] to-[#0014FF]/40 dark:from-[#0f172a] dark:to-[#0014FF]/40 py-12 px-2 md:px-8 flex flex-col gap-10">
      <WelcomeBlock username={username} stats={stats} />
      <MetricsOverview stats={metrics} />
      <DashboardCharts dashboardData={dashboardData} loading={loading} />
      <SubmissionViewer />
      <WebhookLogs />
    </main>
  );
}
