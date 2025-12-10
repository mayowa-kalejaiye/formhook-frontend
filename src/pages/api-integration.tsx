import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, Copy, Terminal, CheckCircle2, Braces, Globe, Lock, Webhook } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import AuthLayout from '@/components/AuthLayout';
import DashboardNav from '@/components/DashboardNav';

function APIIntegrationContent() {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The code has been copied to your clipboard.",
    });
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">API Integration Guide</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Learn how to integrate FormHook with your website or application
          </p>
        </div>

        <Tabs defaultValue="quick-start" className="space-y-6">
          <TabsList>
            <TabsTrigger value="quick-start">Quick Start</TabsTrigger>
            <TabsTrigger value="html">HTML Forms</TabsTrigger>
            <TabsTrigger value="api">REST API</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>

          <TabsContent value="quick-start">
            <Card>
              <CardHeader>
                <CardTitle>Quick Start Guide</CardTitle>
                <CardDescription>Get started with FormHook in minutes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1 */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Badge>Step 1</Badge> Create a Form Endpoint
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    First, create a new form endpoint in your dashboard. You&rsquo;ll get a unique URL for your form submissions.
                  </p>
                  <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Your form endpoint will look like this:</AlertTitle>
                    <AlertDescription className="font-mono text-sm mt-2">
                      https://api.formhook.com/f/your-form-id
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Step 2 */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Badge>Step 2</Badge> Add the Form to Your Site
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Add your form endpoint to any HTML form&rsquo;s action attribute.
                  </p>
                  <Card className="bg-gray-50 dark:bg-gray-900">
                    <CardContent className="pt-6">
                      <div className="relative">
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="absolute right-2 top-2"
                          onClick={() => copyToClipboard(`<form action="https://api.formhook.com/f/your-form-id" method="POST">
  <input type="email" name="email" required />
  <button type="submit">Subscribe</button>
</form>`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <pre className="text-sm language-html">
                          <code>{`<form action="https://api.formhook.com/f/your-form-id" method="POST">
  <input type="email" name="email" required />
  <button type="submit">Subscribe</button>
</form>`}</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Step 3 */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Badge>Step 3</Badge> View Submissions
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    All form submissions will be available in your dashboard. You can also:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <li>Set up email notifications</li>
                    <li>Configure webhook notifications</li>
                    <li>Export submissions as CSV</li>
                    <li>Access submissions via API</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* remaining tabs unchanged... */}
          <TabsContent value="html">
            <Card>
              <CardHeader>
                <CardTitle>HTML Forms Integration</CardTitle>
                <CardDescription>Detailed guide for HTML form integration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic HTML Form */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Basic HTML Form</h3>
                  <Card className="bg-gray-50 dark:bg-gray-900">
                    <CardContent className="pt-6">
                      <div className="relative">
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="absolute right-2 top-2"
                          onClick={() => copyToClipboard(`<form 
  action="https://api.formhook.com/f/your-form-id" 
  method="POST"
  enctype="multipart/form-data"
>
  <input type="text" name="name" placeholder="Your name" required />
  <input type="email" name="email" placeholder="Your email" required />
  <textarea name="message" placeholder="Your message"></textarea>
  <input type="file" name="attachment" />
  <button type="submit">Send Message</button>
</form>`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <pre className="text-sm language-html">
                          <code>{`<form 
  action="https://api.formhook.com/f/your-form-id" 
  method="POST"
  enctype="multipart/form-data"
>
  <input type="text" name="name" placeholder="Your name" required />
  <input type="email" name="email" placeholder="Your email" required />
  <textarea name="message" placeholder="Your message"></textarea>
  <input type="file" name="attachment" />
  <button type="submit">Send Message</button>
</form>`}</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Custom Redirect */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Custom Success/Error Pages</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You can specify custom redirect URLs for successful submissions or errors.
                  </p>
                  <Card className="bg-gray-50 dark:bg-gray-900">
                    <CardContent className="pt-6">
                      <div className="relative">
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="absolute right-2 top-2"
                          onClick={() => copyToClipboard(`<form action="https://api.formhook.com/f/your-form-id" method="POST">
  <input type="hidden" name="_success_url" value="https://your-site.com/thank-you" />
  <input type="hidden" name="_error_url" value="https://your-site.com/error" />
  <!-- your form fields -->
</form>`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <pre className="text-sm language-html">
                          <code>{`<form action="https://api.formhook.com/f/your-form-id" method="POST">
  <input type="hidden" name="_success_url" value="https://your-site.com/thank-you" />
  <input type="hidden" name="_error_url" value="https://your-site.com/error" />
  <!-- your form fields -->
</form>`}</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* AJAX Submission */}
                <div className="space-y-4">
                  <h3 className="font-semibold">AJAX Form Submission</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    For a seamless experience, you can submit forms using JavaScript.
                  </p>
                  <Card className="bg-gray-50 dark:bg-gray-900">
                    <CardContent className="pt-6">
                      <div className="relative">
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="absolute right-2 top-2"
                          onClick={() => copyToClipboard(`const form = document.querySelector('form');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  
  try {
    const response = await fetch('https://api.formhook.com/f/your-form-id', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      alert('Form submitted successfully!');
    } else {
      alert('Form submission failed.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
});`) }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <pre className="text-sm language-javascript">
                          <code>{`const form = document.querySelector('form');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  
  try {
    const response = await fetch('https://api.formhook.com/f/your-form-id', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      alert('Form submitted successfully!');
    } else {
      alert('Form submission failed.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
});`}</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>REST API Guide</CardTitle>
                <CardDescription>Send form submissions programmatically using our REST API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Authentication */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Lock className="h-4 w-4" /> Authentication
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    All API requests must include your API key in the Authorization header.
                  </p>
                  <Card className="bg-gray-50 dark:bg-gray-900">
                    <CardContent className="pt-6">
                      <div className="relative">
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="absolute right-2 top-2"
                          onClick={() => copyToClipboard(`Authorization: Bearer your-api-key`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <pre className="text-sm">
                          <code>Authorization: Bearer your-api-key</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Submit Form */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Globe className="h-4 w-4" /> Submit Form Data
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Send a POST request to your form endpoint with the form data.
                  </p>
                  <Card className="bg-gray-50 dark:bg-gray-900">
                    <CardContent className="pt-6">
                      <div className="relative">
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="absolute right-2 top-2"
                          onClick={() => copyToClipboard(`curl -X POST \\
  https://api.formhook.com/f/your-form-id \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello world!"
  }'`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <pre className="text-sm">
                          <code>{`curl -X POST \\
  https://api.formhook.com/f/your-form-id \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello world!"
  }'`}</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Fetch Submissions */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Braces className="h-4 w-4" /> Fetch Submissions
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Retrieve form submissions using the API.
                  </p>
                  <Card className="bg-gray-50 dark:bg-gray-900">
                    <CardContent className="pt-6">
                      <div className="relative">
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="absolute right-2 top-2"
                          onClick={() => copyToClipboard(`curl \\
  https://api.formhook.com/v1/forms/your-form-id/submissions \\
  -H "Authorization: Bearer your-api-key"`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <pre className="text-sm">
                          <code>{`curl \\
  https://api.formhook.com/v1/forms/your-form-id/submissions \\
  -H "Authorization: Bearer your-api-key"`}</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Integration</CardTitle>
                <CardDescription>Receive real-time notifications for form submissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Webhook Setup */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Webhook className="h-4 w-4" /> Webhook Configuration
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configure webhooks to receive real-time notifications when forms are submitted.
                  </p>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Webhook Payload Example</AlertTitle>
                    <AlertDescription>
                      <pre className="text-sm mt-2">
                        <code>{`{
  "form_id": "your-form-id",
  "submission_id": "sub_123abc",
  "submitted_at": "2025-10-23T12:00:00Z",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello world!"
  }
}`}</code>
                      </pre>
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Webhook Security */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Webhook Security</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Verify webhook authenticity using the signing secret.
                  </p>
                  <Card className="bg-gray-50 dark:bg-gray-900">
                    <CardContent className="pt-6">
                      <div className="relative">
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="absolute right-2 top-2"
                          onClick={() => copyToClipboard(`const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <pre className="text-sm">
                          <code>{`const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}`}</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Retry Policy */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Retry Policy</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Failed webhook deliveries are automatically retried with exponential backoff:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <li>1st retry: 5 minutes</li>
                    <li>2nd retry: 15 minutes</li>
                    <li>3rd retry: 30 minutes</li>
                    <li>4th retry: 1 hour</li>
                    <li>5th retry: 2 hours</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function APIIntegrationPage() {
  return (
    <AuthLayout>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 md:ml-56 transition-all duration-300 ease-in-out">
        <DashboardNav />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-4">
          <APIIntegrationContent />
        </main>
      </div>
    </AuthLayout>
  );
}
