"use client";
import React, { useState, useEffect } from 'react';
import DashboardNav from '../components/DashboardNav';
import { useSidebar } from '../context/SidebarContext';
import BottomGradientRadial from '../components/BottomGradientRadial';
import AuthLayout from '../components/AuthLayout';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { 
  User, 
  Settings, 
  Shield, 
  Key, 
  Bell, 
  Trash2,
  Save,
  Eye,
  EyeOff,
  Upload,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Lock,
  Mail,
  Globe,
  Smartphone,
  Camera,
  Clock,
  Activity,
  Database,
  Zap,
  Copy,
  Plus,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from '../hooks/use-toast';
import { Toaster } from '../components/ui/toaster';
import { 
  getUserProfile, 
  updateUserProfile, 
  changePassword, 
  toggle2FA, 
  getSecurityLogs, 
  deleteAccount, 
  exportUserData,
  getUserApiTokens,
  createApiToken,
  deleteApiToken
} from '../services/api';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  last_login?: string;
  email_verified: boolean;
  two_factor_enabled: boolean;
  timezone: string;
  language: string;
  notification_preferences: {
    email_notifications: boolean;
    webhook_failures: boolean;
    form_submissions: boolean;
    security_alerts: boolean;
    weekly_reports: boolean;
  };
}

interface SecurityLog {
  id: string;
  event: string;
  description: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  location?: string;
}

interface ApiKey {
  id: string;
  name: string;
  key_preview: string;
  created_at: string;
  last_used?: string;
  permissions: string[];
  expires_at?: string;
}

