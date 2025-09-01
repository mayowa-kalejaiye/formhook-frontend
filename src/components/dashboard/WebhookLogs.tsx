"use client";
import React from "react";
import { Card } from "../../components/ui/card";
// import { ScrollArea } from "../../components/ui/scroll-area";
import { BadgeCheck, AlertCircle, Zap, Clock } from "lucide-react";

// Dummy data for illustration
const logs = [
  { id: 1, status: "delivered", time: "2025-07-27 10:12", message: "Webhook delivered to https://api.example.com/hook" },
  { id: 2, status: "failed", time: "2025-07-27 09:55", message: "Webhook failed (500) to https://api.example.com/hook" },
  { id: 3, status: "delivered", time: "2025-07-27 09:30", message: "Webhook delivered to https://api.example.com/hook" },
];

export default function WebhookLogs() {
  return (
    <Card className="w-full mt-10 p-6 bg-gradient-to-br from-[#0f172a]/90 to-[#0014FF]/70 dark:bg-[#0f172a] rounded-2xl shadow-xl border-0 relative overflow-hidden">
      {/* Subtle noise overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "url('/grain.svg')", opacity: 0.13 }} />
      <h2 className="text-xl font-bold text-white mb-4 z-10">Webhook Logs</h2>
      <div className="h-56 w-full rounded-lg bg-black/10 overflow-auto">
        <ol className="relative border-l border-slate-700 ml-4">
          {logs.length === 0 ? (
            <li className="text-slate-500 py-8 flex items-center gap-2">
              <Clock className="w-5 h-5" />No webhook events yet.
            </li>
          ) : (
            logs.map((log) => (
              <li key={log.id} className="mb-8 ml-6">
                <span className={`absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full ring-8 ring-[#0f172a] ${log.status === 'delivered' ? 'bg-green-500' : 'bg-red-500'}`}>
                  {log.status === 'delivered' ? <BadgeCheck className="w-4 h-4 text-white" /> : <AlertCircle className="w-4 h-4 text-white" />}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{log.time}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${log.status === 'delivered' ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'}`}>
                    {log.status === 'delivered' ? 'Delivered' : 'Failed'}
                  </span>
                </div>
                <p className="text-slate-200 mt-1 text-sm">{log.message}</p>
              </li>
            ))
          )}
        </ol>
      </div>
    </Card>
  );
}
