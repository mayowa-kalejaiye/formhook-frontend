"use client";
import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { getForms, createForm, deleteForm, getForm, updateFormWebhook } from '../../services/api';
import DashboardNav from '../../components/DashboardNav';
import StickyDock from '../../components/StickyDock';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Toaster } from '../../components/ui/toaster';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from '../../hooks/use-toast';
import { FormBuilderModal } from './new';
import AuthLayout from '../../components/AuthLayout';
import { 
  Search, 
  Plus, 
  Grid3X3, 
  List, 
  FileText, 
  Calendar,
  TrendingUp,
  Users,
  Globe,
  Settings,
  Trash2,
  Edit3,
  MoreHorizontal,
  Eye,
  ExternalLink,
  Copy,
  Filter,
  ArrowUpDown
} from 'lucide-react';

// Professional Form Avatar Component
function FormAvatar({ formName, size = "md" }: { formName: string; size?: "sm" | "md" | "lg" | "xl" }) {
  // Generate form initial
  const getFormInitial = (name: string) => {
    return (name || 'F')[0].toUpperCase();
  };

  // Professional slate-based color system
  const getFormColor = (name: string) => {
    if (!name) return 'bg-slate-500 dark:bg-slate-600';
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash + name.charCodeAt(i)) & 0xffffffff;
    }
    
    // Professional slate color palette
    const colors = [
      'bg-slate-500 dark:bg-slate-600',
      'bg-slate-600 dark:bg-slate-700', 
      'bg-slate-700 dark:bg-slate-800',
      'bg-slate-500 dark:bg-slate-600',
      'bg-slate-600 dark:bg-slate-700',
      'bg-slate-700 dark:bg-slate-800',
      'bg-slate-500 dark:bg-slate-600',
      'bg-slate-600 dark:bg-slate-700'
    ];
    
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  const sizeClasses = {
    sm: "h-4 w-4 text-xs",
    md: "h-5 w-5 text-sm", 
    lg: "h-8 w-8 text-base",
    xl: "h-16 w-16 text-3xl"
  };

  const paddingClasses = {
    sm: "p-1",
    md: "p-2",
    lg: "p-2", 
    xl: "p-4"
  };

  const initial = getFormInitial(formName);
  const color = getFormColor(formName);

  return (
    <div 
      className={`${paddingClasses[size]} rounded-md ${color} text-white flex items-center justify-center border border-slate-300 dark:border-slate-600`} 
      title={`Form: ${formName}`}
    >
      <span className="font-semibold">
        {initial}
      </span>
    </div>
  );
}


interface Form {
  id: string;
  name: string;
  description?: string;
  webhook_url?: string;
  notification_email?: string;
  require_token?: boolean;
  created_at?: string;
  // Enhanced metadata from FormWithMetadata
  submission_count: number;
  recent_submissions: number;
  last_submission_at?: string;
  status: 'active' | 'draft' | 'inactive';
}

