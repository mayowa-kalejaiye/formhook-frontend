"use client";

import React from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

export default function NavigationControls() {
  const router = useRouter();

  // Get current page title based on route
  const getPageTitle = () => {
    const path = router.pathname;
    const segments = path.split('/').filter(Boolean);
    
    if (segments.length === 0) return 'Dashboard';
    
    // Map route to readable titles
    const titles: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'forms': 'Forms',
      'submissions': 'Submissions',
      'analytics': 'Analytics',
      'webhooks': 'Webhooks',
      'api-tokens': 'API Tokens',
      'api-integration': 'API Guide',
      'settings': 'Settings',
      'new': 'New Form'
    };

    // Handle dynamic routes
    if (segments[0] === 'forms' && segments.length > 1) {
      if (segments[1] === 'new') return 'New Form';
      return 'Form Details';
    }

    return segments.map(segment => titles[segment] || segment).join(' / ');
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
        onClick={() => router.back()}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
        onClick={() => window.history.forward()}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center text-sm ml-2">
        <span className="font-medium text-slate-900 dark:text-slate-100">FormHook</span>
        <ChevronRight className="h-4 w-4 mx-1 text-slate-400" />
        <span className="text-slate-500 dark:text-slate-400">{getPageTitle()}</span>
      </div>
    </div>
  );
}
