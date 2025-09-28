"use client";
import React from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../ui/button";
import { Copy, Download, BadgeCheck, AlertCircle } from "lucide-react";

interface SubmissionViewerProps {
  submissions?: any[];
  loading?: boolean;
}

export default function SubmissionViewer({ submissions = [], loading = false }: SubmissionViewerProps) {
  const handleExportCSV = () => {
    if (submissions.length === 0) return;
    
    const headers = ['ID', 'Form', 'Status', 'Date', 'Data'];
    const csvRows = submissions.map(sub => [
      sub.id || 'N/A',
      sub.form_name || 'Unknown Form',
      sub.status || 'received',
      sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() :
      sub.date ? new Date(sub.date).toLocaleDateString() : 'N/A',
      sub.data ? JSON.stringify(sub.data).slice(0, 50) + '...' : 'No data'
    ]);
    
    const csvContent = [headers, ...csvRows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submissions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full mt-10 p-6 bg-gradient-to-tr from-[#0014FF]/60 to-[#0f172a]/80 dark:bg-[#0f172a] rounded-2xl shadow-xl border-0 relative overflow-hidden">
      {/* Subtle noise overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "url('/grain.svg')", opacity: 0.13 }} />
      <div className="flex items-center justify-between mb-4 z-10">
        <h2 className="text-xl font-bold text-white">Recent Submissions</h2>
        <Button 
          onClick={handleExportCSV}
          disabled={loading || submissions.length === 0}
          className="flex gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>
      
      {loading ? (
        <div className="h-64 w-full rounded-lg bg-black/10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="ml-3 text-white">Loading submissions...</span>
        </div>
      ) : (
        <div className="h-64 w-full rounded-lg bg-black/10 overflow-auto">
          <table className="min-w-full text-sm text-left text-slate-300">
            <thead className="sticky top-0 bg-[#0f172a]">
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Form</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Data</th>
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
                submissions.slice(0, 10).map((submission, idx) => (
                  <tr key={submission.id || idx} className="hover:bg-white/5">
                    <td className="px-4 py-2 font-mono text-xs">
                      <div className="flex flex-col">
                        <span className="text-blue-400 font-semibold">#{submission.id || `sub_${idx}`}</span>
                        <span className="text-gray-500 text-xs">Global ID</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">{submission.form_name || 'Unknown'}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        {submission.status === 'delivered' ? (
                          <BadgeCheck className="w-4 h-4 text-green-400" />
                        ) : submission.status === 'failed' ? (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        ) : (
                          <BadgeCheck className="w-4 h-4 text-blue-400" />
                        )}
                        <span className="capitalize">{submission.status || 'received'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() :
                       submission.date ? new Date(submission.date).toLocaleDateString() :
                       submission.created_at ? new Date(submission.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-2 max-w-xs">
                      <div className="truncate text-xs">
                        {submission.data && typeof submission.data === 'object' 
                          ? Object.entries(submission.data).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(', ')
                          : 'No data'}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <Button
                        onClick={() => navigator.clipboard.writeText(submission.id)}
                        className="p-1 h-auto bg-transparent hover:bg-white/10 text-slate-400 hover:text-white"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
