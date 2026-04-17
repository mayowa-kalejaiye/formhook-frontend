// Public form submission page
export async function getStaticPaths() {
  return { paths: [], fallback: 'blocking' };
}

export async function getStaticProps() {
  // For better previews, you could fetch form metadata here using your backend API
  // and return it so the page can render form-specific OG tags server-side.
  return { props: {} };
}

import React, { useEffect, useState, useMemo } from 'react';
import SEO from '../../components/SEO';
import { useRouter } from 'next/router';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast, showApiError } from '../../hooks/use-toast';
import { Toaster } from '../../components/ui/toaster';
import {
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  AlertCircleIcon,
  CheckIcon,
  ShieldCheck,
  Sparkles,
  LockKeyhole,
  Timer,
  BadgeCheck,
} from 'lucide-react';
import Link from 'next/link';

interface FormData {
  [key: string]: string | boolean;
}

interface FormErrors {
  [key: string]: string;
}

const getProgressWidthClass = (value: number) => {
  if (value >= 100) return 'w-full';
  if (value >= 90) return 'w-11/12';
  if (value >= 80) return 'w-10/12';
  if (value >= 70) return 'w-9/12';
  if (value >= 60) return 'w-8/12';
  if (value >= 50) return 'w-6/12';
  if (value >= 40) return 'w-5/12';
  if (value >= 30) return 'w-4/12';
  if (value >= 20) return 'w-3/12';
  if (value >= 10) return 'w-2/12';
  if (value > 0) return 'w-1/12';
  return 'w-0';
};

