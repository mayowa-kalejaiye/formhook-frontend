import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSidebar } from "../context/SidebarContext";
import { safeReplace } from '../lib/navigation';
import { useNotifications } from "../context/NotificationContext";
import { 
  LayoutDashboard, 
  FileText, 
  Inbox, 
  RefreshCcw,
  Users,
  MessageSquare,
  Settings,
  HelpCircle,
  LogOut,
  BarChart3,
  Crown,
  Code,
  Bell
} from "lucide-react";
import { Webhook } from 'lucide-react';

// Navigation items with icons grouped by category
const navigationGroups = [
  {
    label: "Main",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/forms", label: "Forms", icon: FileText },
      { href: "/submissions", label: "Submissions", icon: Inbox },
        // { href: "/notifications", label: "Notifications", icon: Bell },
    ]
  },
  {
    label: "Features",
    items: [
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/api-integration", label: "API Guide", icon: Code },
  { href: "/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/subscriptions", label: "Subscriptions", icon: Users },
      { href: "/feedback", label: "Feedback", icon: MessageSquare },
    ]
  },
  {
    label: "General",
    items: [
      { href: "/account", label: "Account", icon: Settings },
      { href: "/help", label: "Help Desk", icon: HelpCircle },
      { href: "/logout", label: "Log out", icon: LogOut },
    ]
  }
];

export default function DashboardNav() {
  const [open, setOpen] = useState(false);
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { unreadCount } = useNotifications();
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      // Clear local token (supports JWT in localStorage flow)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    } catch (e) {
      console.warn('[DashboardNav] Logout cleanup error', e);
    }
    // Redirect to login (throttled)
    safeReplace(router, '/login');
  };
  
  // Function to check if route is active
  const isActiveRoute = (href: string) => {
    if (href === "/dashboard") {
      return router.pathname === "/dashboard" || router.pathname === "/";
    }
    return router.pathname.startsWith(href);
  };
  
  return (
    <>
      {/* Mobile Hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 w-full z-40 flex items-center justify-between h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            className="p-1.5 sm:p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none flex-shrink-0"
            aria-label="Open navigation menu"
            onClick={() => setOpen(true)}
          >
            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-slate-700 dark:text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-base sm:text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100 truncate">FormHook</span>
        </div>
      </div>

      {/* Professional Sidebar for desktop */}
      <aside className="hidden md:flex h-screen w-64 bg-white dark:bg-slate-900 flex-col fixed top-0 left-0 z-30">
        <div className="flex-shrink-0">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold text-slate-900 dark:text-slate-100">FormHook</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <nav className="flex flex-col gap-6 mt-6 px-4 pb-6">
            {navigationGroups.map((group) => (
              <div key={group.label} className="flex flex-col gap-1">
                {!isCollapsed && (
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-3">
                    {group.label}
                  </h3>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveRoute(item.href);
                  // Render Logout as a button that clears token and redirects
                  if (item.href === '/logout') {
                    return (
                      <button
                        key={item.href}
                        onClick={handleLogout}
                        className={`rounded-md ${isCollapsed ? 'px-3 py-3 justify-center' : 'px-3 py-2'} font-medium transition-colors flex items-center gap-3 group text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-slate-900 dark:text-slate-100' : ''}`} />
                        {!isCollapsed && <span>{item.label}</span>}
                      </button>
                    );
                  }

                  return (
                    <Link 
                      key={item.href}
                      href={item.href} 
                      className={`rounded-md ${isCollapsed ? 'px-3 py-3 justify-center' : 'px-3 py-2'} font-medium transition-colors flex items-center gap-3 group ${
                        isActive 
                          ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white dark:text-slate-900' : ''}`} />
                      {!isCollapsed && (
                        <span className="flex-1">{item.label}</span>
                      )}
                      {/* Show notification badge */}
                      {item.href === '/notifications' && unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[1.25rem] text-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>
        
        <div className="flex-shrink-0 px-4 py-6 border-t border-slate-200 dark:border-slate-700">
          <div className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Upgrade Pro!</span>
              <span role="img" aria-label="fire">👑</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Higher productivity with better organization
            </p>
              <div className="flex items-center gap-2">
              <Link
                href="/pricing"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Crown className="h-4 w-4" />
                Upgrade
              </Link>
              <Link
                href="/features"
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-sm"
              >
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Professional Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Professional overlay */}
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          {/* Professional drawer */}
          <aside className="relative w-64 max-w-full h-full bg-white dark:bg-slate-900 flex flex-col animate-slide-in-left">
            <div className="flex-shrink-0">
              <div className="flex items-center h-16 px-6">
                <span className="text-xl font-semibold text-slate-900 dark:text-slate-100">FormHook</span>
                <button
                  className="ml-auto p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
                  aria-label="Close navigation menu"
                  onClick={() => setOpen(false)}
                >
                  <svg className="h-6 w-6 text-slate-700 dark:text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <nav className="flex flex-col gap-6 mt-6 px-4 pb-6">
                {navigationGroups.map((group) => (
                  <div key={group.label} className="flex flex-col gap-1">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-3">
                      {group.label}
                    </h3>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = isActiveRoute(item.href);
                      if (item.href === '/logout') {
                        return (
                          <button
                            key={item.href}
                            onClick={() => { setOpen(false); handleLogout(); }}
                            className={`rounded-md px-3 py-2 font-medium transition-colors flex items-center gap-3 ${
                              'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                            }`}
                          >
                            <Icon className={`h-5 w-5 ${isActive ? 'text-slate-900 dark:text-slate-100' : ''}`} />
                            <span>{item.label}</span>
                          </button>
                        );
                      }

                      return (
                        <Link 
                          key={item.href}
                          href={item.href} 
                          className={`rounded-md px-3 py-2 font-medium transition-colors flex items-center gap-3 ${
                            isActive 
                              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' 
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                          }`} 
                          onClick={() => setOpen(false)}
                        >
                          <Icon className={`h-5 w-5 ${isActive ? 'text-white dark:text-slate-900' : ''}`} />
                          <span className="flex-1">{item.label}</span>
                          {/* Show notification badge */}
                          {item.href === '/notifications' && unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[1.25rem] text-center">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </div>
            
            <div className="flex-shrink-0 px-4 py-6 border-t border-slate-200 dark:border-slate-700">
              <div className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Upgrade Pro!</span>
                  <span role="img" aria-label="fire">🔥</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Higher productivity with better organization
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    href="/pricing"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    <Crown className="h-4 w-4" />
                    Upgrade
                  </Link>
                  <Link
                    href="/features"
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-sm"
                  >
                    Learn more
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
