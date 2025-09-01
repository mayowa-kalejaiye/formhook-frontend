"use client";
import React from "react";
import { Card } from "../../components/ui/card";
// import { ScrollArea } from "../../components/ui/scroll-area";
import { Button } from "../../components/ui/button";
import { Copy, Download, BadgeCheck, AlertCircle } from "lucide-react";

// Dummy data for illustration
const submissions = [
  { id: "subm_1", form: "Contact", status: "delivered", date: "2025-07-27", email: "user1@email.com" },
  { id: "subm_2", form: "Signup", status: "failed", date: "2025-07-26", email: "user2@email.com" },
  { id: "subm_3", form: "Survey", status: "delivered", date: "2025-07-25", email: "user3@email.com" },
];

export default function SubmissionViewer() {
  return (
    <Card className="w-full mt-10 p-6 bg-gradient-to-tr from-[#0014FF]/60 to-[#0f172a]/80 dark:bg-[#0f172a] rounded-2xl shadow-xl border-0 relative overflow-hidden">
      {/* Subtle noise overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "url('/grain.svg')", opacity: 0.13 }} />
      <div className="flex items-center justify-between mb-4 z-10">
        <h2 className="text-xl font-bold text-white">Submissions</h2>
        <Button variant="outline" className="flex gap-2"><Download className="w-4 h-4" />Export CSV</Button>
      </div>
      <div className="h-64 w-full rounded-lg bg-black/10 overflow-auto">
        <table className="min-w-full text-sm text-left text-slate-300">
          <thead className="sticky top-0 bg-[#0f172a]">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Form</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8 text-slate-700" />
                    <span>No submissions yet.</span>
                  </div>
                </td>
              </tr>
            ) : (
              submissions.map((sub) => (
                <tr key={sub.id} className="border-b border-slate-800/40">
                  <td className="px-4 py-2 flex items-center gap-2">
                    <span>{sub.id}</span>
                    <Button size="icon" variant="ghost" className="p-1" onClick={() => navigator.clipboard.writeText(sub.id)}>
                      <Copy className="w-4 h-4 text-blue-400" />
                    </Button>
                  </td>
                  <td className="px-4 py-2">{sub.form}</td>
                  <td className="px-4 py-2">
                    {sub.status === "delivered" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-900/40 text-green-300 text-xs font-semibold"><BadgeCheck className="w-3 h-3" />Delivered</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-900/40 text-red-300 text-xs font-semibold"><AlertCircle className="w-3 h-3" />Failed</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{sub.date}</td>
                  <td className="px-4 py-2">{sub.email}</td>
                  <td className="px-4 py-2">
                    <Button size="sm" variant="outline" className="text-xs">Details</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
