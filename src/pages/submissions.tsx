"use client";
import React, { useEffect, useState } from 'react';
import DashboardNav from '../components/DashboardNav';
import StickyDock from '../components/StickyDock';
import Footer2 from '../components/Footer2';
import BottomGradientRadial from '../components/BottomGradientRadial';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Button } from '../components/ui/button';
import Link from 'next/link';
import axios from 'axios';
import { getForms } from '../services/api';
import { toast } from '../hooks/use-toast';

interface Submission {
  id: string;
  form: string;
  email: string;
  date: string;
  status: string;
}

const PAGE_SIZE = 10;

import AuthLayout from '../components/AuthLayout';

function SubmissionsPageContent() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formId, setFormId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFormAndSubmissions() {
      setLoading(true);
      try {
        const forms = await getForms();
        console.log('[SubmissionsPage] getForms response:', forms);
        if (!Array.isArray(forms) || !forms.length) {
          setSubmissions([]);
          setTotal(0);
          setFormId(null);
          setLoading(false);
          toast({
            title: 'Error',
            description: 'No forms found or response is not an array.',
            variant: 'destructive',
          });
          return;
        }
        const firstFormId = forms[0].id;
        setFormId(firstFormId);
        // Fallback for API base URL
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://formhook-backend.onrender.com';
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
        const res = await axios.get(`${API_BASE_URL}/forms/${firstFormId}/submissions`, {
          params: { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE },
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubmissions(res.data || []);
        setTotal(res.data.length || 0);
      } catch (err) {
        setSubmissions([]);
        setTotal(0);
        let message = 'Failed to fetch submissions.';
        if (err.response && err.response.data && err.response.data.detail) {
          message = err.response.data.detail;
        } else if (err.message) {
          message = err.message;
        }
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      }
      setLoading(false);
    }
    fetchFormAndSubmissions();
  }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <BottomGradientRadial>
      <div className="min-h-screen flex flex-col">
        <DashboardNav />
        <StickyDock />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 pt-8">
          {/* Only gate the main content, not the layout wrappers */}
          {loading ? (
            <div className="text-center text-purple-400 py-12 animate-pulse">Loading submissions...</div>
          ) : (
            <Card className="mb-8 bg-white/80 dark:bg-black/80 border border-purple-100 shadow">
              <CardHeader>
                <CardTitle>Submissions</CardTitle>
                <CardDescription>All recent submissions across your forms.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Form</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.form}</TableCell>
                        <TableCell>{item.email}</TableCell>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>
                          <span className={
                            item.status === 'Delivered'
                              ? 'text-green-600 font-semibold'
                              : 'text-red-500 font-semibold'
                          }>
                            {item.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {/* Pagination Controls */}
                <div className="mt-6 flex justify-between items-center">
                  <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages || 1}
                  </span>
                  <Button variant="outline" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)}>
                    Next
                  </Button>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button variant="outline" asChild>
                    <Link href="/forms">Back to Forms</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
        <Footer2 />
      </div>
    </BottomGradientRadial>
  );
}

const SubmissionsPage = () => (
  <AuthLayout>
    <SubmissionsPageContent />
  </AuthLayout>
);

export default SubmissionsPage;