export default function PublicFormPage() {
  const router = useRouter();
  const { formId } = router.query;
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>({});
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Load form data
  useEffect(() => {
    if (!router.isReady || !formId) return;

    const loadFormData = async () => {
      try {
        const response = await fetch(`/api/public/forms/${formId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const loadedForm = await response.json();
          setForm(loadedForm);

          const initialFormData: FormData = {};
          if (loadedForm.fields && Array.isArray(loadedForm.fields)) {
            loadedForm.fields.forEach((field: any) => {
              initialFormData[field.name] = field.type === 'checkbox' ? false : '';
            });
          }
          setFormData(initialFormData);

          const draftKey = `form_draft_${formId}`;
          const savedDraft = localStorage.getItem(draftKey);
          if (savedDraft) {
            try {
              setFormData((prev) => ({ ...prev, ...JSON.parse(savedDraft) }));
            } catch {
              // ignore invalid draft payload
            }
          }
        } else {
          if (response.status === 404) {
            setError('Form not found');
          } else {
            setError('Failed to load form');
          }
        }

        setLoading(false);
      } catch {
        setError('Failed to load form');
        setLoading(false);
      }
    };

    loadFormData();
  }, [router.isReady, formId]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!formId || !form) return;

    const draftKey = `form_draft_${formId}`;
    const saveTimer = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify(formData));
    }, 500);

    return () => clearTimeout(saveTimer);
  }, [formData, formId, form]);

  const completionPercentage = useMemo(() => {
    if (!form?.fields?.length) return 0;
    const filledFields = form.fields.filter((field: any) => {
      const value = formData[field.name];
      return field.type === 'checkbox' ? Boolean(value) : String(value || '').trim() !== '';
    }).length;
    return Math.round((filledFields / form.fields.length) * 100);
  }, [formData, form]);

  const requiredFieldCount = useMemo(() => {
    if (!form?.fields?.length) return 0;
    return form.fields.filter((field: any) => field.required).length;
  }, [form]);

  const completedRequiredCount = useMemo(() => {
    if (!form?.fields?.length) return 0;
    return form.fields.filter((field: any) => {
      if (!field.required) return false;
      const value = formData[field.name];
      return field.type === 'checkbox' ? Boolean(value) : String(value || '').trim() !== '';
    }).length;
  }, [form, formData]);

  const remainingRequiredCount = Math.max(requiredFieldCount - completedRequiredCount, 0);

  const estimatedMinutes = useMemo(() => {
    const count = form?.fields?.length || 0;
    if (count <= 4) return 1;
    if (count <= 10) return 2;
    return 3;
  }, [form]);

  const validateField = (fieldName: string, value: any, fieldConfig: any): string => {
    if (fieldConfig.required && !value) {
      return `${fieldConfig.label || fieldConfig.name} is required`;
    }

    if (fieldConfig.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    if (fieldConfig.type === 'number' && value) {
      if (isNaN(Number(value))) {
        return 'Please enter a valid number';
      }
    }

    if (fieldConfig.validation?.minLength && String(value).length < fieldConfig.validation.minLength) {
      return `Minimum ${fieldConfig.validation.minLength} characters required`;
    }

    if (fieldConfig.validation?.maxLength && String(value).length > fieldConfig.validation.maxLength) {
      return `Maximum ${fieldConfig.validation.maxLength} characters allowed`;
    }

    if (fieldConfig.validation?.pattern && value) {
      try {
        const regex = new RegExp(fieldConfig.validation.pattern);
        if (!regex.test(String(value))) {
          return `Invalid format for ${fieldConfig.label || fieldConfig.name}`;
        }
      } catch {
        // ignore invalid regex pattern
      }
    }

    return '';
  };

  const handleInputChange = (field: string, value: string | boolean, fieldConfig: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (touchedFields.has(field)) {
      const errorMessage = validateField(field, value, fieldConfig);
      setFieldErrors((prev) => ({
        ...prev,
        [field]: errorMessage,
      }));
    }
  };

  const handleFieldBlur = (fieldName: string, fieldConfig: any) => {
    setTouchedFields((prev) => new Set([...prev, fieldName]));
    const errorMessage = validateField(fieldName, formData[fieldName], fieldConfig);
    setFieldErrors((prev) => ({
      ...prev,
      [fieldName]: errorMessage,
    }));
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (form?.fields) {
      form.fields.forEach((field: any) => {
        const errorMessage = validateField(field.name, formData[field.name], field);
        if (errorMessage) {
          errors[field.name] = errorMessage;
        }
      });
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || submitting) return;

    if (!validateForm()) {
      toast({
        title: 'Please review the errors',
        description: 'A few fields need your attention.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    const slowBackendTimer = setTimeout(() => {
      toast({
        title: 'Still processing...',
        description: 'Thank you for your patience. Your submission is being processed.',
      });
    }, 5000);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      const response = await fetch(`/api/public/forms/${formId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: formData }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      clearTimeout(slowBackendTimer);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));

        let errorMessage = 'Submission failed';
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((err: any) => err.msg || err.message || JSON.stringify(err)).join(', ');
          } else {
            errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }

        showApiError({ message: errorMessage });
        return;
      }

      await response.json();

      if (formId) {
        localStorage.removeItem(`form_draft_${formId}`);
      }

      if (form?.redirect_url) {
        toast({ title: 'Success!', description: 'Redirecting you now...' });
        setTimeout(() => {
          window.location.href = form.redirect_url;
        }, 1500);
      } else {
        setSubmitted(true);
        toast({ title: 'Success!', description: 'Your form has been submitted successfully.' });
      }
    } catch (err: any) {
      let errorMessage = err?.message || 'Please try again.';
      if (err?.message === 'Failed to fetch' || err?.name === 'TypeError') {
        errorMessage = 'We had trouble connecting. Please check your internet connection and try again.';
      }
      showApiError({ ...err, message: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#e0f2fe_0%,_#ffffff_42%,_#eef2ff_75%,_#ecfeff_100%)] dark:bg-[radial-gradient(circle_at_top_left,_#0b1220_0%,_#111827_40%,_#1f2937_100%)]">
        <SEO
          title={form?.name || 'Form • FormHook'}
          description={form?.description || 'Submit to this form powered by FormHook.'}
          image={`${(process.env.NEXT_PUBLIC_SITE_URL || 'https://formhookapp.vercel.app').replace(/\/$/, '')}/og-image-2.svg`}
          url={`${(process.env.NEXT_PUBLIC_SITE_URL || 'https://formhookapp.vercel.app').replace(/\/$/, '')}/f/${formId || ''}`}
        />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto">
            <Card className="border border-blue-100/70 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-2xl">
              <CardContent className="p-10 text-center space-y-6">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 mx-auto">
                  <Loader2 className="h-7 w-7 animate-spin" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Preparing your form experience...</h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">Loading fields, restoring your draft, and setting up validation.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#e0f2fe_0%,_#ffffff_42%,_#eef2ff_75%,_#ecfeff_100%)] dark:bg-[radial-gradient(circle_at_top_left,_#0b1220_0%,_#111827_40%,_#1f2937_100%)]">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto">
            <Card className="border border-rose-200/80 dark:border-rose-900/50 bg-white/95 dark:bg-slate-900/95 shadow-2xl">
              <CardContent className="p-10 text-center space-y-6">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">{error}</h1>
                  <p className="text-slate-600 dark:text-slate-400">
                    {error === 'Form not found'
                      ? 'This link may be outdated, removed, or unpublished by the form owner.'
                      : 'We could not load the form right now. Please check your connection and retry.'}
                  </p>
                </div>
                <Button onClick={() => router.reload()} className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white">
                  Reload Form
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#d1fae5_0%,_#ffffff_40%,_#ecfeff_80%)] dark:bg-[radial-gradient(circle_at_top_left,_#0b1220_0%,_#111827_45%,_#1f2937_100%)]">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto">
            <Card className="border border-emerald-200/70 dark:border-emerald-900/50 bg-white/95 dark:bg-slate-900/95 shadow-2xl overflow-hidden">
              <CardContent className="p-10 text-center space-y-7">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
                  <BadgeCheck className="h-10 w-10" />
                </div>
                <div>
                  <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mb-3">Submission received</h1>
                  <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                    {form?.success_message || 'Thank you. Your response has been recorded successfully.'}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-100 dark:border-slate-700 bg-emerald-50/70 dark:bg-slate-800/70 p-4 text-sm text-slate-700 dark:text-slate-300">
                  You can safely close this tab, or send another response if needed.
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({});
                      setFieldErrors({});
                      setTouchedFields(new Set());
                    }}
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white"
                  >
                    Submit Another Response
                  </Button>
                  <Button variant="outline" onClick={() => window.close()} className="text-slate-700 dark:text-slate-300">
                    Close Window
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_#cffafe_0%,_#ffffff_35%,_#eef2ff_70%,_#f0fdfa_100%)] dark:bg-[radial-gradient(circle_at_top_left,_#0b1220_0%,_#111827_40%,_#1f2937_100%)]">
      <SEO
        title={form?.name || 'Form • FormHook'}
        description={form?.description || 'Submit to this form powered by FormHook.'}
        image={`${(process.env.NEXT_PUBLIC_SITE_URL || 'https://formhookapp.vercel.app').replace(/\/$/, '')}/og-image-2.svg`}
        url={`${(process.env.NEXT_PUBLIC_SITE_URL || 'https://formhookapp.vercel.app').replace(/\/$/, '')}/f/${formId || ''}`}
      />

      <div className="pointer-events-none absolute -top-24 -left-20 h-64 w-64 rounded-full bg-cyan-300/30 blur-3xl" />
      <div className="pointer-events-none absolute top-48 -right-24 h-72 w-72 rounded-full bg-indigo-300/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />

      <header className="bg-white/75 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-400/30">
                <Send className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">FormHook</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Confident submissions, zero guesswork</p>
              </div>
            </div>
            <Link href="/login" className="text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 transition-colors font-medium">
              Create your own forms
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[340px,1fr] gap-6 items-start">
          <aside className="lg:sticky lg:top-24">
            <Card className="bg-white/88 dark:bg-slate-900/82 border border-cyan-100/80 dark:border-slate-700 shadow-xl backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6 space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] font-semibold text-cyan-600 dark:text-cyan-400">Public Form</p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">{form?.name || 'Form'}</h2>
                  {form?.description && (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{form.description}</p>
                  )}
                </div>

                <div className="rounded-xl border border-cyan-100 dark:border-slate-700 bg-gradient-to-br from-white to-cyan-50/60 dark:from-slate-900 dark:to-slate-800 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Completion</p>
                    <span className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">{completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div className={`bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300 ${getProgressWidthClass(completionPercentage)}`} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <Timer className="h-4 w-4 text-slate-500" />
                    About {estimatedMinutes} minute{estimatedMinutes > 1 ? 's' : ''}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-emerald-500" />
                    <span>Your draft is auto-saved while you type.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <LockKeyhole className="h-4 w-4 mt-0.5 text-emerald-500" />
                    <span>We only ask what this form actually needs.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 mt-0.5 text-emerald-500" />
                    <span>Your submission is securely delivered.</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Required checklist</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{completedRequiredCount} of {requiredFieldCount} required complete</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {remainingRequiredCount === 0 ? 'You are ready to submit.' : `${remainingRequiredCount} required field${remainingRequiredCount > 1 ? 's' : ''} left.`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </aside>

          <Card className="bg-white/94 dark:bg-slate-900/92 border border-cyan-100/80 dark:border-slate-700 shadow-2xl backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-cyan-50/85 via-blue-50/85 to-indigo-50/85 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-slate-900/20 border-b border-slate-200 dark:border-slate-700 pb-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 dark:border-cyan-800 bg-white/80 dark:bg-slate-800/70 px-3 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300 w-fit">
                  <Sparkles className="h-3.5 w-3.5" />
                  Smart form flow
                </div>
                <CardTitle className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  {form?.name || 'Contact Form'}
                </CardTitle>
                {form?.description && (
                  <CardDescription className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                    {form.description}
                  </CardDescription>
                )}

                {form?.fields?.length > 3 && (
                  <div className="pt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Form Progress</p>
                      <span className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">{completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div className={`bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300 ${getProgressWidthClass(completionPercentage)}`} />
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-8 md:p-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                {form?.fields && Array.isArray(form.fields) ? (
                  form.fields.map((field: any, index: number) => {
                    const fieldError = fieldErrors[field.name];
                    const isFieldTouched = touchedFields.has(field.name);
                    const hasError = Boolean(fieldError && isFieldTouched);

                    return (
                      <div key={field.name || index} className="group rounded-xl border border-transparent hover:border-cyan-100 dark:hover:border-slate-700 hover:bg-cyan-50/30 dark:hover:bg-slate-800/30 p-3 -mx-3 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 text-xs font-bold">
                              {index + 1}
                            </span>
                            <Label htmlFor={field.name} className="text-base font-semibold text-slate-900 dark:text-slate-100">
                              {field.label || field.name}
                            </Label>
                          </div>
                          {field.required ? (
                            <span className="text-xs font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">Required</span>
                          ) : (
                            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Optional</span>
                          )}
                        </div>

                        {field.helpText && <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{field.helpText}</p>}

                        <div className="relative">
                          {field.type === 'textarea' ? (
                            <textarea
                              id={field.name}
                              name={field.name}
                              rows={4}
                              placeholder={field.placeholder || `Enter ${field.label || field.name}...`}
                              value={String(formData[field.name] || '')}
                              onChange={(e) => handleInputChange(field.name, e.target.value, field)}
                              onBlur={() => handleFieldBlur(field.name, field)}
                              required={field.required}
                              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 resize-vertical ${
                                hasError ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-cyan-500 dark:focus:border-cyan-400'
                              }`}
                            />
                          ) : field.type === 'select' ? (
                            <select
                              id={field.name}
                              name={field.name}
                              value={String(formData[field.name] || '')}
                              onChange={(e) => handleInputChange(field.name, e.target.value, field)}
                              onBlur={() => handleFieldBlur(field.name, field)}
                              required={field.required}
                              className={`w-full px-4 py-3 pr-10 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 appearance-none ${
                                hasError ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-cyan-500 dark:focus:border-cyan-400'
                              }`}
                            >
                              <option value="">Select an option</option>
                              {field.options && field.options.map((option: string, optIndex: number) => (
                                <option key={optIndex} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          ) : field.type === 'checkbox' ? (
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  id={field.name}
                                  name={field.name}
                                  checked={Boolean(formData[field.name])}
                                  onChange={(e) => handleInputChange(field.name, e.target.checked, field)}
                                  onBlur={() => handleFieldBlur(field.name, field)}
                                  required={field.required}
                                  className="h-5 w-5 text-cyan-600 rounded focus:ring-2 focus:ring-cyan-500/20 cursor-pointer border-slate-300 dark:border-slate-600"
                                />
                              </div>
                              <Label htmlFor={field.name} className="text-slate-900 dark:text-slate-100 cursor-pointer">
                                {field.label || field.name}
                              </Label>
                            </div>
                          ) : field.type === 'radio' ? (
                            <div className="space-y-3">
                              {field.options && field.options.map((option: string, optIndex: number) => {
                                const radioId = `${field.name}_${optIndex}`;
                                return (
                                  <label key={optIndex} htmlFor={radioId} className="flex items-center space-x-3 cursor-pointer">
                                    <div className="relative">
                                      <input
                                        id={radioId}
                                        type="radio"
                                        name={field.name}
                                        value={option}
                                        checked={formData[field.name] === option}
                                        onChange={(e) => handleInputChange(field.name, e.target.value, field)}
                                        onBlur={() => handleFieldBlur(field.name, field)}
                                        required={field.required}
                                        className="h-5 w-5 text-cyan-600 cursor-pointer border-slate-300 dark:border-slate-600"
                                      />
                                    </div>
                                    <span className="text-slate-900 dark:text-slate-100">{option}</span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="relative">
                              <Input
                                id={field.name}
                                name={field.name}
                                type={field.type || 'text'}
                                placeholder={field.placeholder || `Enter ${field.label || field.name}...`}
                                value={String(formData[field.name] || '')}
                                onChange={(e) => handleInputChange(field.name, e.target.value, field)}
                                onBlur={() => handleFieldBlur(field.name, field)}
                                required={field.required}
                                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 ${
                                  hasError ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-cyan-500 dark:focus:border-cyan-400'
                                }`}
                              />
                              {isFieldTouched && !fieldError && String(formData[field.name]).trim() && (
                                <CheckIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                              )}
                            </div>
                          )}
                        </div>

                        {hasError && (
                          <div className="mt-2 flex items-start gap-2">
                            <AlertCircleIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-500 font-medium">{fieldError}</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">This form has no fields configured.</p>
                    <p className="text-sm mt-2">Please contact the form owner to set up the form fields.</p>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    type="submit"
                    disabled={submitting || !form?.fields?.length}
                    className="w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 shadow-lg text-lg h-14"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Sending securely...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        {remainingRequiredCount > 0 ? `Complete ${remainingRequiredCount} required field${remainingRequiredCount > 1 ? 's' : ''}` : 'Submit Form'}
                      </>
                    )}
                  </Button>
                  {completionPercentage < 100 && !submitting && (
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-3">
                      {remainingRequiredCount > 0
                        ? `${remainingRequiredCount} required field${remainingRequiredCount > 1 ? 's' : ''} left before submit`
                        : 'All required fields are complete'}
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-4 py-2 bg-white/70 dark:bg-slate-900/70">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Powered by{' '}
              <Link href="/login" className="text-cyan-700 dark:text-cyan-300 hover:underline font-medium">
                FormHook
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Toaster />
    </div>
  );
}

