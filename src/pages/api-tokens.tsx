"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import DashboardNav from '../components/DashboardNav';
import { useSidebar } from '../context/SidebarContext';
import BottomGradientRadial from '../components/BottomGradientRadial';
import AuthLayout from '../components/AuthLayout';
import { generateApiToken, revokeApiToken } from '../services/api';
import { 
  Key, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2, 
  Plus,
  Shield,
  AlertTriangle,
  CheckCircle,
  Code,
  Zap
} from 'lucide-react';

interface ApiToken {
  id: string;
  token: string;
  token_preview: string;
  created_at: string;
  expires_at?: string;
  last_used?: string;
  name?: string;
}

function ApiTokensPageContent() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [newToken, setNewToken] = useState<string>('');
  const [showNewToken, setShowNewToken] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [copiedTokenId, setCopiedTokenId] = useState<string>('');
  const { isCollapsed } = useSidebar();

  // Mock current tokens (in real app, this would come from API)
  useEffect(() => {
    // Mock data - in real implementation, fetch existing tokens
    setTokens([
      {
        id: '1',
        token: 'fh_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        token_preview: 'fh_xxxxx...xxxxx',
        created_at: '2025-09-20T10:00:00Z',
        last_used: '2025-09-24T08:30:00Z',
        name: 'Production API'
      }
    ]);
  }, []);

  const handleGenerateToken = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await generateApiToken();
      setNewToken(result.token);
      setShowNewToken(true);
      setSuccess('API token generated successfully! Make sure to copy it now - you won\'t be able to see it again.');
      
      // Add to tokens list
      const newTokenData: ApiToken = {
        id: Date.now().toString(),
        token: result.token,
        token_preview: result.token.substring(0, 8) + '...' + result.token.substring(result.token.length - 4),
        created_at: new Date().toISOString(),
        name: 'New API Token'
      };
      setTokens(prev => [newTokenData, ...prev]);
    } catch (err) {
      setError('Failed to generate API token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to revoke this API token? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      await revokeApiToken();
      setTokens(prev => prev.filter((_, index) => index !== 0)); // Mock removal
      setSuccess('API token revoked successfully.');
    } catch (err) {
      setError('Failed to revoke API token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = async (token: string, tokenId?: string) => {
    try {
      await navigator.clipboard.writeText(token);
      if (tokenId) {
        setCopiedTokenId(tokenId);
        setTimeout(() => setCopiedTokenId(''), 2000);
      }
    } catch (err) {
      setError('Failed to copy token to clipboard.');
    }
  };

  return (
    <BottomGradientRadial>
      <div className={`min-h-screen flex flex-col ${isCollapsed ? 'md:ml-16' : 'md:ml-56'} transition-all duration-300 ease-in-out`}>
        <DashboardNav />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 pt-8 pb-4">

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                <Key className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-purple-800 dark:text-purple-200 tracking-tight">
                  API Tokens
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1 max-w-2xl">
                  Manage your API tokens for programmatic access to FormHook
                </p>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* New Token Display */}
          {newToken && showNewToken && (
            <Card className="mb-6 border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <Shield className="h-5 w-5" />
                  Your New API Token
                </CardTitle>
                <CardDescription className="text-green-700 dark:text-green-300">
                  Copy this token now - you won't be able to see it again for security reasons.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Input 
                    value={newToken}
                    readOnly
                    className="font-mono text-sm bg-white dark:bg-gray-800 border-green-300 dark:border-green-600"
                  />
                  <Button
                    onClick={() => handleCopyToken(newToken, 'new')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {copiedTokenId === 'new' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copiedTokenId === 'new' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <Button
                  onClick={() => setShowNewToken(false)}
                  className="text-green-700 border-green-300 hover:bg-green-100 dark:text-green-300 dark:border-green-600 border bg-background hover:bg-accent hover:text-accent-foreground"
                >
                  I've saved my token
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Generate New Token */}
            <div className="lg:col-span-1">
              <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-purple-600" />
                    Generate New Token
                  </CardTitle>
                  <CardDescription>
                    Create a new API token for accessing FormHook programmatically
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center gap-3 mb-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900 dark:text-blue-100">Full API Access</span>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Submit forms, manage webhooks, and access analytics
                      </p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                      <div className="flex items-center gap-3 mb-2">
                        <Shield className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium text-yellow-900 dark:text-yellow-100">Secure & Private</span>
                      </div>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Tokens are shown only once and securely hashed
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerateToken}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Generate API Token
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Existing Tokens */}
            <div className="lg:col-span-2">
              <Card className="bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-blue-600" />
                    Your API Tokens
                  </CardTitle>
                  <CardDescription>
                    Manage your existing API tokens and monitor their usage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tokens.length === 0 ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-8 w-20 h-20 flex items-center justify-center mx-auto">
                        <Key className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white text-lg font-semibold mb-1">No API tokens yet</p>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">Generate your first API token to start using the FormHook API</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Security Notice</span>
                        </div>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          For security, only token previews are shown here. Full tokens are displayed only once when generated.
                        </p>
                      </div>
                      <div className="space-y-4">
                      {tokens.map((token, index) => (
                        <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                                <Key className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm text-gray-900 dark:text-white">
                                    {token.token_preview}
                                  </span>
                                  <Badge variant="secondary" className="text-xs">
                                    {token.name || 'API Token'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  <span>Created: {new Date(token.created_at).toLocaleDateString()}</span>
                                  {token.last_used && (
                                    <span>Last used: {new Date(token.last_used).toLocaleDateString()}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                onClick={() => handleCopyToken(token.token_preview, token.id)}
                                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 p-2 h-8 w-8"
                                title="Copy token preview (for reference only)"
                              >
                                {copiedTokenId === token.id ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              </Button>
                              <Button
                                onClick={() => handleRevokeToken(token.token)}
                                className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20 border bg-background hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3"
                                title="Revoke this token"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* API Documentation */}
          <Card className="mt-6 bg-white/95 dark:bg-gray-900/95 border-0 shadow-xl rounded-2xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-green-600" />
                Using Your API Token
              </CardTitle>
              <CardDescription>
                Learn how to authenticate API requests with your token
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Authentication</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <code className="text-sm text-gray-800 dark:text-gray-200">
                      {`curl -X POST \\
  https://api.formhook.com/submit/your-form-id \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "message": "Hello"}'`}
                    </code>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">JavaScript Example</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <code className="text-sm text-gray-800 dark:text-gray-200">
                      {`fetch('https://api.formhook.com/submit/form-id', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email: 'user@example.com' })
})`}
                    </code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </main>
      </div>
    </BottomGradientRadial>
  );
}

export default function ApiTokensPage() {
  return (
    <AuthLayout>
      <ApiTokensPageContent />
    </AuthLayout>
  );
}
