import React from 'react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { Badge } from '../ui/badge';
import { Database, Download, RotateCcw } from 'lucide-react';

interface Submission {
  id?: string | number;
  form_id?: string;
  data?: Record<string, any>;
  ip_address?: string;
  status?: string;
  submitted_at?: string;
  created_at?: string;
  timestamp?: string;
  date?: string;
  country?: string;
  city?: string;
  region?: string;
}

interface FormSubmissionsTabProps {
  form: any;
  submissions: Submission[];
  submissionsLoading: boolean;
  totalSubmissions: number;
  currentPage: number;
  submissionsPerPage: number;
  loadSubmissions: (page: number) => void;
}

export function FormSubmissionsTab({
  form,
  submissions,
  submissionsLoading,
  totalSubmissions,
  currentPage,
  submissionsPerPage,
  loadSubmissions,
}: FormSubmissionsTabProps) {
  const totalPages = Math.ceil(totalSubmissions / submissionsPerPage);
  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1 && submissions.length === submissionsPerPage;

  return (
    <Card className="shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <CardHeader className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/30 dark:to-emerald-900/30 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <Database className="h-5 w-5 text-green-600" />
              Form Submissions
            </CardTitle>
            <CardDescription className="mt-1">
              View all submissions for <span className="font-medium text-slate-900 dark:text-slate-100">{form?.name}</span>
            </CardDescription>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalSubmissions}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">total submissions</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {submissionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-3 text-slate-600 dark:text-slate-400">Loading submissions...</span>
          </div>
        ) : submissions.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Showing page {currentPage + 1} of {totalPages || 1} · {submissions.length} of {totalSubmissions} submissions
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => loadSubmissions(currentPage)}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                  <TableRow className="border-b border-slate-200 dark:border-slate-700">
                    <TableHead className="w-20">#</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-40">IP Address</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-40">Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission, idx) => {
                    const submissionNumber = currentPage * submissionsPerPage + idx + 1;
                    const timestamp = submission.submitted_at 
                      || submission.created_at 
                      || submission.date 
                      || submission.timestamp;
                    
                    return (
                      <TableRow 
                        key={submission.id || idx}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            #{submissionNumber}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {submission.data && typeof submission.data === 'object' && Object.keys(submission.data).length > 0 ? (
                            <div className="space-y-1 text-xs">
                              {Object.entries(submission.data).slice(0, 3).map(([key, value]) => (
                                <div key={key} className="text-slate-700 dark:text-slate-300">
                                  <span className="font-medium text-slate-900 dark:text-slate-100">{key}:</span>{' '}
                                  <span className="text-slate-600 dark:text-slate-400 truncate">
                                    {String(value).substring(0, 40)}
                                    {String(value).length > 40 ? '...' : ''}
                                  </span>
                                </div>
                              ))}
                              {Object.keys(submission.data).length > 3 && (
                                <div className="text-slate-400 italic text-xs">
                                  +{Object.keys(submission.data).length - 3} more fields
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">No data</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs font-mono text-slate-700 dark:text-slate-300">
                            {submission.ip_address || '-'}
                          </code>
                          {submission.country && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {submission.city && `${submission.city}, `}
                              {submission.country}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              submission.status === 'delivered' ? 'default' :
                              submission.status === 'failed' ? 'destructive' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {submission.status || 'received'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                          {timestamp 
                            ? new Date(timestamp).toLocaleString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit',
                                second: '2-digit'
                              })
                            : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <Database className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">No submissions yet</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Submissions will appear here once someone fills out your form
              </p>
            </div>
            <Button variant="outline" onClick={() => loadSubmissions(0)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Check for Submissions
            </Button>
          </div>
        )}
      </CardContent>

      {submissions.length > 0 && (
        <CardFooter className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Page {currentPage + 1} of {totalPages || 1}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              size="sm"
              disabled={!canGoPrev || submissionsLoading}
              onClick={() => loadSubmissions(currentPage - 1)}
            >
              ← Previous
            </Button>
            <Button 
              variant="outline"
              size="sm"
              disabled={!canGoNext || submissionsLoading}
              onClick={() => loadSubmissions(currentPage + 1)}
            >
              Next →
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
