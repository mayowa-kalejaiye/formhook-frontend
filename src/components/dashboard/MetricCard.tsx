"use client";
import { Card } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";
import { LucideIcon } from "lucide-react";
import React from "react";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  loading?: boolean;
  tooltip?: string;
  accent?: string;
}

export default function MetricCard({ icon: Icon, label, value, loading, tooltip, accent }: MetricCardProps) {
  return (
    <Card className={`flex flex-col items-start justify-between p-6 min-w-[180px] h-32 bg-gradient-to-br from-[#0014FF]/70 to-[#0f172a]/80 dark:bg-[#0f172a] rounded-xl shadow-lg border-0 relative overflow-hidden ${accent || ''}`}>
      {/* Subtle noise overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "url('/grain.svg')", opacity: 0.13 }} />
      <div className="flex items-center gap-3 z-10">
        <Icon className="w-6 h-6 text-[#6EE7B7] dark:text-[#6EE7B7]" />
        <span className="text-sm text-slate-300 dark:text-slate-400 font-medium">{label}</span>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="ml-1 cursor-pointer text-blue-400">?</span>
              </TooltipTrigger>
              <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="mt-4 z-10">
        {loading ? (
          <Skeleton className="h-7 w-20 rounded bg-slate-700/40" />
        ) : (
          <span className="text-2xl font-bold text-white dark:text-white">{value}</span>
        )}
      </div>
    </Card>
  );
}