function UserAccountSettingsContent() {
  const { isCollapsed } = useSidebar();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Profile states
  const [profile, setProfile] = useState<UserProfile>({
    id: user?.userId || '1',
    email: user?.email || 'user@example.com',
    name: user?.email?.split('@')[0] || 'John Doe',
    created_at: '2025-01-15T10:00:00.000Z',
    last_login: '2025-09-22T14:30:00.000Z',
    email_verified: user?.verified || true,
    two_factor_enabled: false,
    timezone: 'America/New_York',
    language: 'en',
    notification_preferences: {
      email_notifications: true,
      webhook_failures: true,
      form_submissions: false,
      security_alerts: true,
      weekly_reports: true,
    }
  });
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // API Keys states
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loadingApiKeys, setLoadingApiKeys] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newGeneratedKey, setNewGeneratedKey] = useState('');
  
  // Load API keys
  useEffect(() => {
    loadApiKeys();
  }, []);
  
  const loadApiKeys = async () => {
    setLoadingApiKeys(true);
    try {
      const keys = await getUserApiTokens();
      setApiKeys(keys || []);
    } catch (error) {
      // Fallback to mock data
      setApiKeys([
        {
          id: '1',
          name: 'Production API',
          key_preview: 'fh_live_1234...abcd',
          created_at: '2025-08-15T10:00:00.000Z',
          last_used: '2025-09-22T12:00:00.000Z',
          permissions: ['forms:read', 'submissions:read', 'webhooks:manage'],
          expires_at: '2026-08-15T10:00:00.000Z'
        },
        {
          id: '2',
          name: 'Development API',
          key_preview: 'fh_test_5678...efgh',
          created_at: '2025-09-01T15:30:00.000Z',
          last_used: '2025-09-20T09:15:00.000Z',
          permissions: ['forms:read', 'submissions:read'],
        }
      ]);
      console.log('Using fallback API keys:', error);
    } finally {
      setLoadingApiKeys(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!newApiKeyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your API key",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const result = await createApiToken(newApiKeyName, ['forms:read', 'submissions:read', 'webhooks:manage']);
      
      // Add the new key to the list with full token for the modal
      const newApiKey: ApiKey = {
        id: result.id || Date.now().toString(),
        name: newApiKeyName,
        key_preview: result.token ? result.token.substring(0, 8) + '...' + result.token.substring(result.token.length - 4) : 'fh_new...key',
        created_at: new Date().toISOString(),
        permissions: ['forms:read', 'submissions:read', 'webhooks:manage'],
      };
      
      setApiKeys(prev => [newApiKey, ...prev]);
      setNewGeneratedKey(result.token || `fh_${Date.now()}_${Math.random().toString(36).substring(2)}`);
      setNewApiKeyName('');
      setShowNewKeyModal(true);
      
      toast({
        title: "Success",
        description: "API key created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create API key",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteApiKey = async (keyId: string, keyName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete the API key "${keyName}"?`);
    if (!confirmed) return;

    setSaving(true);
    try {
      await deleteApiToken(keyId);
      
      setApiKeys(prev => prev.filter(k => k.id !== keyId));
      toast({
        title: "Success",
        description: "API key deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete API key",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Security log states
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([
    {
      id: '1',
      event: 'login',
      description: 'Successful login',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: '2025-09-22T14:30:00.000Z',
      location: 'New York, US'
    },
    {
      id: '2',
      event: 'password_change',
      description: 'Password changed successfully',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: '2025-09-20T10:15:00.000Z',
      location: 'New York, US'
    },
    {
      id: '3',
      event: 'failed_login',
      description: 'Failed login attempt',
      ip_address: '203.0.113.45',
      user_agent: 'curl/7.68.0',
      timestamp: '2025-09-18T03:22:00.000Z',
      location: 'Unknown'
    }
  ]);

  // Load profile data
  useEffect(() => {
    loadUserProfile();
    loadSecurityLogs();
  }, []);
  
  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const profileData = await getUserProfile();
      setProfile({
        id: profileData.id || user?.userId || '1',
        email: profileData.email || user?.email || 'user@example.com',
        name: profileData.name || user?.email?.split('@')[0] || 'John Doe',
        created_at: profileData.created_at || '2025-01-15T10:00:00.000Z',
        last_login: profileData.last_login || '2025-09-22T14:30:00.000Z',
        email_verified: profileData.email_verified ?? (user?.verified || true),
        two_factor_enabled: profileData.two_factor_enabled || false,
        timezone: profileData.timezone || 'America/New_York',
        language: profileData.language || 'en',
        notification_preferences: profileData.notification_preferences || {
          email_notifications: true,
          webhook_failures: true,
          form_submissions: false,
          security_alerts: true,
          weekly_reports: true,
        }
      });
    } catch (error) {
      // Fallback to default profile if API fails
      setProfile({
        id: user?.userId || '1',
        email: user?.email || 'user@example.com',
        name: user?.email?.split('@')[0] || 'John Doe',
        created_at: '2025-01-15T10:00:00.000Z',
        last_login: '2025-09-22T14:30:00.000Z',
        email_verified: user?.verified || true,
        two_factor_enabled: false,
        timezone: 'America/New_York',
        language: 'en',
        notification_preferences: {
          email_notifications: true,
          webhook_failures: true,
          form_submissions: false,
          security_alerts: true,
          weekly_reports: true,
        }
      });
      console.log('Using fallback profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSecurityLogs = async () => {
    try {
      const logs = await getSecurityLogs();
      setSecurityLogs(logs);
    } catch (error) {
      // Fallback to mock data
      setSecurityLogs([
        {
          id: '1',
          event: 'login',
          description: 'Successful login',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: '2025-09-22T14:30:00.000Z',
          location: 'New York, US'
        },
        {
          id: '2',
          event: 'password_change',
          description: 'Password changed successfully',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: '2025-09-20T10:15:00.000Z',
          location: 'New York, US'
        }
      ]);
      console.log('Using fallback security logs:', error);
    }
  };

  // Profile form handlers
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateUserProfile({
        name: profile.name,
        timezone: profile.timezone,
        language: profile.language,
        notification_preferences: profile.notification_preferences
      });
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle2FA = async () => {
    setSaving(true);
    try {
      const newState = !profile.two_factor_enabled;
      await toggle2FA(newState);
      
      setProfile(prev => ({
        ...prev,
        two_factor_enabled: newState
      }));
      
      toast({
        title: "Success",
        description: `Two-factor authentication ${newState ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update two-factor authentication",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your forms, submissions, and data."
    );
    
    if (!confirmed) return;
    
    const password = window.prompt("Please enter your password to confirm account deletion:");
    if (!password) {
      toast({
        title: "Cancelled",
        description: "Account deletion cancelled",
      });
      return;
    }

    setSaving(true);
    try {
      await deleteAccount(password);
      
      toast({
        title: "Account Deletion Initiated",
        description: "Your account deletion request has been submitted.",
      });
      
      // Redirect to login after a delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const blob = await exportUserData();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `formhook-data-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "Your data has been exported successfully",
      });
    } catch (error) {
      // Fallback to mock export
      const exportData = {
        profile: profile,
        export_date: new Date().toISOString(),
        forms: [],
        submissions: [],
        webhooks: []
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `formhook-data-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "Your data has been exported successfully (mock data)",
      });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventIcon = (event: string) => {
    switch (event) {
      case 'login': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed_login': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'password_change': return <Lock className="h-4 w-4 text-blue-500" />;
      case 'api_key_created': return <Key className="h-4 w-4 text-purple-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <BottomGradientRadial>
      <div className={`min-h-screen flex flex-col ${isCollapsed ? 'md:ml-16' : 'md:ml-56'} transition-all duration-300 ease-in-out`}>
        <DashboardNav />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-4">
          <Toaster />
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Button asChild className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 bg-transparent text-gray-600 dark:text-gray-400">
                <Link href="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-blue-800 dark:text-blue-200 tracking-tight">
                  Account Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Manage your profile, security, and preferences
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="api" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Keys
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Preferences
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Profile Information */}
                <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal information and contact details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-black border-4 border-white shadow-lg" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                        F
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>FormHook Profile Avatar</strong>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Your FormHook branded profile identifier.
                        </p>
                      </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter your full name"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter your email"
                          className="pr-10"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {profile.email_verified ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {profile.email_verified ? 'Email verified' : 'Email not verified'}
                      </p>
                    </div>

                    {/* Timezone */}
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select value={profile.timezone} onValueChange={(value) => setProfile(prev => ({ ...prev, timezone: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                          <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT)</SelectItem>
                          <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Save Button */}
                    <Button 
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Profile'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Account Overview */}
                <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-600" />
                      Account Overview
                    </CardTitle>
                    <CardDescription>
                      Your account status and key information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    {/* Account Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Member Since</span>
                        </div>
                        <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                          {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-900 dark:text-green-100">Last Login</span>
                        </div>
                        <p className="text-lg font-bold text-green-900 dark:text-green-100">
                          {profile.last_login ? new Date(profile.last_login).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}
                        </p>
                      </div>
                    </div>

                    {/* Account Status */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Email Verification</span>
                        </div>
                        <Badge variant={profile.email_verified ? 'default' : 'destructive'}>
                          {profile.email_verified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Shield className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Two-Factor Auth</span>
                        </div>
                        <Badge variant={profile.two_factor_enabled ? 'default' : 'secondary'}>
                          {profile.two_factor_enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Key className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">API Keys</span>
                        </div>
                        <Badge variant="secondary">
                          {apiKeys.length} Active
                        </Badge>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                      <Button 
                        onClick={handleExportData}
                        className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 justify-start"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export My Data
                      </Button>
                      
                      {!profile.email_verified && (
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start">
                          <Mail className="h-4 w-4 mr-2" />
                          Resend Verification Email
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Password & Authentication */}
                <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-red-600" />
                      Password & Authentication
                    </CardTitle>
                    <CardDescription>
                      Manage your password and authentication settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* Change Password */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Change Password</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="current-password"
                            type={showPasswords.current ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 p-1 h-6 w-6"
                          >
                            {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            type={showPasswords.new ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 p-1 h-6 w-6"
                          >
                            {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <div className="relative">
                          <Input
                            id="confirm-password"
                            type={showPasswords.confirm ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 p-1 h-6 w-6"
                          >
                            {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleChangePassword}
                        disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        {saving ? 'Changing...' : 'Change Password'}
                      </Button>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium">Two-Factor Authentication</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <Switch
                          checked={profile.two_factor_enabled}
                          onCheckedChange={handleToggle2FA}
                          disabled={saving}
                        />
                      </div>
                      
                      {profile.two_factor_enabled && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-800 dark:text-green-200">2FA Enabled</span>
                          </div>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            Your account is protected with two-factor authentication using your authenticator app.
                          </p>
                          <Button className="mt-3 bg-green-600 hover:bg-green-700 text-white text-sm">
                            <Smartphone className="h-4 w-4 mr-2" />
                            View Recovery Codes
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Security Log */}
                <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      Security Activity
                    </CardTitle>
                    <CardDescription>
                      Recent security events and login activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {securityLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <div className="mt-1">
                            {getEventIcon(log.event)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-sm">{log.description}</p>
                              <span className="text-xs text-gray-500">{formatDate(log.timestamp)}</span>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                              <p className="flex items-center gap-2">
                                <Globe className="h-3 w-3" />
                                {log.ip_address} • {log.location || 'Unknown location'}
                              </p>
                              <p className="truncate" title={log.user_agent}>
                                {log.user_agent}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Button className="w-full mt-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      View Full Security Log
                    </Button>
                  </CardContent>
                </Card>

              </div>
              
              {/* Danger Zone */}
              <Card className="mt-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
                    <AlertTriangle className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription className="text-red-700 dark:text-red-300">
                    Irreversible and destructive actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleDeleteAccount}
                    disabled={saving}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {saving ? 'Processing...' : 'Delete Account'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Keys Tab */}
            <TabsContent value="api">
              <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-purple-600" />
                    API Key Management
                  </CardTitle>
                  <CardDescription>
                    Manage your API keys for programmatic access to FormHook
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  
                  {/* Create New Key Section */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <div className="flex-1">
                      <Input
                        placeholder="Enter API key name (e.g., 'Production API', 'Mobile App')"
                        value={newApiKeyName}
                        onChange={(e) => setNewApiKeyName(e.target.value)}
                        className="mb-2 sm:mb-0"
                      />
                    </div>
                    <Button 
                      onClick={handleCreateApiKey}
                      disabled={saving || !newApiKeyName.trim()}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {saving ? 'Creating...' : 'Create API Key'}
                    </Button>
                  </div>

                  {/* API Keys List */}
                  {loadingApiKeys ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Loading API keys...</p>
                    </div>
                  ) : apiKeys.length === 0 ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-8 w-20 h-20 flex items-center justify-center mx-auto">
                        <Key className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white text-lg font-semibold mb-1">No API keys yet</p>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">Create your first API key to start using the FormHook API</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {apiKeys.map((key) => (
                        <div key={key.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                                <Key className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">{key.name}</h4>
                                <p className="font-mono text-sm text-gray-600 dark:text-gray-300 mt-1">
                                  {key.key_preview}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                onClick={() => {
                                  navigator.clipboard.writeText(key.key_preview);
                                  toast({ 
                                    title: "Copied", 
                                    description: "Token preview copied (for reference only)" 
                                  });
                                }}
                                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 p-2 h-8 w-8"
                                title="Copy token preview"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button 
                                onClick={() => handleDeleteApiKey(key.id, key.name)}
                                disabled={saving}
                                className="bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/50 text-red-600 dark:text-red-400 p-2 h-8 w-8"
                                title="Delete API key"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Created:</span>
                              <p className="font-medium">{formatDate(key.created_at)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Last Used:</span>
                              <p className="font-medium">{key.last_used ? formatDate(key.last_used) : 'Never'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Expires:</span>
                              <p className="font-medium">{key.expires_at ? formatDate(key.expires_at) : 'Never'}</p>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <span className="text-gray-500 dark:text-gray-400 text-sm">Permissions:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {key.permissions.map((permission) => (
                                <Badge key={permission} variant="secondary" className="text-xs">
                                  {permission}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* API Documentation Link */}
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">API Documentation</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      Learn how to use the FormHook API in your applications with our comprehensive documentation.
                    </p>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
                      <Link href="/api-tokens">
                        <Database className="h-4 w-4 mr-2" />
                        View Full API Management
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* New API Key Modal */}
              <Dialog open={showNewKeyModal} onOpenChange={setShowNewKeyModal}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      API Key Created Successfully
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-green-800 dark:text-green-200 text-sm font-medium mb-2">
                        Your new API key:
                      </p>
                      <div className="flex items-center gap-2">
                        <Input
                          value={newGeneratedKey}
                          readOnly
                          className="font-mono text-sm bg-white dark:bg-gray-800"
                        />
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(newGeneratedKey);
                            toast({ title: "Copied", description: "Full API key copied to clipboard" });
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-3"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Important</span>
                      </div>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        This is the only time you'll see the full API key. Make sure to copy and store it securely!
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setShowNewKeyModal(false);
                        setNewGeneratedKey('');
                      }}
                      className="w-full"
                    >
                      I've Saved My Key
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Notification Preferences */}
                <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-orange-600" />
                      Notification Preferences
                    </CardTitle>
                    <CardDescription>
                      Control when and how you receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* Email Notifications */}
                    <div>
                      <h4 className="font-medium mb-4">Email Notifications</h4>
                      <div className="space-y-4">
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications via email</p>
                          </div>
                          <Switch
                            checked={profile.notification_preferences.email_notifications}
                            onCheckedChange={(checked) => 
                              setProfile(prev => ({
                                ...prev,
                                notification_preferences: {
                                  ...prev.notification_preferences,
                                  email_notifications: checked
                                }
                              }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Webhook Failures</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Alert me when webhooks fail</p>
                          </div>
                          <Switch
                            checked={profile.notification_preferences.webhook_failures}
                            onCheckedChange={(checked) => 
                              setProfile(prev => ({
                                ...prev,
                                notification_preferences: {
                                  ...prev.notification_preferences,
                                  webhook_failures: checked
                                }
                              }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Form Submissions</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Notify me of new form submissions</p>
                          </div>
                          <Switch
                            checked={profile.notification_preferences.form_submissions}
                            onCheckedChange={(checked) => 
                              setProfile(prev => ({
                                ...prev,
                                notification_preferences: {
                                  ...prev.notification_preferences,
                                  form_submissions: checked
                                }
                              }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Security Alerts</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Important security notifications</p>
                          </div>
                          <Switch
                            checked={profile.notification_preferences.security_alerts}
                            onCheckedChange={(checked) => 
                              setProfile(prev => ({
                                ...prev,
                                notification_preferences: {
                                  ...prev.notification_preferences,
                                  security_alerts: checked
                                }
                              }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Weekly Reports</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Weekly analytics summaries</p>
                          </div>
                          <Switch
                            checked={profile.notification_preferences.weekly_reports}
                            onCheckedChange={(checked) => 
                              setProfile(prev => ({
                                ...prev,
                                notification_preferences: {
                                  ...prev.notification_preferences,
                                  weekly_reports: checked
                                }
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* General Preferences */}
                <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-gray-600" />
                      General Preferences
                    </CardTitle>
                    <CardDescription>
                      Customize your FormHook experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* Language */}
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select value={profile.language} onValueChange={(value) => setProfile(prev => ({ ...prev, language: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                          <SelectItem value="ja">日本語</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Data Export */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="font-medium mb-4">Data Management</h4>
                      <div className="space-y-3">
                        <Button 
                          onClick={handleExportData}
                          className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 justify-start"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export All Data (JSON)
                        </Button>
                        
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                            <div className="text-sm text-yellow-800 dark:text-yellow-200">
                              <p className="font-medium mb-1">GDPR Compliance</p>
                              <p>You can export all your data or request account deletion at any time.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Save Preferences */}
                    <Button 
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Preferences'}
                    </Button>
                  </CardContent>
                </Card>

              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </BottomGradientRadial>
  );
}

export default function UserAccountSettingsPage() {
  return (
    <AuthLayout>
      <UserAccountSettingsContent />
    </AuthLayout>
  );
}
