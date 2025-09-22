"use client";
import React, { useEffect, useState } from 'react';
import DashboardNav from '../components/DashboardNav';
import { useSidebar } from '../context/SidebarContext';
import BottomGradientRadial from '../components/BottomGradientRadial';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import Link from 'next/link';
import { getForms } from '../services/api';
import { toast } from '../hooks/use-toast';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCcw, 
  Calendar, 
  Mail, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowLeft,
  Eye,
  Trash2,
  MoreHorizontal,
  ExternalLink
} from 'lucide-react';
import AuthLayout from '../components/AuthLayout';

interface Submission {
  id: string;
  form_name?: string;
  form_id?: string;
  email: string;
  submitted_at?: string;
  date?: string;
  status: string;
  data?: Record<string, any>;
}

interface Form {
  id: string;
  name: string;
}

// Email Avatar Component
function EmailAvatar({ email }: { email: string }) {
  const getInitials = (email: string) => {
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
  };

  const getAvatarColor = (email: string) => {
    if (!email) return 'from-gray-400 to-gray-600';
    const colors = [
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600', 
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-indigo-400 to-indigo-600',
      'from-teal-400 to-teal-600',
      'from-orange-400 to-orange-600',
      'from-red-400 to-red-600'
    ];
    const index = email.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className={`h-8 w-8 rounded-full bg-gradient-to-r ${getAvatarColor(email)} flex items-center justify-center shadow-sm flex-shrink-0`}>
      <span className="text-white font-semibold text-xs">
        {getInitials(email)}
      </span>
    </div>
  );
}

// Submission Card Component
function SubmissionCard({ submission }: { submission: Submission }) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'error':
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <EmailAvatar email={submission.email} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {submission.form_name || 'Unknown Form'}
                </h3>
                <Badge className={`text-xs px-2 py-1 ${getStatusColor(submission.status)}`}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(submission.status)}
                    {submission.status}
                  </div>
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{submission.email}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(submission.submitted_at || submission.date || '2025-09-22T12:00:00.000Z')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Button className="bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 p-2 h-8 w-8">
              <Eye className="h-3 w-3" />
            </Button>
            <Button className="bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 p-2 h-8 w-8">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Statistics Cards Component
function SubmissionStats({ submissions }: { submissions: Submission[] }) {
  const totalSubmissions = submissions.length;
  const successfulSubmissions = submissions.filter(s => 
    ['success', 'delivered'].includes(s.status.toLowerCase())
  ).length;
  const failedSubmissions = submissions.filter(s => 
    ['error', 'failed'].includes(s.status.toLowerCase())
  ).length;
  const successRate = totalSubmissions > 0 ? Math.round((successfulSubmissions / totalSubmissions) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSubmissions}</p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Successful</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{successfulSubmissions}</p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Failed</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{failedSubmissions}</p>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Success Rate</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{successRate}%</p>
            </div>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading Component
function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-12" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-1/6" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="text-center py-12 space-y-4">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-8 w-24 h-24 flex items-center justify-center mx-auto">
        <Mail className="h-12 w-12 text-gray-400 dark:text-gray-500" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No submissions yet</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
          Submissions will appear here once users start filling out your forms
        </p>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Link href="/forms" className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            View Forms
          </Link>
        </Button>
      </div>
    </div>
  );
}

function SubmissionsPageContent() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForm, setSelectedForm] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const { isCollapsed } = useSidebar();

  // Mock data for development - using static timestamps to prevent hydration mismatches
  const mockSubmissions: Submission[] = [
    {
      id: '1',
      form_name: 'Contact Form',
      email: 'john@example.com',
      submitted_at: '2025-09-22T10:00:00.000Z',
      status: 'success'
    },
    {
      id: '2',
      form_name: 'Newsletter Signup',
      email: 'sarah@company.com',
      submitted_at: '2025-09-22T08:00:00.000Z',
      status: 'success'
    },
    {
      id: '3',
      form_name: 'Support Ticket',
      email: 'mike@startup.io',
      submitted_at: '2025-09-22T06:00:00.000Z',
      status: 'success'
    },
    {
      id: '4',
      form_name: 'Feedback Form',
      email: 'anna@tech.com',
      submitted_at: '2025-09-22T04:00:00.000Z',
      status: 'error'
    },
    {
      id: '5',
      form_name: 'Demo Request',
      email: 'alex@business.net',
      submitted_at: '2025-09-22T00:00:00.000Z',
      status: 'success'
    },
    {
      id: '6',
      form_name: 'Contact Form',
      email: 'lisa@example.org',
      submitted_at: '2025-09-21T12:00:00.000Z',
      status: 'success'
    }
  ];

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const formsData = await getForms();
        console.log('[SubmissionsPage] getForms response:', formsData);
        
        if (Array.isArray(formsData) && formsData.length > 0) {
          setForms(formsData);
          // In a real app, you'd fetch submissions here
          // For now, using mock data
          setTimeout(() => {
            setSubmissions(mockSubmissions);
            setFilteredSubmissions(mockSubmissions);
            setLoading(false);
          }, 1000);
        } else {
          setForms([]);
          setSubmissions([]);
          setFilteredSubmissions([]);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setSubmissions(mockSubmissions);
        setFilteredSubmissions(mockSubmissions);
        setLoading(false);
        toast({
          title: 'Info',
          description: 'Using sample data for demonstration',
        });
      }
    }
    
    fetchData();
  }, []);

  // Filter submissions
  useEffect(() => {
    let filtered = submissions;

    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.form_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedForm !== 'all') {
      filtered = filtered.filter(sub => sub.form_name === selectedForm);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(sub => sub.status.toLowerCase() === selectedStatus);
    }

    setFilteredSubmissions(filtered);
  }, [submissions, searchTerm, selectedForm, selectedStatus]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleExportCSV = () => {
    const csvData = [
      ['Form', 'Email', 'Status', 'Date'],
      ...filteredSubmissions.map(sub => [
        sub.form_name || 'Unknown Form',
        sub.email,
        sub.status,
        sub.submitted_at || sub.date || ''
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submissions-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <BottomGradientRadial>
      <div className={`min-h-screen flex flex-col ${isCollapsed ? 'md:ml-16' : 'md:ml-56'} transition-all duration-300 ease-in-out`}>
        <DashboardNav />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Button asChild className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 p-2 h-10 w-10">
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Form Submissions</h1>
                  <p className="text-gray-600 dark:text-gray-300">Track and manage all your form submissions</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleRefresh} disabled={refreshing} className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                  <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Button onClick={handleExportCSV} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Filters */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search by email or form name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedForm} onValueChange={setSelectedForm}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All Forms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Forms</SelectItem>
                        {Array.from(new Set(submissions.map(s => s.form_name).filter(Boolean))).map(formName => (
                          <SelectItem key={formName} value={formName!}>{formName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          {loading ? (
            <LoadingState />
          ) : filteredSubmissions.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <SubmissionStats submissions={filteredSubmissions} />
              <div className="space-y-4">
                {filteredSubmissions.map((submission) => (
                  <SubmissionCard key={submission.id} submission={submission} />
                ))}
              </div>
            </>
          )}
        </main>
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
