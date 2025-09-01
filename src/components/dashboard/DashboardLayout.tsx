"use client";
import React from "react";
import WelcomeBlock from "./WelcomeBlock";
import MetricsOverview from "./MetricsOverview";
import DashboardCharts from "./DashboardCharts";
import SubmissionViewer from "./SubmissionViewer";
import WebhookLogs from "./WebhookLogs";

export default function DashboardLayout() {
  // Dummy data for illustration
  const username = "Alex";
  const stats = { submissions: 42, failedWebhooks: 1 };
  const metrics = {
    totalSubmissions: 1234,
    activeForms: 7,
    webhookRate: "98.7%",
    tokenUsage: "1,234/mo",
    loading: false,
  };

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-[#0f172a] to-[#0014FF]/40 dark:from-[#0f172a] dark:to-[#0014FF]/40 py-12 px-2 md:px-8 flex flex-col gap-10">
      <WelcomeBlock username={username} stats={stats} />
      <MetricsOverview stats={metrics} />
      <DashboardCharts />
      <SubmissionViewer />
      <WebhookLogs />
    </main>
  );
}
