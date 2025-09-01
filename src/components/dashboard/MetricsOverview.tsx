"use client";
import React from "react";
import MetricCard from "./MetricCard";
import { BarChart3, ListChecks, Repeat, KeyRound } from "lucide-react";

interface MetricsOverviewProps {
  stats: {
    totalSubmissions: number;
    activeForms: number;
    webhookRate: string;
    tokenUsage: string;
    loading?: boolean;
  };
}

export default function MetricsOverview({ stats }: MetricsOverviewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full mt-8">
      <MetricCard icon={BarChart3} label="Total Submissions" value={stats.loading ? '' : stats.totalSubmissions} loading={stats.loading} tooltip="All-time submissions across all forms." />
      <MetricCard icon={ListChecks} label="Active Forms" value={stats.loading ? '' : stats.activeForms} loading={stats.loading} tooltip="Forms with at least one submission in the last 30 days." />
      <MetricCard icon={Repeat} label="Webhook Delivery Rate" value={stats.loading ? '' : stats.webhookRate} loading={stats.loading} tooltip="Successful webhook deliveries vs. total attempts." />
      <MetricCard icon={KeyRound} label="Token Usage" value={stats.loading ? '' : stats.tokenUsage} loading={stats.loading} tooltip="API token calls this month." />
    </div>
  );
}
