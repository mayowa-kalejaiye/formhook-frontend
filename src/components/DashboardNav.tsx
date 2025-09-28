import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import SettingsPopover from "./SettingsPopover";
import { NotificationBadge } from "./NotificationBadge";
import { useSidebar } from "../context/SidebarContext";
import { 
  LayoutDashboard, 
  FileText, 
  Inbox, 
  Webhook, 
  ChevronLeft, 
  ChevronRight,
  Key
} from "lucide-react";

// Navigation items with icons
const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/forms", label: "Forms", icon: FileText },
  { href: "/submissions", label: "Submissions", icon: Inbox },
  { href: "/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/api-tokens", label: "API Tokens", icon: Key },
];

export default function DashboardNav() {
  const [open, setOpen] = useState(false);
  const { isCollapsed, toggleSidebar } = useSidebar();
  const router = useRouter();
  
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
      <div className="md:hidden fixed top-0 left-0 w-full z-40 flex items-center h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4">
        <button
          className="mr-2 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
          aria-label="Open navigation menu"
          onClick={() => setOpen(true)}
        >
          <svg className="h-6 w-6 text-slate-700 dark:text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-xl font-semibold text-slate-900 dark:text-slate-100">FormHook</span>
      </div>

      {/* Professional Sidebar for desktop */}
      <aside className={`hidden md:flex h-screen ${isCollapsed ? 'w-16' : 'w-64'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex-col justify-between fixed top-0 left-0 z-30 transition-all duration-300 ease-in-out shadow-sm`}>
        <div>
          <div className={`flex items-center h-16 px-6 border-b border-slate-200 dark:border-slate-700 ${isCollapsed ? 'justify-center' : ''}`}>
            {!isCollapsed && (
              <span className="text-xl font-semibold text-slate-900 dark:text-slate-100">FormHook</span>
            )}
            {isCollapsed && (
              <div className="w-8 h-8 bg-slate-900 dark:bg-slate-100 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white dark:bg-slate-900 rounded-sm"></div>
              </div>
            )}
          </div>
          <nav className="flex flex-col gap-1 mt-6 px-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);
              return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className={`rounded-md ${isCollapsed ? 'px-3 py-3 justify-center' : 'px-3 py-2'} font-medium transition-colors flex items-center gap-3 group ${
                    isActive 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-r-2 border-slate-900 dark:border-slate-100' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-slate-900 dark:text-slate-100' : ''}`} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-col gap-2 px-4 py-6 border-t border-slate-200 dark:border-slate-700">
          {/* Toggle button */}
          <button
            onClick={toggleSidebar}
            className={`flex items-center ${isCollapsed ? 'justify-center p-2' : 'justify-between p-2'} rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group`}
            title={isCollapsed ? (isCollapsed ? "Expand Sidebar" : "Collapse Sidebar") : undefined}
          >
            {!isCollapsed && <span className="text-sm text-slate-500 dark:text-slate-400">Collapse</span>}
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            )}
          </button>
          
          <div className={`flex ${isCollapsed ? 'flex-col items-center gap-3' : 'items-center justify-between'}`}>
            {isCollapsed ? (
              <>
                <SettingsPopover />
                <NotificationBadge size="sm" />
              </>
            ) : (
              <>
                <SettingsPopover />
                <NotificationBadge size="sm" />
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Professional Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Professional overlay */}
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          {/* Professional drawer */}
          <aside className="relative w-64 max-w-full h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-between animate-slide-in-left">
            <div>
              <div className="flex items-center h-16 px-6 border-b border-slate-200 dark:border-slate-700">
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
              <nav className="flex flex-col gap-1 mt-6 px-4">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveRoute(item.href);
                  return (
                    <Link 
                      key={item.href}
                      href={item.href} 
                      className={`rounded-md px-3 py-2 font-medium transition-colors flex items-center gap-3 ${
                        isActive 
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-r-2 border-slate-900 dark:border-slate-100' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                      }`} 
                      onClick={() => setOpen(false)}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? 'text-slate-900 dark:text-slate-100' : ''}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex flex-col gap-2 px-4 py-6 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <SettingsPopover />
                <NotificationBadge size="sm" />
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
