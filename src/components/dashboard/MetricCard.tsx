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
    <Card className={`flex flex-col justify-between p-6 min-w-[180px] h-32 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200 ${accent || ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
            <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <span className="text-sm font-medium">?</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-tight">{label}</span>
        <div>
          {loading ? (
            <Skeleton className="h-8 w-16 rounded bg-gray-200 dark:bg-gray-700" />
          ) : (
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
          )}
        </div>
      </div>
    </Card>
  );
}
