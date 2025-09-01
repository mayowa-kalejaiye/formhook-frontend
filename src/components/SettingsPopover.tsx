import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { generateApiToken, revokeApiToken } from '../services/api';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { Sun, Moon, LogOut, KeyRound, User2 } from 'lucide-react';


interface SettingsPopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const SettingsPopover: React.FC<SettingsPopoverProps> = ({ open, onOpenChange }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [apiToken, setApiToken] = React.useState<string>('••••••••••••••••••••••••');
  const [showToken, setShowToken] = React.useState(false);
  const [tokenLoading, setTokenLoading] = React.useState(false);
  const [tokenError, setTokenError] = React.useState<string | null>(null);

  // Use real user email from AuthContext
  const email = user?.email || 'user@email.com';

  const handleThemeChange = (t: 'light' | 'dark' | 'system') => setTheme(t);
  const handleCopyToken = () => {
    navigator.clipboard.writeText(apiToken);
  };
  const handleRegenerateToken = async () => {
    setTokenLoading(true);
    setTokenError(null);
    try {
      const res = await generateApiToken();
      if (res.data?.token) {
        setApiToken(res.data.token);
        setShowToken(true);
      } else {
        setTokenError('No token returned.');
      }
    } catch (err: any) {
      setTokenError(err?.response?.data?.detail || err?.response?.data?.message || 'Failed to generate token.');
    } finally {
      setTokenLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent forceMount className="w-80 p-0 rounded-xl shadow-xl border-2 border-red-500 bg-white dark:bg-black z-[9999]">
        <div className="p-4">
          <div className="font-semibold text-lg mb-2">Settings</div>
          {/* Theme */}
          <div className="mb-4">
            <div className="text-xs font-medium text-muted-foreground mb-1">Theme</div>
            <div className="flex gap-2">
              <Button variant={theme === 'light' ? 'default' : 'outline'} size="sm" onClick={() => handleThemeChange('light')}><Sun className="w-4 h-4 mr-1" />Light</Button>
              <Button variant={theme === 'dark' ? 'default' : 'outline'} size="sm" onClick={() => handleThemeChange('dark')}><Moon className="w-4 h-4 mr-1" />Dark</Button>
              <Button variant={theme === 'system' ? 'default' : 'outline'} size="sm" onClick={() => handleThemeChange('system')}>System</Button>
            </div>
          </div>
          {/* API Token */}
          <div className="mb-4">
            <div className="text-xs font-medium text-muted-foreground mb-1">API Token</div>
            <div className="flex items-center gap-2">
              <label htmlFor="api-token-input" className="sr-only">API Token</label>
              <input
                id="api-token-input"
                type={showToken ? 'text' : 'password'}
                value={apiToken}
                readOnly
                className="w-full px-2 py-1 rounded border text-xs bg-muted font-mono"
                placeholder="Your API token"
                title="API Token"
              />
              <Button size="icon" variant="ghost" onClick={() => setShowToken(v => !v)} title={showToken ? 'Hide' : 'Show'}>
                <KeyRound className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleCopyToken} title="Copy">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
              </Button>
              <Button size="icon" variant="ghost" onClick={handleRegenerateToken} title="Generate" disabled={tokenLoading}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4.5 19.5A9 9 0 1 0 12 3v3m0 0 2.25-2.25M12 6 9.75 3.75"/></svg>
              </Button>
            </div>
            {tokenLoading && <div className="text-xs text-blue-500 mt-1">Generating token...</div>}
            {tokenError && <div className="text-xs text-red-500 mt-1">{tokenError}</div>}
            {showToken && <div className="text-xs text-yellow-600 mt-1">This token is only shown once. Copy and store it securely.</div>}
          </div>
          {/* Profile Info */}
          <div className="mb-4">
            <div className="text-xs font-medium text-muted-foreground mb-1">Profile Info</div>
            <div className="text-sm">{email}</div>
            <div className="text-xs text-muted-foreground">Free account</div>
          </div>
          {/* Logout */}
          <Button variant="destructive" className="w-full" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />Logout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsPopover;
