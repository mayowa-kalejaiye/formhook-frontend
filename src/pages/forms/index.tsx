"use client";
import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { getForms, createForm, deleteForm, getForm, updateFormWebhook } from '../../services/api';
import DashboardNav from '../../components/DashboardNav';
import BottomGradientRadial from '../../components/BottomGradientRadial';
import StickyDock from '../../components/StickyDock';
import Footer2 from '../../components/Footer2';
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


interface Form {
  id: string;
  name: string;
  webhook_url?: string;
  created_at?: string;
  submissions_count?: number;
  status?: 'active' | 'draft' | 'inactive';
  description?: string;
}

function FormCard({ form, onEdit, onDelete, onView }: {
  form: Form;
  onEdit: (form: Form) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}) {
  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
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
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {form.submissions_count || 0} submissions
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {form.created_at ? new Date(form.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>

        {form.webhook_url && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Globe className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-blue-700 dark:text-blue-300 truncate">
              Webhook configured
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onView(form.id)}
              className="text-xs px-3 py-1 h-8 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0"
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            <Button
              onClick={() => window.open(`/forms/${form.id}`, '_blank')}
              className="text-xs px-3 py-1 h-8 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open
            </Button>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              onClick={() => onEdit(form)}
              className="text-xs px-2 py-1 h-8 bg-blue-100 hover:bg-blue-200 text-blue-700 border-0"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            <Button
              onClick={() => onDelete(form.id)}
              className="text-xs px-2 py-1 h-8 bg-red-100 hover:bg-red-200 text-red-700 border-0"
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
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'submissions'>('created');
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
          aValue = a.submissions_count || 0;
          bValue = b.submissions_count || 0;
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
    const res = await createForm(formData);
    if (res && res.ok) {
      toast({ title: 'Form created', variant: 'default' });
      setShowCreate(false);
      mutate();
    } else {
      toast({
        title: 'Failed to create form',
        description: res?.error || 'Unknown error',
        variant: 'destructive',
      });
    }
    setSubmitting(false);
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
    <BottomGradientRadial>
      <div className="min-h-screen flex flex-col md:ml-56 transition-all duration-300 ease-in-out">
        <DashboardNav />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-4">
          <Toaster />

          {/* Modern Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                <FileText className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-purple-800 dark:text-purple-200 tracking-tight">
                  Forms
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1 max-w-2xl">
                  Create, manage, and analyze your forms with powerful insights and integrations
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setShowCreate(true)} 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New Form
            </Button>
          </div>

          {/* Filter and Search Bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6 p-4 bg-white/50 dark:bg-gray-900/50 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search forms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
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

              <Select value={sortBy} onValueChange={(value: 'name' | 'created' | 'submissions') => setSortBy(value)}>
                <SelectTrigger className="w-40 bg-white dark:bg-gray-800">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Created Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="submissions">Submissions</SelectItem>
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

          {/* Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{forms.length}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-300">Total Forms</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {forms.reduce((sum, form) => sum + (form.submissions_count || 0), 0)}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-300">Total Submissions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {forms.filter(f => (f.status || 'active') === 'active').length}
                    </p>
                    <p className="text-sm text-purple-600 dark:text-purple-300">Active Forms</p>
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Loading forms...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <div className="text-red-500 text-lg mb-4">{error.message || 'Failed to load forms.'}</div>
                <Button onClick={() => mutate()} className="bg-red-600 hover:bg-red-700 text-white">
                  Try Again
                </Button>
              </div>
            ) : filteredAndSortedForms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="p-4 rounded-full bg-purple-100 dark:bg-purple-900/20 mb-6">
                  <FileText className="h-16 w-16 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {searchQuery || statusFilter !== 'all' ? 'No forms match your filters' : 'No forms yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters to find what you\'re looking for.'
                    : 'Get started by creating your first form to collect and manage submissions.'
                  }
                </p>
                <Button 
                  onClick={() => setShowCreate(true)} 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredAndSortedForms.map((form: Form) => (
                            <tr key={form.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                                    <FileText className="h-4 w-4" />
                                  </div>
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
                                {form.submissions_count || 0}
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

            {/* Floating Action Button for Mobile */}
            <div className="fixed bottom-6 right-6 z-50 lg:hidden">
              <Button 
                onClick={() => setShowCreate(true)}
                className="rounded-full shadow-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white w-14 h-14 p-0 flex items-center justify-center"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </main>
        <StickyDock />
        <Footer2 />
      </div>
    </BottomGradientRadial>
  );
}

export default function FormsPage() {
  return (
    <AuthLayout>
      <FormsPageContent />
    </AuthLayout>
  );
}
