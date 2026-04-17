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
  CheckIcon
} from 'lucide-react';
import Link from 'next/link';

interface FormData {
  [key: string]: string | boolean;
}

interface FormErrors {
  [key: string]: string;
}

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
        console.log('Loading form data for ID:', formId);
        
        const response = await fetch(`/api/public/forms/${formId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const formData = await response.json();
          console.log('Loaded form data:', formData);
          
          setForm(formData);
          
          // Initialize form data object with all field names
          const initialFormData = {};
          if (formData.fields && Array.isArray(formData.fields)) {
            formData.fields.forEach(field => {
              initialFormData[field.name] = field.type === 'checkbox' ? false : '';
            });
          }
          setFormData(initialFormData);

          // Try to load draft from localStorage
          const draftKey = `form_draft_${formId}`;
          const savedDraft = localStorage.getItem(draftKey);
          if (savedDraft) {
            try {
              setFormData(prev => ({ ...prev, ...JSON.parse(savedDraft) }));
            } catch (e) {
              console.error('Failed to load draft:', e);
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
      } catch (err) {
        console.error('Error loading form:', err);
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

  // Calculate form completion percentage
  const completionPercentage = useMemo(() => {
    if (!form?.fields?.length) return 0;
    const filledFields = form.fields.filter((field) => {
      const value = formData[field.name];
      return field.type === 'checkbox' ? value : String(value).trim() !== '';
    }).length;
    return Math.round((filledFields / form.fields.length) * 100);
  }, [formData, form]);

  // Validate single field
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
      } catch (e) {
        console.error('Invalid regex pattern:', e);
      }
    }
    
    return '';
  };

  const handleInputChange = (field: string, value: string | boolean, fieldConfig: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate on change if field has been touched
    if (touchedFields.has(field)) {
      const error = validateField(field, value, fieldConfig);
      setFieldErrors(prev => ({
        ...prev,
        [field]: error
      }));
    }
  };

  const handleFieldBlur = (fieldName: string, fieldConfig: any) => {
    setTouchedFields(prev => new Set([...prev, fieldName]));
    const error = validateField(fieldName, formData[fieldName], fieldConfig);
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (form?.fields) {
      form.fields.forEach((field) => {
        const error = validateField(field.name, formData[field.name], field);
        if (error) {
          errors[field.name] = error;
        }
      });
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || submitting) return;

    // Validate form before submission
    if (!validateForm()) {
      toast({
        title: 'Please review the errors',
        description: 'A few fields need your attention.',
        variant: 'destructive'
      });
      return;
    }

    console.log('Submitting form with data:', formData);
    console.log('Form ID:', formId);

    setSubmitting(true);
    
    const slowBackendTimer = setTimeout(() => {
      toast({ 
        title: 'Still processing...', 
        description: 'Thank you for your patience. Your submission is being processed.'
      });
    }, 5000);
    
    try {
      console.log('Submitting with correct backend format:', { data: formData });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);
      
      const response = await fetch(`/api/public/forms/${formId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: formData
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      clearTimeout(slowBackendTimer);

      console.log('Submission response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        console.log('Submission error data:', errorData);
        
        let errorMessage = 'Submission failed';
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map(err => err.msg || err.message || JSON.stringify(err)).join(', ');
          } else {
            errorMessage = typeof errorData.detail === 'string'
              ? errorData.detail
              : JSON.stringify(errorData.detail);
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }

        showApiError({ message: errorMessage });
        return;
      }

      const responseData = await response.json();
      console.log('Submission success data:', responseData);

      // Clear draft on successful submission
      if (formId) {
        localStorage.removeItem(`form_draft_${formId}`);
      }

      // If form has a redirect URL, redirect after a brief delay
      if (form?.redirect_url) {
        toast({ title: 'Success!', description: 'Redirecting you now...' });
        setTimeout(() => {
          window.location.href = form.redirect_url;
        }, 1500);
      } else {
        // Otherwise show success state
        setSubmitted(true);
        toast({ title: 'Success!', description: 'Your form has been submitted successfully.' });
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      console.error('Error type:', err.name);
      console.error('Error message:', err.message);
      
      let errorMessage = err.message || 'Please try again.';
      
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        errorMessage = 'We had trouble connecting. Please check your internet connection and try again.';
      }
      
      showApiError({ ...err, message: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <SEO
          title={form?.name || 'Form • FormHook'}
          description={form?.description || 'Submit to this form powered by FormHook.'}
          image={`${(process.env.NEXT_PUBLIC_SITE_URL || 'https://formhook-frontend.vercel.app').replace(/\/$/, '')}/og-image-2.svg`}
          url={`${(process.env.NEXT_PUBLIC_SITE_URL || 'https://formhook-frontend.vercel.app').replace(/\/$/, '')}/f/${formId || ''}`}
        />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-2xl backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-center justify-center h-32">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                    <span className="text-gray-600 dark:text-gray-400">Loading form...</span>
                  </div>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-2xl backdrop-blur-sm">
              <CardContent className="p-8 text-center space-y-6">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {error}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {error === 'Form not found' 
                      ? 'This form may have been deleted or the link is incorrect.'
                      : 'Please check your connection and try again.'
                    }
                  </p>
                </div>
                <Button onClick={() => router.reload()} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Try Again
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-2xl backdrop-blur-sm">
              <CardContent className="p-8 text-center space-y-6">
                <div className="flex justify-center">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Got it!
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    {form?.success_message || 'Your submission was received. Thank you!'}
                  </p>
                </div>
                <div className="flex gap-3 justify-center pt-4">
                  <Button 
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({});
                      setFieldErrors({});
                      setTouchedFields(new Set());
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Submit Another Response
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.close()}
                    className="text-gray-700 dark:text-gray-300"
                  >
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <SEO
        title={form?.name || 'Form • FormHook'}
        description={form?.description || 'Submit to this form powered by FormHook.'}
        image={`${(process.env.NEXT_PUBLIC_SITE_URL || 'https://formhook-frontend.vercel.app').replace(/\/$/, '')}/og-image-2.svg`}
        url={`${(process.env.NEXT_PUBLIC_SITE_URL || 'https://formhook-frontend.vercel.app').replace(/\/$/, '')}/f/${formId || ''}`}
      />
      
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <Send className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  FormHook
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Secure Form Submissions</p>
              </div>
            </div>
            <Link 
              href="/login"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 transition-colors"
            >
              Create your own forms
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-2xl backdrop-blur-sm overflow-hidden">
            {/* Form Header */}
            <CardHeader className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/30 dark:to-purple-900/30 border-b border-gray-200 dark:border-gray-700 pb-6">
              <div className="space-y-3">
                <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
                  {form?.name || 'Contact Form'}
                </CardTitle>
                {form?.description && (
                  <CardDescription className="text-base text-gray-700 dark:text-gray-300">
                    {form.description}
                  </CardDescription>
                )}
                
                {/* Form Progress Indicator */}
                {form?.fields?.length > 3 && (
                  <div className="pt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Form Progress
                      </p>
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {completionPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      {/* Dynamic progress bar width based on form completion */}
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completionPercentage}%` } as any}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>

            {/* Form Fields */}
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {form?.fields && Array.isArray(form.fields) ? (
                  form.fields.map((field, index) => {
                    const fieldError = fieldErrors[field.name];
                    const isFieldTouched = touchedFields.has(field.name);
                    const hasError = fieldError && isFieldTouched;

                    return (
                      <div key={field.name || index} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <Label 
                            htmlFor={field.name} 
                            className="text-base font-semibold text-gray-900 dark:text-white"
                          >
                            {field.label || field.name}
                            {field.required ? (
                              <span className="text-red-500 ml-1" aria-label="required">*</span>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400 text-sm ml-1 font-normal">(optional)</span>
                            )}
                          </Label>
                        </div>

                        {/* Field Help Text */}
                        {field.helpText && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            {field.helpText}
                          </p>
                        )}

                        {/* Field Input */}
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
                              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-vertical ${
                                hasError 
                                  ? 'border-red-500 focus:border-red-500' 
                                  : 'border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400'
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
                              className={`w-full px-4 py-3 pr-10 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 appearance-none ${
                                hasError 
                                  ? 'border-red-500 focus:border-red-500' 
                                  : 'border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400'
                              }`}
                            >
                              <option value="">Select an option</option>
                              {field.options && field.options.map((option, optIndex) => (
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
                                  className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500/20 cursor-pointer border-gray-300 dark:border-gray-600"
                                />
                              </div>
                              <Label htmlFor={field.name} className="text-gray-900 dark:text-white cursor-pointer">
                                {field.label || field.name}
                              </Label>
                            </div>
                          ) : field.type === 'radio' ? (
                            <div className="space-y-3">
                              {field.options && field.options.map((option, optIndex) => {
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
                                        className="h-5 w-5 text-blue-600 cursor-pointer border-gray-300 dark:border-gray-600"
                                      />
                                    </div>
                                    <span className="text-gray-900 dark:text-white">{option}</span>
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
                                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                                  hasError 
                                    ? 'border-red-500 focus:border-red-500' 
                                    : 'border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400'
                                }`}
                              />
                              {isFieldTouched && !fieldError && String(formData[field.name]).trim() && (
                                <CheckIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Error Message */}
                        {hasError && (
                          <div className="mt-2 flex items-start gap-2">
                            <AlertCircleIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-500 font-medium">
                              {fieldError}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">This form has no fields configured.</p>
                    <p className="text-sm mt-2">Please contact the form owner to set up the form fields.</p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="submit"
                    disabled={submitting || !form?.fields?.length}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 shadow-lg text-lg h-14"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Submit Form
                      </>
                    )}
                  </Button>
                  {completionPercentage < 100 && !submitting && (
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">
                      {completionPercentage > 0 && `${100 - completionPercentage}% remaining • `}
                      All required fields must be filled
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
            <p>Powered by{' '}
              <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
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
