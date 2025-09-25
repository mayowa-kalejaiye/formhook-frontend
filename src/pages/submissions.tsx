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
import { getForms, getSubmissions } from '../services/api';
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
  ExternalLink,
  MapPin,
  Shield,
  AlertTriangle,
  Globe
} from 'lucide-react';
import AuthLayout from '../components/AuthLayout';

interface Submission {
  id: string;
  form_name?: string;
  form_id?: string;
  email: string;
  submitted_at?: string;
  date?: string;
  created_at?: string;
  timestamp?: string;
  status: string;
  data?: Record<string, any>;
  ip_address?: string;
  country?: string;
  region?: string;
  city?: string;
  location_source?: string;
  latitude?: string;
  longitude?: string;
  threat_score?: number;
  created_at?: string;
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
  // Enhanced date formatting with better fallback handling
  const formatDate = (submission: Submission) => {
    // Check for various date field names the API might use
    const dateStr = submission.submitted_at || 
                   submission.date || 
                   submission.created_at || 
                   submission.timestamp ||
                   null;
    
    console.log(`[SubmissionCard] Date fields for submission:`, {
      submitted_at: submission.submitted_at,
      date: submission.date,
      created_at: (submission as any).created_at,
      timestamp: (submission as any).timestamp,
      selectedDate: dateStr
    });
    
    if (!dateStr) {
      console.warn('[SubmissionCard] No date found, using current date');
      return new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.error('[SubmissionCard] Invalid date:', dateStr);
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string | undefined) => {
    if (!status) return <CheckCircle className="h-4 w-4 text-gray-500" />;
    
    switch (status.toLowerCase()) {
      case 'success':
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'blocked':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    
    switch (status.toLowerCase()) {
      case 'success':
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'error':
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'blocked':
        return 'bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200';
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
                    {submission.status || 'unknown'}
                  </div>
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{submission.email}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
                <span>{formatDate(submission)}</span>
                {submission.ip_address && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {submission.ip_address}
                  </span>
                )}
              </div>
              
              {/* Geolocation and Security Info */}
              <div className="flex items-center gap-4 text-xs">
                {submission.country && (
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <MapPin className="h-3 w-3" />
                    <span>{submission.city}, {submission.country}</span>
                  </div>
                )}
                {submission.threat_score !== undefined && (
                  <div className={`flex items-center gap-1 ${
                    submission.threat_score > 70 
                      ? 'text-red-600 dark:text-red-400' 
                      : submission.threat_score > 30 
                        ? 'text-yellow-600 dark:text-yellow-400' 
                        : 'text-green-600 dark:text-green-400'
                  }`}>
                    {submission.threat_score > 70 ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <Shield className="h-3 w-3" />
                    )}
                    <span>Risk: {submission.threat_score}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Button 
              onClick={() => {
                // View submission details with all the enhanced information
                const details = [
                  `Form: ${submission.form_name || 'Unknown'}`,
                  `Email: ${submission.email}`,
                  `Status: ${submission.status || 'unknown'}`,
                  `Date: ${formatDate(submission)}`,
                  `IP Address: ${submission.ip_address || 'N/A'}`,
                  `Location: ${submission.city || 'Unknown'}, ${submission.region || 'Unknown'}, ${submission.country || 'Unknown'}`,
                  `Coordinates: ${submission.latitude || 'N/A'}, ${submission.longitude || 'N/A'}`,
                  `Threat Score: ${submission.threat_score !== undefined ? submission.threat_score : 'N/A'}`,
                  `Data: ${submission.data ? JSON.stringify(submission.data, null, 2) : 'No data'}`
                ];
                alert(`Submission Details:\n\n${details.join('\n')}`);
              }}
              className="bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 p-2 h-8 w-8"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button 
              onClick={() => {
                // Show options menu (placeholder)
                const action = window.confirm("Delete this submission?");
                if (action) {
                  // For now, just show an alert - would normally call API
                  alert("Delete functionality not yet implemented - would call API to delete submission");
                }
              }}
              className="bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 p-2 h-8 w-8"
            >
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
    s.status && ['success', 'delivered'].includes(s.status.toLowerCase())
  ).length;
  const failedSubmissions = submissions.filter(s => 
    s.status && ['error', 'failed'].includes(s.status.toLowerCase())
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
  const [mounted, setMounted] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForm, setSelectedForm] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedThreatLevel, setSelectedThreatLevel] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { isCollapsed } = useSidebar();

  // Prevent hydration mismatch by ensuring client-side only rendering for dynamic content
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        console.log('[SubmissionsPage] Fetching forms and submissions...');
        
        // Get forms first
        const formsRes = await getForms();
        console.log('[SubmissionsPage] getForms response:', formsRes);
        
        let formsData = [];
        if (formsRes && formsRes.data && Array.isArray(formsRes.data)) {
          formsData = formsRes.data;
        } else if (Array.isArray(formsRes)) {
          formsData = formsRes;
        }
        
        setForms(formsData);
        
        if (formsData.length > 0) {
          // Fetch submissions for all forms
          const allSubmissions = [];
          
          for (const form of formsData) {
            try {
              console.log(`[SubmissionsPage] Fetching submissions for form ${form.id}...`);
              const submissionsRes = await getSubmissions(form.id);
              console.log(`[SubmissionsPage] Submissions for form ${form.id}:`, submissionsRes);
              
              if (submissionsRes && Array.isArray(submissionsRes.submissions)) {
                // Add form name to each submission and log structure
                const submissionsWithForm = submissionsRes.submissions.map((sub, index) => {
                  if (index === 0) {
                    console.log(`[SubmissionsPage] Sample submission structure:`, sub);
                    console.log(`[SubmissionsPage] Sample submission date fields:`, {
                      submitted_at: sub.submitted_at,
                      date: sub.date,
                      created_at: (sub as any).created_at,
                      timestamp: (sub as any).timestamp,
                      all_keys: Object.keys(sub)
                    });
                  }
                  return {
                    ...sub,
                    form_name: form.name,
                    form_id: form.id
                  };
                });
                allSubmissions.push(...submissionsWithForm);
              } else if (submissionsRes && Array.isArray(submissionsRes)) {
                // Handle direct array response
                const submissionsWithForm = submissionsRes.map((sub, index) => {
                  if (index === 0) {
                    console.log(`[SubmissionsPage] Sample submission structure (direct array):`, sub);
                    console.log(`[SubmissionsPage] Sample submission date fields:`, {
                      submitted_at: sub.submitted_at,
                      date: sub.date,
                      created_at: (sub as any).created_at,
                      timestamp: (sub as any).timestamp,
                      all_keys: Object.keys(sub)
                    });
                  }
                  return {
                    ...sub,
                    form_name: form.name,
                    form_id: form.id
                  };
                });
                allSubmissions.push(...submissionsWithForm);
              }
            } catch (submissionErr) {
              console.warn(`Failed to fetch submissions for form ${form.id}:`, submissionErr);
              // Continue with other forms even if one fails
            }
          }
          
          console.log('[SubmissionsPage] All submissions fetched:', allSubmissions);
          setSubmissions(allSubmissions);
          setFilteredSubmissions(allSubmissions);
        } else {
          console.log('[SubmissionsPage] No forms found');
          setSubmissions([]);
          setFilteredSubmissions([]);
        }
        
      } catch (err) {
        console.error('[SubmissionsPage] Error fetching data:', err);
        
        // Show error message instead of using mock data
        toast({
          title: 'Error',
          description: 'Failed to load submissions. Please check your connection and try again.',
          variant: 'destructive'
        });
        
        // Set empty arrays instead of mock data
        setForms([]);
        setSubmissions([]);
        setFilteredSubmissions([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  // Advanced filter submissions
  useEffect(() => {
    let filtered = submissions;

    // Text search (email, form name, or IP address)
    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.form_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.ip_address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Form filter
    if (selectedForm !== 'all') {
      filtered = filtered.filter(sub => sub.form_name === selectedForm);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(sub => sub.status && sub.status.toLowerCase() === selectedStatus);
    }

    // Country filter
    if (selectedCountry !== 'all') {
      filtered = filtered.filter(sub => sub.country === selectedCountry);
    }

    // Threat level filter
    if (selectedThreatLevel !== 'all') {
      filtered = filtered.filter(sub => {
        const score = sub.threat_score || 0;
        if (selectedThreatLevel === 'low') return score <= 30;
        if (selectedThreatLevel === 'medium') return score > 30 && score <= 70;
        if (selectedThreatLevel === 'high') return score > 70;
        return true;
      });
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filtered = filtered.filter(sub => {
        // Use the same date field priority as formatDate function
        const dateStr = sub.submitted_at || sub.date || sub.created_at || sub.timestamp || null;
        if (!dateStr) return false; // Exclude submissions with no date
        
        const subDate = new Date(dateStr);
        if (isNaN(subDate.getTime())) return false; // Exclude invalid dates
        
        const fromDate = dateFrom ? new Date(dateFrom) : new Date('1900-01-01');
        const toDate = dateTo ? new Date(dateTo) : new Date('2100-12-31');
        return subDate >= fromDate && subDate <= toDate;
      });
    }

    setFilteredSubmissions(filtered);
  }, [submissions, searchTerm, selectedForm, selectedStatus, selectedCountry, selectedThreatLevel, dateFrom, dateTo]);

  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      console.log('[SubmissionsPage] Refreshing data...');
      
      // Get forms first
      const formsRes = await getForms();
      let formsData = [];
      if (formsRes && formsRes.data && Array.isArray(formsRes.data)) {
        formsData = formsRes.data;
      } else if (Array.isArray(formsRes)) {
        formsData = formsRes;
      }
      
      setForms(formsData);
      
      if (formsData.length > 0) {
        // Fetch submissions for all forms
        const allSubmissions = [];
        
        for (const form of formsData) {
          try {
            const submissionsRes = await getSubmissions(form.id);
            
            if (submissionsRes && Array.isArray(submissionsRes.submissions)) {
              const submissionsWithForm = submissionsRes.submissions.map(sub => ({
                ...sub,
                form_name: form.name,
                form_id: form.id
              }));
              allSubmissions.push(...submissionsWithForm);
            } else if (submissionsRes && Array.isArray(submissionsRes)) {
              const submissionsWithForm = submissionsRes.map(sub => ({
                ...sub,
                form_name: form.name,
                form_id: form.id
              }));
              allSubmissions.push(...submissionsWithForm);
            }
          } catch (submissionErr) {
            console.warn(`Failed to fetch submissions for form ${form.id} during refresh:`, submissionErr);
          }
        }
        
        setSubmissions(allSubmissions);
        setFilteredSubmissions(allSubmissions);
        
        toast({
          title: 'Success',
          description: `Refreshed data: Found ${allSubmissions.length} submissions across ${formsData.length} forms.`,
        });
      } else {
        setSubmissions([]);
        setFilteredSubmissions([]);
        
        toast({
          title: 'No Data',
          description: 'No forms found. Create a form to start receiving submissions.',
        });
      }
      
    } catch (err) {
      console.error('[SubmissionsPage] Error refreshing data:', err);
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh submissions data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportCSV = () => {
    const csvData = [
      ['Form', 'Email', 'Status', 'Date', 'IP Address', 'Country', 'City', 'Threat Score'],
      ...filteredSubmissions.map(sub => [
        sub.form_name || 'Unknown Form',
        sub.email,
        sub.status,
        sub.submitted_at || sub.date || '',
        sub.ip_address || '',
        sub.country || '',
        sub.city || '',
        sub.threat_score?.toString() || ''
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

  const handleExportJSON = () => {
    const jsonData = {
      export_date: new Date().toISOString(),
      total_records: filteredSubmissions.length,
      filters: {
        search: searchTerm || 'none',
        form: selectedForm,
        status: selectedStatus,
        country: selectedCountry,
        threat_level: selectedThreatLevel,
        date_from: dateFrom || 'none',
        date_to: dateTo || 'none'
      },
      submissions: filteredSubmissions
    };
    
    const jsonContent = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submissions-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedForm('all');
    setSelectedStatus('all');
    setSelectedCountry('all');
    setSelectedThreatLevel('all');
    setDateFrom('');
    setDateTo('');
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
                  <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''} mr-2`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Primary Filter Row */}
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search by email, form name, or IP address..."
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
                          <SelectItem value="failed">Failed</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Advanced Filter Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    
                    {/* Date Range */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">From Date</label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">To Date</label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="text-sm"
                      />
                    </div>

                    {/* Country Filter */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Country</label>
                      <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="All Countries" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Countries</SelectItem>
                          {Array.from(new Set(submissions.map(s => s.country).filter(Boolean))).map(country => (
                            <SelectItem key={country} value={country!}>{country}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Threat Score Filter */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Risk Level</label>
                      <Select value={selectedThreatLevel} onValueChange={setSelectedThreatLevel}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="All Levels" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Levels</SelectItem>
                          <SelectItem value="low">Low Risk (0-30)</SelectItem>
                          <SelectItem value="medium">Medium Risk (31-70)</SelectItem>
                          <SelectItem value="high">High Risk (71-100)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Export Options */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Export</label>
                      <div className="flex gap-1">
                        <Button 
                          onClick={handleExportCSV} 
                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 h-8 flex-1"
                        >
                          CSV
                        </Button>
                        <Button 
                          onClick={handleExportJSON} 
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 h-8 flex-1"
                        >
                          JSON
                        </Button>
                      </div>
                    </div>

                  </div>

                  {/* Filter Summary and Clear */}
                  {(searchTerm || selectedForm !== 'all' || selectedStatus !== 'all' || selectedCountry !== 'all' || selectedThreatLevel !== 'all' || dateFrom || dateTo) && (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Active filters:</span>
                        {searchTerm && (
                          <Badge variant="secondary" className="text-xs">
                            Search: {searchTerm}
                          </Badge>
                        )}
                        {selectedForm !== 'all' && (
                          <Badge variant="secondary" className="text-xs">
                            Form: {selectedForm}
                          </Badge>
                        )}
                        {selectedStatus !== 'all' && (
                          <Badge variant="secondary" className="text-xs">
                            Status: {selectedStatus}
                          </Badge>
                        )}
                        {selectedCountry !== 'all' && (
                          <Badge variant="secondary" className="text-xs">
                            Country: {selectedCountry}
                          </Badge>
                        )}
                        {selectedThreatLevel !== 'all' && (
                          <Badge variant="secondary" className="text-xs">
                            Risk: {selectedThreatLevel}
                          </Badge>
                        )}
                        {(dateFrom || dateTo) && (
                          <Badge variant="secondary" className="text-xs">
                            Date Range: {dateFrom || 'Start'} - {dateTo || 'End'}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          ({filteredSubmissions.length} results)
                        </span>
                      </div>
                      <Button
                        onClick={handleClearFilters}
                        className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs px-3 py-2 h-8"
                      >
                        Clear All
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          {!mounted || loading ? (
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
