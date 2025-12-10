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
import { useRouter } from 'next/router';
import { toast, showApiError } from '../hooks/use-toast';
import { Toaster } from '../components/ui/toaster';
import { 
  getUserProfile, 
  updateUserProfile, 
  changePassword, 
  toggle2FA, 
  getSecurityLogs, 
  deleteAccount, 
  exportUserData
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

function UserAccountSettingsContent() {
  const { isCollapsed } = useSidebar();
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Profile states
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Security log states
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);

  // Load profile data
  useEffect(() => {
    loadUserProfile();
    loadSecurityLogs();
  }, []);
  
  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const profileData = await getUserProfile();
      
      if (!profileData) {
        // Fallback to user data from AuthContext if API fails
        if (user?.email) {
          console.log('[Account] Using fallback profile from AuthContext');
          const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
          setProfile({
            id: user.userId || storedUserId || '',
            email: user.email,
            name: user.email.split('@')[0],
            created_at: new Date().toISOString(),
            last_login: undefined,
            email_verified: user.verified || false,
            two_factor_enabled: false,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
            language: navigator.language.split('-')[0] || 'en',
            notification_preferences: {
              email_notifications: true,
              webhook_failures: true,
              form_submissions: false,
              security_alerts: true,
              weekly_reports: true,
            }
          });
        } else {
          console.error('[Account] Profile data is null and no user in context');
          showApiError({ message: 'Failed to load profile data' }, { fallbackTitle: 'Profile Error' });
          setProfile(null);
        }
        return;
      }
      
      const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
      setProfile({
        id: profileData.id || user?.userId || storedUserId || '',
        email: profileData.email || user?.email || '',
        name: profileData.name || user?.email?.split('@')[0] || '',
        created_at: profileData.created_at || new Date().toISOString(),
        last_login: profileData.last_login,
        email_verified: profileData.email_verified ?? user?.verified ?? false,
        two_factor_enabled: profileData.two_factor_enabled || false,
        timezone: profileData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
        language: profileData.language || navigator.language.split('-')[0] || 'en',
        notification_preferences: profileData.notification_preferences || {
          email_notifications: true,
          webhook_failures: true,
          form_submissions: false,
          security_alerts: true,
          weekly_reports: true,
        }
      });
    } catch (error) {
      console.error('[Account] Error loading profile:', error);
      
      // Fallback to user data from AuthContext
      if (user?.email) {
        console.log('[Account] Using fallback profile from AuthContext after error');
        const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
        setProfile({
          id: user.userId || storedUserId || '',
          email: user.email,
          name: user.email.split('@')[0],
          created_at: new Date().toISOString(),
          last_login: undefined,
          email_verified: user.verified || false,
          two_factor_enabled: false,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
          language: navigator.language.split('-')[0] || 'en',
          notification_preferences: {
            email_notifications: true,
            webhook_failures: true,
            form_submissions: false,
            security_alerts: true,
            weekly_reports: true,
          }
        });
      } else {
        showApiError(error, { fallbackTitle: 'Profile Error' });
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSecurityLogs = async () => {
    try {
      const logs = await getSecurityLogs();
      setSecurityLogs(logs || []);
    } catch (error) {
      console.error('[Account] Error loading security logs:', error);
        showApiError(error, { fallbackTitle: 'Security Logs Error' });
      setSecurityLogs([]);
    }
  };

  // Profile form handlers
  const handleSaveProfile = async () => {
    if (!profile) return;
    
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
      showApiError(error, { fallbackTitle: 'Update Profile Failed' });
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
      showApiError(error, { fallbackTitle: 'Change Password Failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle2FA = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      const newState = !profile.two_factor_enabled;
      await toggle2FA(newState);
      
      setProfile(prev => prev ? ({
        ...prev,
        two_factor_enabled: newState
      }) : null);
      
      toast({
        title: "Success",
        description: `Two-factor authentication ${newState ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      showApiError(error, { fallbackTitle: 'Update 2FA Failed' });
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
      
      // Redirect to login after a delay (use SPA navigation)
      setTimeout(() => {
        try {
          const { safeReplace } = require('../lib/navigation');
          safeReplace(router, '/login');
        } catch (e) {
          try { router.replace('/login').catch(() => {}); } catch (_) {}
        }
      }, 3000);
    } catch (error) {
      showApiError(error, { fallbackTitle: 'Delete Account Failed' });
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
      console.error('[Account] Error exporting data:', error);
      showApiError(error, { fallbackTitle: 'Export Failed' });
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
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Preferences
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Loading profile...</p>
                </div>
              ) : !profile ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-gray-900 dark:text-white text-lg font-semibold mb-2">Failed to Load Profile</p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">Unable to load your profile data</p>
                  <Button onClick={loadUserProfile} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : (
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
                      <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-black border-4 border-white shadow-lg" 
                        style={{ 
                          backgroundColor: profile ? `hsl(${profile.email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 65%, 50%)` : '#3b82f6',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.5)' 
                        }}
                      >
                        {profile ? profile.email.slice(0, 2).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>{profile?.name || 'User'}</strong>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {profile?.email || 'Loading...'}
                        </p>
                      </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profile?.name || ''}
                        onChange={(e) => setProfile(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                        placeholder="Enter your full name"
                        disabled={!profile}
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Input
                          id="email"
                          type="email"
                          value={profile?.email || ''}
                          onChange={(e) => setProfile(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                          placeholder="Enter your email"
                          className="pr-10"
                          disabled={!profile}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {profile?.email_verified ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {profile?.email_verified ? 'Email verified' : 'Email not verified'}
                      </p>
                    </div>

                    {/* Timezone */}
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select 
                        value={profile?.timezone || 'America/New_York'} 
                        onValueChange={(value) => setProfile(prev => prev ? ({ ...prev, timezone: value }) : null)}
                        disabled={!profile}
                      >
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
                      disabled={saving || !profile}
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
                          {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                        </p>
                      </div>
                      
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-900 dark:text-green-100">Last Login</span>
                        </div>
                        <p className="text-lg font-bold text-green-900 dark:text-green-100">
                          {profile?.last_login ? new Date(profile.last_login).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}
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
                        <Badge variant={profile?.email_verified ? 'default' : 'destructive'}>
                          {profile?.email_verified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Shield className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Two-Factor Auth</span>
                        </div>
                        <Badge variant={profile?.two_factor_enabled ? 'default' : 'secondary'}>
                          {profile?.two_factor_enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                      <Button 
                        onClick={handleExportData}
                        disabled={!profile}
                        className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 justify-start"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export My Data
                      </Button>
                      
                      {profile && !profile.email_verified && (
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start">
                          <Mail className="h-4 w-4 mr-2" />
                          Resend Verification Email
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

              </div>
              )}
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
                          checked={profile?.two_factor_enabled || false}
                          onCheckedChange={handleToggle2FA}
                          disabled={saving || !profile}
                        />
                      </div>
                      
                      {profile?.two_factor_enabled && (
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
                            checked={profile?.notification_preferences.email_notifications || false}
                            onCheckedChange={(checked) => 
                              setProfile(prev => prev ? ({
                                ...prev,
                                notification_preferences: {
                                  ...prev.notification_preferences,
                                  email_notifications: checked
                                }
                              }) : null)
                            }
                            disabled={!profile}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Webhook Failures</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Alert me when webhooks fail</p>
                          </div>
                          <Switch
                            checked={profile?.notification_preferences.webhook_failures || false}
                            onCheckedChange={(checked) => 
                              setProfile(prev => prev ? ({
                                ...prev,
                                notification_preferences: {
                                  ...prev.notification_preferences,
                                  webhook_failures: checked
                                }
                              }) : null)
                            }
                            disabled={!profile}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Form Submissions</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Notify me of new form submissions</p>
                          </div>
                          <Switch
                            checked={profile?.notification_preferences.form_submissions || false}
                            onCheckedChange={(checked) => 
                              setProfile(prev => prev ? ({
                                ...prev,
                                notification_preferences: {
                                  ...prev.notification_preferences,
                                  form_submissions: checked
                                }
                              }) : null)
                            }
                            disabled={!profile}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Security Alerts</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Important security notifications</p>
                          </div>
                          <Switch
                            checked={profile?.notification_preferences.security_alerts || false}
                            onCheckedChange={(checked) => 
                              setProfile(prev => prev ? ({
                                ...prev,
                                notification_preferences: {
                                  ...prev.notification_preferences,
                                  security_alerts: checked
                                }
                              }) : null)
                            }
                            disabled={!profile}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Weekly Reports</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Weekly analytics summaries</p>
                          </div>
                          <Switch
                            checked={profile?.notification_preferences.weekly_reports || false}
                            onCheckedChange={(checked) => 
                              setProfile(prev => prev ? ({
                                ...prev,
                                notification_preferences: {
                                  ...prev.notification_preferences,
                                  weekly_reports: checked
                                }
                              }) : null)
                            }
                            disabled={!profile}
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
                      <Select 
                        value={profile?.language || 'en'} 
                        onValueChange={(value) => setProfile(prev => prev ? ({ ...prev, language: value }) : null)}
                        disabled={!profile}
                      >
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
                      disabled={saving || !profile}
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