function FormCard({ form, onEdit, onDelete, onView }: {
  form: Form;
  onEdit: (form: Form) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}) {
  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    inactive: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
  };

  return (
    <Card className="pro-card group hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <FormAvatar formName={form.name} size="lg" />
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                {form.name}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {form.description || 'No description provided'}
              </CardDescription>
            </div>
          </div>
          <Badge className={statusColors[form.status || 'active']}>
            {form.status || 'Active'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {form.submission_count || 0} submissions
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {form.created_at ? new Date(form.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>

        {/* Enhanced metadata section */}
        <div className="flex items-center justify-between mb-4 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            {/* Recent activity indicator */}
            {form.recent_submissions > 0 && (
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <TrendingUp className="h-3 w-3" />
                <span>{form.recent_submissions} recent</span>
              </div>
            )}
            
            {/* Last submission time */}
            {form.last_submission_at && (
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Globe className="h-3 w-3" />
                <span>Last: {new Date(form.last_submission_at).toLocaleDateString()}</span>
              </div>
            )}
            
            {/* No activity indicator */}
            {!form.last_submission_at && form.submission_count === 0 && (
              <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                <Globe className="h-3 w-3" />
                <span>No submissions yet</span>
              </div>
            )}
          </div>
        </div>

        {form.webhook_url && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
            <Globe className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
              Webhook configured
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onView(form.id)}
              className="pro-btn-secondary text-xs px-3 py-1 h-8"
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            <Button
              onClick={() => window.open(`/forms/${form.id}`, '_blank')}
              className="pro-btn-secondary text-xs px-3 py-1 h-8"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open
            </Button>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              onClick={() => onEdit(form)}
              className="pro-btn-secondary text-xs px-2 py-1 h-8"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            <Button
              onClick={() => onDelete(form.id)}
              className="text-xs px-2 py-1 h-8 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-md"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



function FormsPageContent() {
  const { data, error, isLoading, mutate } = useSWR('forms', async () => (await getForms()).data);
  const forms = data || [];
  
  // UI State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'submissions' | 'recent'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal States
  const [showCreate, setShowCreate] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filter and sort forms
  const filteredAndSortedForms = useMemo(() => {
    let filtered = forms.filter((form: Form) => {
      const matchesSearch = form.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || (form.status || 'active') === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort forms
    filtered.sort((a: Form, b: Form) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created':
          aValue = new Date(a.created_at || 0).getTime();
          bValue = new Date(b.created_at || 0).getTime();
          break;
        case 'submissions':
          aValue = a.submission_count || 0;
          bValue = b.submission_count || 0;
          break;
        case 'recent':
          aValue = a.recent_submissions || 0;
          bValue = b.recent_submissions || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [forms, searchQuery, statusFilter, sortBy, sortOrder]);

  const handleCreate = async (formData) => {
    setSubmitting(true);
    try {
      const res = await createForm(formData);
      if (res && res.ok) {
        toast({ 
          title: 'Success!', 
          description: 'Form created successfully',
          variant: 'default' 
        });
        setShowCreate(false);
        mutate();
      } else {
        toast({
          title: 'Failed to create form',
          description: res?.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to create form',
        description: error.message || 'Network error occurred',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (formData) => {
    setSubmitting(true);
    try {
      await updateFormWebhook(editForm.id, formData);
      toast({ title: 'Form updated', variant: 'default' });
      setEditForm(null);
      mutate();
    } catch {
      toast({ title: 'Failed to update form', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await deleteForm(id);
      toast({ title: 'Form deleted', variant: 'default' });
      setDeleteId(null);
      mutate();
    } catch {
      toast({ title: 'Failed to delete form', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const handleView = (formId: string) => {
    window.location.href = `/forms/${formId}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 md:ml-56 transition-all duration-300 ease-in-out">
      <DashboardNav />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-4">
        <Toaster />

        {/* Professional Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-md bg-slate-600 dark:bg-slate-700 text-white border border-slate-300 dark:border-slate-600">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Forms
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                Create, manage, and analyze your forms with powerful insights and integrations
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setShowCreate(true)} 
            className="pro-btn-primary px-6 py-3 font-semibold min-w-fit"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Form
          </Button>
        </div>

        {/* Professional Filter and Search Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6 p-4 pro-card">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 bg-white dark:bg-gray-800">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: 'name' | 'created' | 'submissions' | 'recent') => setSortBy(value)}>
                <SelectTrigger className="w-40 bg-white dark:bg-gray-800">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Created Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="submissions">Total Submissions</SelectItem>
                  <SelectItem value="recent">Recent Activity</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <Button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' 
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' 
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Professional Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="pro-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-slate-600 dark:bg-slate-700 text-white">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{forms.length}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Forms</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="pro-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {forms.reduce((sum, form) => sum + (form.submission_count || 0), 0)}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Submissions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="pro-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {forms.reduce((sum, form) => sum + (form.recent_submissions || 0), 0)}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Recent Submissions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="relative">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
                  <p className="text-slate-500 dark:text-slate-400">Loading forms...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <div className="text-red-500 text-lg mb-4">{error.message || 'Failed to load forms.'}</div>
                <Button onClick={() => mutate()} className="pro-btn-primary">
                  Try Again
                </Button>
              </div>
            ) : filteredAndSortedForms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="p-4 rounded-md bg-slate-100 dark:bg-slate-800 mb-6">
                  <FileText className="h-16 w-16 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  {searchQuery || statusFilter !== 'all' ? 'No forms match your filters' : 'No forms yet'}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 text-center max-w-md">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters to find what you\'re looking for.'
                    : 'Get started by creating your first form to collect and manage submissions.'
                  }
                </p>
                <Button 
                  onClick={() => setShowCreate(true)} 
                  className="pro-btn-primary px-6 py-3 font-semibold"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Form
                </Button>
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedForms.map((form: Form) => (
                      <FormCard
                        key={form.id}
                        form={form}
                        onEdit={setEditForm}
                        onDelete={setDeleteId}
                        onView={handleView}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/90 dark:bg-gray-900/80 rounded-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50/80 dark:bg-gray-800/80">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recent Activity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredAndSortedForms.map((form: Form) => (
                            <tr key={form.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <FormAvatar formName={form.name} size="md" />
                                  <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">{form.name}</div>
                                    {form.webhook_url && (
                                      <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                        <Globe className="h-3 w-3" />
                                        Webhook configured
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge className={form.status === 'active' ? 'bg-green-100 text-green-800' : form.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>
                                  {form.status || 'Active'}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {form.created_at ? new Date(form.created_at).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {form.submission_count || 0}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                  {form.recent_submissions > 0 ? (
                                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                      <TrendingUp className="h-3 w-3" />
                                      <span>{form.recent_submissions} in 7 days</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400">No recent activity</span>
                                  )}
                                  {form.last_submission_at && (
                                    <span className="text-xs text-gray-400">
                                      Last: {new Date(form.last_submission_at).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <Button
                                    onClick={() => handleView(form.id)}
                                    className="text-xs px-3 py-1 h-8 bg-blue-100 hover:bg-blue-200 text-blue-700 border-0"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    onClick={() => setEditForm(form)}
                                    className="text-xs px-3 py-1 h-8 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0"
                                  >
                                    <Edit3 className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    onClick={() => setDeleteId(form.id)}
                                    className="text-xs px-3 py-1 h-8 bg-red-100 hover:bg-red-200 text-red-700 border-0"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Create Form Modal */}
            <FormBuilderModal
              open={showCreate}
              onOpenChange={setShowCreate}
              onSuccess={() => {
                setShowCreate(false);
                mutate();
              }}
              initial={null}
              submitting={submitting}
              submitLabel="Create Form"
              onSubmit={handleCreate}
            />

            {/* Edit Form Modal */}
            <FormBuilderModal
              open={!!editForm}
              onOpenChange={open => { if (!open) setEditForm(null); }}
              onSuccess={() => {
                setEditForm(null);
                mutate();
              }}
              initial={editForm}
              submitting={submitting}
              submitLabel="Save Changes"
              onSubmit={handleEdit}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
              <DialogContent className="bg-white dark:bg-gray-900 border-2 border-red-200 dark:border-red-800 shadow-2xl max-w-md">
                <DialogHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-full w-16 h-16 flex items-center justify-center">
                    <Trash2 className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    Delete Form?
                  </DialogTitle>
                </DialogHeader>
                <div className="py-2">
                  <p className="text-gray-700 dark:text-gray-200 text-center leading-relaxed">
                    Are you sure you want to delete this form? This action <span className="font-semibold text-red-600 dark:text-red-400">cannot be undone</span> and will permanently remove all associated data and submissions.
                  </p>
                </div>
                <DialogFooter className="flex gap-3 pt-6">
                  <Button 
                    onClick={() => setDeleteId(null)} 
                    disabled={deleting}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 border-0 font-medium py-3"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleDelete(deleteId)}
                    disabled={deleting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-lg font-medium py-3 flex items-center justify-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Delete Form
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Professional Floating Action Button for Mobile */}
            <div className="fixed bottom-6 right-6 z-50 lg:hidden">
              <Button 
                onClick={() => setShowCreate(true)}
                className="pro-btn-primary rounded-full w-14 h-14 p-0 flex items-center justify-center shadow-lg"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </main>
        <StickyDock />
      </div>
  );
}

export default function FormsPage() {
  return (
    <AuthLayout>
      <FormsPageContent />
    </AuthLayout>
  );
}
