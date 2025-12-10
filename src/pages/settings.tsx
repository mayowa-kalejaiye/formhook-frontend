import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardNav from '../components/DashboardNav';
import DashboardHeader from '../components/DashboardHeader';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import { safeReplace } from '../lib/navigation';
import { useSidebar } from '../context/SidebarContext';
import { useTheme } from '../context/ThemeContext';
import AuthLayout from '../components/AuthLayout';
import { useToast, showApiError } from '../hooks/use-toast';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  getUserProfile,
  updateUserProfile,
  exportUserData,
  deleteAccount
} from '../services/api';
import {
  Bell,
  Moon,
  Sun,
  Globe,
  Eye,
  Mail,
  Shield,
  Zap,
  Palette,
  Languages,
  Clock,
  Monitor
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  // Settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [submissionAlerts, setSubmissionAlerts] = useState(true);
  const [webhookAlerts, setWebhookAlerts] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('UTC');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [interfaceDensity, setInterfaceDensity] = useState('comfortable');
  const [itemsPerPage, setItemsPerPage] = useState('20');

  useEffect(() => {
    const timer = setTimeout(() => setHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated || !user) return;
    // Load server-side preferences if available
    (async () => {
      try {
        const prefs = await getNotificationPreferences();
        if (prefs) {
          setSubmissionAlerts(Boolean(prefs.submission_alerts ?? prefs.submission_alerts));
          setWebhookAlerts(Boolean(prefs.webhook_failures ?? prefs.webhook_failures));
        }
      } catch (e) {
        // ignore, keep defaults
      }

      try {
        const profile = await getUserProfile();
        if (profile) {
          setLanguage(profile.language || language);
          setTimezone(profile.timezone || timezone);
          setDateFormat(profile.date_format || dateFormat);
          setAnalyticsEnabled(Boolean(profile.share_analytics ?? analyticsEnabled));
        }
      } catch (e) {}
    })();
  }, [hydrated, user]);

  // Apply interface density attribute to document root so UI can respond
  useEffect(() => {
    try {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-density', interfaceDensity);
      }
    } catch (e) {}
  }, [interfaceDensity]);

  useEffect(() => {
    if (!hydrated) return;
    if (hydrated && !user) {
      safeReplace(router, '/login');
    }
  }, [hydrated, user, router]);

  const handleSaveSettings = () => {
    (async () => {
      try {
        // Persist notification preferences
        await updateNotificationPreferences({
          submission_alerts: submissionAlerts,
          webhook_failures: webhookAlerts,
          security_alerts: securityAlerts,
          // marketing emails handled separately by marketing settings
        });

        // Persist profile-level settings
        await updateUserProfile({
          timezone,
          language,
          date_format: dateFormat,
          share_analytics: analyticsEnabled
        });

        toast({
          title: 'Settings saved',
          description: 'Your preferences have been updated successfully.',
        });
      } catch (err: any) {
        showApiError(err);
      }
    })();
  };

  if (!hydrated || !user) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className={`${isCollapsed ? 'md:ml-16' : 'md:ml-64'} transition-all duration-300 ease-in-out`}>
        <DashboardNav />
        <DashboardHeader />

        <main className="pt-16 md:pt-16 min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Settings
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage your preferences and application settings
              </p>
            </div>

            <Tabs defaultValue="appearance" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2">
                <TabsTrigger value="appearance" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Appearance
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="preferences" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Preferences
                </TabsTrigger>
                <TabsTrigger value="privacy" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Privacy
                </TabsTrigger>
              </TabsList>

              {/* Appearance Settings */}
              <TabsContent value="appearance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Theme Settings</CardTitle>
                    <CardDescription>
                      Customize how FormHook looks on your device
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Theme Mode</Label>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Choose your preferred color scheme
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant={theme === 'light' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTheme('light')}
                          className="gap-2"
                        >
                          <Sun className="h-4 w-4" />
                          Light
                        </Button>
                        <Button
                          variant={theme === 'dark' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTheme('dark')}
                          className="gap-2"
                        >
                          <Moon className="h-4 w-4" />
                          Dark
                        </Button>
                        <Button
                          variant={theme === 'system' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTheme('system')}
                          className="gap-2"
                        >
                          <Monitor className="h-4 w-4" />
                          System
                        </Button>
                      </div>
                    </div>

                    <div className="border-t dark:border-slate-700 pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Interface Density</Label>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Adjust the spacing and sizing of UI elements
                          </p>
                        </div>
                        <Select value={interfaceDensity} onValueChange={setInterfaceDensity}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compact">Compact</SelectItem>
                            <SelectItem value="comfortable">Comfortable</SelectItem>
                            <SelectItem value="spacious">Spacious</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notification Settings */}
              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Notifications</CardTitle>
                    <CardDescription>
                      Choose what email notifications you want to receive
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-medium">Form Submissions</Label>
                          <Badge variant="secondary">Recommended</Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Get notified when someone submits to your forms
                        </p>
                      </div>
                      <Switch
                        checked={submissionAlerts}
                        onCheckedChange={setSubmissionAlerts}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Webhook Failures</Label>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Alert when webhook deliveries fail
                        </p>
                      </div>
                      <Switch
                        checked={webhookAlerts}
                        onCheckedChange={setWebhookAlerts}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Security Alerts</Label>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Important account and security notifications
                        </p>
                      </div>
                      <Switch
                        checked={securityAlerts}
                        onCheckedChange={setSecurityAlerts}
                        disabled
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Marketing Updates</Label>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          News, updates, and promotional content
                        </p>
                      </div>
                      <Switch
                        checked={marketingEmails}
                        onCheckedChange={setMarketingEmails}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Push Notifications</CardTitle>
                    <CardDescription>
                      Manage browser push notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Browser Notifications</Label>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Configure in the Notifications page
                        </p>
                      </div>
                      <Button variant="outline" asChild>
                        <a href="/notifications">
                          Configure
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preferences Settings */}
              <TabsContent value="preferences" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Regional Settings</CardTitle>
                    <CardDescription>
                      Set your language, timezone, and date preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Language</Label>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Choose your preferred language
                        </p>
                      </div>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                          <SelectItem value="pt">Português</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Timezone</Label>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          All dates and times will be shown in this timezone
                        </p>
                      </div>
                      <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger className="w-52">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time (GMT-5)</SelectItem>
                          <SelectItem value="America/Chicago">Central Time (GMT-6)</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time (GMT-7)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time (GMT-8)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                          <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo (GMT+9)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Date Format</Label>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          How dates are displayed throughout the app
                        </p>
                      </div>
                      <Select value={dateFormat} onValueChange={setDateFormat}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Data Display</CardTitle>
                    <CardDescription>
                      Customize how data is shown in tables and lists
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Items Per Page</Label>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Number of items shown in tables
                        </p>
                      </div>
                        <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Privacy Settings */}
              <TabsContent value="privacy" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Data & Privacy</CardTitle>
                    <CardDescription>
                      Control your data and privacy preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Analytics</Label>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Help us improve FormHook by sharing usage data
                        </p>
                      </div>
                      <Switch
                        checked={analyticsEnabled}
                        onCheckedChange={setAnalyticsEnabled}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Two-Factor Authentication</Label>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Button variant="outline">
                        Enable
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Session History</Label>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          View active sessions and sign out remotely
                        </p>
                      </div>
                      <Button variant="outline">
                        Manage
                      </Button>
                    </div>

                    <div className="border-t dark:border-slate-700 pt-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-base font-medium text-red-600 dark:text-red-400">
                            Danger Zone
                          </Label>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Irreversible actions that affect your account
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="text-base">Export Account Data</Label>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Download all your forms and submissions
                            </p>
                          </div>
                          <Button variant="outline" onClick={async () => {
                            try {
                              const blob = await exportUserData();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `formhook-account-data-${new Date().toISOString()}.zip`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              window.URL.revokeObjectURL(url);
                              toast({ title: 'Export started', description: 'Your account export has started. Check your downloads.' });
                            } catch (e: any) {
                              showApiError(e);
                            }
                          }}>
                            Export
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="text-base">Delete Account</Label>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Permanently delete your account and all data
                            </p>
                          </div>
                          <Button variant="destructive" onClick={async () => {
                            if (!confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) return;
                            try {
                              // For safety, ask for a password prompt only if UI exists; backend may require auth token so we simply call
                              await deleteAccount('');
                              toast({ title: 'Account deleted', description: 'Your account has been scheduled for deletion.' });
                              // Redirect to homepage
                              router.push('/');
                            } catch (e: any) {
                              showApiError(e);
                            }
                          }}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-4 mt-8">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={handleSaveSettings} className="gap-2">
                <Zap className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </main>
      </div>
    </AuthLayout>
  );
}
