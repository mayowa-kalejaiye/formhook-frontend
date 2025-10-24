// Public form submission page
export async function getStaticPaths() {
  return { paths: [], fallback: 'blocking' };
}

export async function getStaticProps() {
  // For better previews, you could fetch form metadata here using your backend API
  // and return it so the page can render form-specific OG tags server-side.
  return { props: {} };
}

import React, { useEffect, useState } from 'react';
import SEO from '../../components/SEO';
import { useRouter } from 'next/router';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from '../../hooks/use-toast';
import { Toaster } from '../../components/ui/toaster';
import { 
  Send, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface FormData {
  [key: string]: string | boolean;
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

  useEffect(() => {
    if (!router.isReady || !formId) return;
    
    const loadFormData = async () => {
      try {
        console.log('Loading form data for ID:', formId);
        
        // Load form data through our public API endpoint
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
              initialFormData[field.name] = '';
            });
          }
          setFormData(initialFormData);
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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || submitting) return;

    console.log('Submitting form with data:', formData);
    console.log('Form ID:', formId);

    setSubmitting(true);
    
    // Show a toast for slow backends (Render free tier cold start)
    const slowBackendTimer = setTimeout(() => {
      toast({ 
        title: 'Still processing...', 
        description: 'The backend is starting up. This can take up to 60 seconds on the first request.'
      });
    }, 5000);
    
    try {
      // Submit with the exact format backend expects: { "data": { field1: "value1", field2: "value2" } }
      console.log('Submitting with correct backend format:', { data: formData });
      
      // Add timeout to fetch request (90 seconds for Render cold start)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);
      
      const response = await fetch(`https://formhook-backend.onrender.com/forms/${formId}/submit`, {
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
        
        // Handle different error formats
        let errorMessage = 'Submission failed';
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map(err => err.msg || err.message || JSON.stringify(err)).join(', ');
          } else {
            errorMessage = errorData.detail;
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        throw new Error(errorMessage || `Submission failed: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('Submission success data:', responseData);

      setSubmitted(true);
      toast({ title: 'Success!', description: 'Your form has been submitted successfully.' });
    } catch (err: any) {
      console.error('Submission error:', err);
      console.error('Error type:', err.name);
      console.error('Error message:', err.message);
      console.error('Full error:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      
      let errorMessage = err.message || 'Please try again later.';
      
      // Check if it's a network error
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        errorMessage = 'Unable to connect to the server. The backend may be starting up (this takes ~30 seconds on first request) or there may be a network issue. Please try again.';
      }
      
      toast({ 
        title: 'Submission Failed', 
        description: errorMessage,
        variant: 'destructive'
      });
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
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Thank you!
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your submission has been received successfully.
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({});
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Submit Another Response
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

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-2xl backdrop-blur-sm">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/30 dark:to-purple-900/30">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {form?.name || 'Contact Form'}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Please fill out the form below and click submit.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dynamic Fields based on form configuration */}
                {form?.fields && Array.isArray(form.fields) ? (
                  form.fields.map((field, index) => (
                    <div key={field.name || index} className="space-y-2">
                      <Label 
                        htmlFor={field.name} 
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        {field.label || field.name} {field.required && '*'}
                      </Label>
                      
                      {field.type === 'textarea' ? (
                        <textarea
                          id={field.name}
                          name={field.name}
                          rows={4}
                          placeholder={field.placeholder || `Enter ${field.label || field.name}`}
                          value={String(formData[field.name] || '')}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          required={field.required}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-vertical"
                        />
                      ) : field.type === 'select' ? (
                        <select
                          id={field.name}
                          name={field.name}
                          value={String(formData[field.name] || '')}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          required={field.required}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="">Select an option</option>
                          {field.options && field.options.map((option, optIndex) => (
                            <option key={optIndex} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : field.type === 'checkbox' ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={field.name}
                            name={field.name}
                            checked={Boolean(formData[field.name])}
                            onChange={(e) => handleInputChange(field.name, e.target.checked)}
                            required={field.required}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {field.label || field.name}
                          </span>
                        </div>
                      ) : (
                        <Input
                          id={field.name}
                          name={field.name}
                          type={field.type || 'text'}
                          placeholder={field.placeholder || `Enter ${field.label || field.name}`}
                          value={String(formData[field.name] || '')}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          required={field.required}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      )}
                    </div>
                  ))
                ) : (
                  // Fallback content if no fields are defined
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>This form has no fields configured.</p>
                    <p className="text-sm mt-2">Please contact the form owner to set up the form fields.</p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <Button
                    type="submit"
                    disabled={submitting || !form?.fields?.length}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 shadow-lg"
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
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
            Powered by{' '}
            <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
              FormHook
            </Link>
          </div>
        </div>
      </div>

      <Toaster />
    </div>
  );
}
