"use client";
import React, { useState } from 'react';
import useSWR from 'swr';
import { getForms, createForm, deleteForm, getForm, updateFormWebhook } from '../../services/api';
import DashboardNav from '../../components/DashboardNav';
import BottomGradientRadial from '../../components/BottomGradientRadial';
import StickyDock from '../../components/StickyDock';
import Footer2 from '../../components/Footer2';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Toaster } from '../../components/ui/toaster';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from '../../hooks/use-toast';
import { FormBuilderModal } from './new';


function FormNameSelect({ forms, selected, setSelected }) {
  return (
    <div className="w-full max-w-xs mb-6">
      <select
        title="Filter forms by name"
        className="block w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-black px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500"
        value={selected || ''}
        onChange={e => setSelected(e.target.value)}
      >
        <option value="">Filter by form name...</option>
        {forms.map(f => (
          <option key={f.id} value={f.id}>{f.name}</option>
        ))}
      </select>
    </div>
  );
}




import AuthLayout from '../../components/AuthLayout';


function FormsPageContent() {
  const { data, error, isLoading, mutate } = useSWR('forms', async () => (await getForms()).data);
  const forms = data || [];
  const [filterId, setFilterId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const filteredForms = filterId ? forms.filter(f => f.id === filterId) : forms;

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

  return (
    <BottomGradientRadial>
      <div className="min-h-screen flex flex-col">
        <DashboardNav />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-8">
          <Toaster />

          {/* Header and Create Button */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-blue-800 dark:text-blue-200 tracking-tight mb-1">All Forms</h1>
              <p className="text-gray-500 dark:text-gray-300 text-base max-w-xl">Create, manage, and analyze your forms. All your form data in one beautiful dashboard.</p>
            </div>
            <Button onClick={() => setShowCreate(true)} size="lg" className="font-semibold shadow-md px-8 py-4 text-lg">+ New Form</Button>
          </div>

          {/* Single-select filter by form name */}
          <FormNameSelect forms={forms} selected={filterId} setSelected={setFilterId} />

          {/* Main Content: Table */}
          <div className="relative">
            {isLoading ? (
              <div className="text-center text-gray-500 py-20 animate-pulse text-lg">Loading forms...</div>
            ) : error ? (
              <div className="text-center text-red-500 py-20 text-lg">{error.message || 'Failed to load forms.'}</div>
            ) : filteredForms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <svg width="80" height="80" fill="none" viewBox="0 0 24 24" className="mb-4 text-blue-200"><rect width="100%" height="100%" rx="12" fill="currentColor"/><path d="M8 12h8M8 16h5M8 8h8" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/></svg>
                <div className="text-gray-400 text-xl mb-2">No forms found</div>
                <div className="text-gray-400 mb-4">Get started by creating your first form.</div>
                <Button onClick={() => setShowCreate(true)} size="lg" className="font-semibold shadow">+ New Form</Button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-black/80">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredForms.map(form => (
                      <tr key={form.id} className="hover:bg-blue-50 dark:hover:bg-blue-900 transition">
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-blue-700 dark:text-blue-200">
                          <a href={`/forms/${form.id}`} className="hover:underline">{form.name}</a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-300">{form.created_at ? new Date(form.created_at).toLocaleDateString() : ''}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-300">{form.submissions_count ?? '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditForm(form)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => setDeleteId(form.id)}>Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Create Form Modal (new shadcn/ui version) */}
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Form?</DialogTitle>
                </DialogHeader>
                <div className="py-2">Are you sure you want to delete this form? This action cannot be undone.</div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
                  <Button variant="destructive" onClick={() => handleDelete(deleteId)}>{deleting ? 'Deleting...' : 'Delete'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Floating Action Button for mobile */}
            <div className="fixed bottom-6 right-6 z-50 md:hidden">
              <Button size="icon" className="rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white w-16 h-16 text-3xl flex items-center justify-center" onClick={() => setShowCreate(true)}>
                +
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
