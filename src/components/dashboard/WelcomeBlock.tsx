"use client";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";
import { AlertCircle, Download, ArrowRight, User } from "lucide-react";
import React from "react";

interface WelcomeBlockProps {
  username: string;
  stats: { submissions: number; failedWebhooks: number };
}

export default function WelcomeBlock({ username, stats }: WelcomeBlockProps) {
  return (
    <Card className="w-full bg-gradient-to-br from-[#0014FF]/80 to-[#0f172a]/90 dark:bg-[#0f172a] shadow-2xl rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between relative overflow-hidden border-0">
      {/* Subtle noise overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "url('/grain.svg')", opacity: 0.13 }} />
      <div className="flex items-center gap-4 z-10">
        <Avatar className="h-14 w-14 border-2 border-blue-700 shadow-lg">
          <AvatarImage src="/avatar.png" alt={username} />
          <AvatarFallback><User className="w-7 h-7" /></AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Welcome back, {username}</h1>
          <div className="flex gap-4 text-sm text-blue-200">
            <span>{stats.submissions} submissions this week</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 cursor-pointer text-red-400"><AlertCircle className="w-4 h-4" />{stats.failedWebhooks} webhook failed</span>
                </TooltipTrigger>
                <TooltipContent side="bottom">Check your webhook settings for errors</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-6 md:mt-0 z-10">
        <Button variant="destructive" className="flex gap-2"><AlertCircle className="w-4 h-4" />Fix Issue</Button>
        <Button variant="outline" className="flex gap-2"><Download className="w-4 h-4" />Export CSV</Button>
        <Button variant="default" className="flex gap-2 bg-gradient-to-r from-[#6EE7B7] to-[#3B82F6] text-black font-semibold hover:from-[#3B82F6] hover:to-[#6EE7B7] transition"><ArrowRight className="w-4 h-4" />Go to Form</Button>
      </div>
    </Card>
  );
}
