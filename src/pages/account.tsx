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
import { 
  User, 
  Shield, 
  Key, 
  Trash2,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { toast, showApiError } from '../hooks/use-toast';
import { Toaster } from '../components/ui/toaster';
import { 
  getUserProfile,
  updateUserProfile,
  changePassword,
  deleteAccount
} from '../services/api';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  email_verified: boolean;
}

function UserAccountSettingsContent() {
  const { isCollapsed } = useSidebar();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Load profile
  useEffect(() => {
    loadUserProfile();
  }, []);
  
  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const profileData = await getUserProfile();
      
      if (profileData) {
        setProfile({
          id: profileData.id || '',
          email: profileData.email || user?.email || '',
          name: profileData.name || user?.email?.split('@')[0] || '',
          email_verified: profileData.email_verified || false,
        });
      } else if (user?.email) {
        setProfile({
          id: user.userId || '',
          email: user.email,
          name: user.email.split('@')[0],
          email_verified: user.verified || false,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      if (user?.email) {
        setProfile({
          id: user.userId || '',
          email: user.email,
          name: user.email.split('@')[0],
          email_verified: user.verified || false,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      await updateUserProfile({
        name: profile.name,
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
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
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

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and all your forms and submissions will be permanently deleted.'
    );
    
    if (!confirmed) return;

    const password = window.prompt('Please enter your password to confirm account deletion:');
    if (!password) {
      toast({
        title: 'Password required',
        description: 'Account deletion was canceled because no password was provided.',
      });
      return;
    }

    setSaving(true);
    try {
      await deleteAccount(password);
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (error) {
      showApiError(error, { fallbackTitle: 'Deletion Failed' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <BottomGradientRadial>
        <div className={`min-h-screen flex flex-col ${isCollapsed ? 'md:ml-16' : 'md:ml-56'} transition-all duration-300 ease-in-out`}>
          <DashboardNav />
          <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 pt-12">
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          </main>
        </div>
      </BottomGradientRadial>
    );
  }

  return (
    <BottomGradientRadial>
      <div className={`min-h-screen flex flex-col ${isCollapsed ? 'md:ml-16' : 'md:ml-56'} transition-all duration-300 ease-in-out`}>
        <DashboardNav />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 pt-12 pb-12">
          <Toaster />
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button asChild variant="ghost" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Account Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your account and security
              </p>
            </div>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 gap-6">
            
            {/* Profile Card */}
            <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Update your name and view email</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                  <Input
                    id="name"
                    value={profile?.name || ''}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="Enter your full name"
                    disabled={!profile}
                    className="bg-white dark:bg-gray-800"
                  />
                </div>

                {/* Email - Read Only */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || ''}
                      readOnly
                      className="bg-gray-50 dark:bg-gray-800 pr-12"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {profile?.email_verified ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {profile?.email_verified ? '✓ Email verified' : '⚠ Email not verified'}
                  </p>
                </div>

                {/* Save Button */}
                <Button 
                  onClick={handleSaveProfile}
                  disabled={saving || !profile}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardContent>
            </Card>

            {/* Security Card */}
            <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>Manage your password</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
               
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-sm font-medium">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPasswords.current ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="bg-white dark:bg-gray-800 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPasswords.new ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 8 characters)"
                      className="bg-white dark:bg-gray-800 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="bg-white dark:bg-gray-800 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Change Password Button */}
                <Button 
                  onClick={handleChangePassword}
                  disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Key className="h-4 w-4 mr-2" />
                  {saving ? 'Updating...' : 'Change Password'}
                </Button>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <CardTitle className="text-red-700 dark:text-red-400">Danger Zone</CardTitle>
                    <CardDescription>Irreversible actions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Deleting your account is permanent. All your forms, submissions, and data will be permanently deleted.
                  </p>
                  <Button 
                    onClick={handleDeleteAccount}
                    disabled={saving}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {saving ? 'Processing...' : 'Delete Account'}
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
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
