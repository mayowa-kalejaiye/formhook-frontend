"use client";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";
import { AlertCircle, Download, ArrowRight, User } from "lucide-react";
import Link from "next/link";
import React from "react";

interface WelcomeBlockProps {
  username: string;
  userEmail?: string;
  stats: { submissions: number; failedWebhooks: number };
}

export default function WelcomeBlock({ username, userEmail, stats }: WelcomeBlockProps) {
  const getInitials = (email: string, name: string) => {
    // Always return 'F' for FormHook
    return 'F';
  };

  const handleExportCSV = () => {
    // Simple CSV export placeholder - could be enhanced to export actual data
    const csvData = [
      ['Metric', 'Value'],
      ['Submissions This Week', stats.submissions.toString()],
      ['Failed Webhooks', stats.failedWebhooks.toString()],
      ['Export Date', new Date().toISOString()]
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full bg-white dark:bg-slate-900 shadow-xl rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between border border-slate-200 dark:border-slate-700 relative overflow-hidden opacity-100" style={{ visibility: 'visible', opacity: 1 }}>
      {/* Enhanced FormHook blue accent border */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 to-blue-400 rounded-t-2xl"></div>
      
      <div className="flex items-center gap-6 z-10">
        <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center shadow-lg border-4 border-white" style={{ visibility: 'visible', opacity: 1 }}>
          <span className="text-3xl font-black text-white dashboard-title" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)', visibility: 'visible', opacity: 1 }}>
            F
          </span>
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 dashboard-title" style={{ visibility: 'visible', opacity: 1 }}>
            Welcome back, {username}!
          </h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
            <span className="text-gray-600 dark:text-gray-300 font-medium flex items-center gap-1">
              <span className="text-blue-600 dark:text-blue-400 font-bold">{stats.submissions}</span> 
              submissions this week
            </span>
            {stats.failedWebhooks > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 cursor-pointer text-red-600 dark:text-red-400 font-medium hover:text-red-700 dark:hover:text-red-300 transition-colors">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-bold">{stats.failedWebhooks}</span> webhook{stats.failedWebhooks === 1 ? '' : 's'} failed
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Check your webhook settings for errors</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-6 md:mt-0 z-10">
        {stats.failedWebhooks > 0 && (
          <Button asChild className="flex gap-2 bg-red-500 hover:bg-red-600 text-white shadow-lg">
            <Link href="/webhooks">
              <AlertCircle className="w-4 h-4" />
              Fix Issues
            </Link>
          </Button>
        )}
        <Button onClick={handleExportCSV} className="flex gap-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 bg-transparent">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
        <Button asChild className="flex gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
          <Link href="/forms">
            <ArrowRight className="w-4 h-4" />
            Manage Forms
          </Link>
        </Button>
      </div>
    </Card>
  );
}
