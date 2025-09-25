import React, { useState } from "react";
import Link from "next/link";
import SettingsPopover from "./SettingsPopover";
import { useSidebar } from "../context/SidebarContext";
import { 
  LayoutDashboard, 
  FileText, 
  Inbox, 
  Webhook, 
  ChevronLeft, 
  ChevronRight,
  Bell,
  Key
} from "lucide-react";

const NotificationIcon = ({ count = 0 }: { count?: number }) => (
  <div className="relative">
    <Bell className="h-6 w-6 text-gray-500 dark:text-gray-300" />
    {count > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.2em] text-center font-bold">{count}</span>
    )}
  </div>
);

// Navigation items with icons
const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/forms", label: "Forms", icon: FileText },
  { href: "/submissions", label: "Submissions", icon: Inbox },
  { href: "/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/api-tokens", label: "API Tokens", icon: Key },
];

export default function DashboardNav({ notificationCount = 0 }: { notificationCount?: number }) {
  const [open, setOpen] = useState(false);
  const { isCollapsed, toggleSidebar } = useSidebar();
  return (
    <>
      {/* Mobile Hamburger */}
      <div className="md:hidden fixed top-0 left-0 w-full z-40 flex items-center h-14 bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800 px-4">
        <button
          className="mr-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
          aria-label="Open navigation menu"
          onClick={() => setOpen(true)}
        >
          <svg className="h-6 w-6 text-gray-700 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">FormHook</span>
      </div>

      {/* Sidebar for desktop */}
      <aside className={`hidden md:flex h-screen ${isCollapsed ? 'w-16' : 'w-56'} bg-white dark:bg-black border-r border-gray-100 dark:border-gray-800 flex-col justify-between fixed top-0 left-0 z-30 transition-all duration-300 ease-in-out`}>
        <div>
          <div className={`flex items-center h-16 px-6 border-b border-gray-100 dark:border-gray-800 ${isCollapsed ? 'justify-center' : ''}`}>
            {!isCollapsed && (
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">FormHook</span>
            )}
            {isCollapsed && (
              <div className="w-8 h-8 bg-blue-600 dark:bg-blue-400 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm transform rotate-12"></div>
              </div>
            )}
          </div>
          <nav className="flex flex-col gap-1 mt-6 px-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className={`rounded-lg ${isCollapsed ? 'px-3 py-3 justify-center' : 'px-3 py-2'} text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium transition-colors flex items-center gap-3 group`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-col gap-2 px-4 py-6 border-t border-gray-100 dark:border-gray-800">
          {/* Toggle button */}
          <button
            onClick={toggleSidebar}
            className={`flex items-center ${isCollapsed ? 'justify-center p-2' : 'justify-between p-2'} rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group`}
            title={isCollapsed ? (isCollapsed ? "Expand Sidebar" : "Collapse Sidebar") : undefined}
          >
            {!isCollapsed && <span className="text-sm text-gray-500 dark:text-gray-400">Collapse</span>}
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            )}
          </button>
          
          <div className={`flex ${isCollapsed ? 'flex-col items-center gap-3' : 'items-center justify-between'}`}>
            {isCollapsed ? (
              <>
                <SettingsPopover />
                <button 
                  className="relative focus:outline-none p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
                  aria-label="Notifications" 
                  title="Notifications"
                  onClick={() => alert(`You have ${notificationCount} notifications`)}
                >
                  <NotificationIcon count={notificationCount} />
                </button>
              </>
            ) : (
              <>
                <SettingsPopover />
                <button 
                  className="relative focus:outline-none" 
                  aria-label="Notifications"
                  onClick={() => alert(`You have ${notificationCount} notifications`)}
                >
                  <NotificationIcon count={notificationCount} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Drawer for mobile */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          {/* Drawer */}
          <aside className="relative w-64 max-w-full h-full bg-white dark:bg-black border-r border-gray-100 dark:border-gray-800 flex flex-col justify-between animate-slide-in-left">
            <div>
              <div className="flex items-center h-16 px-6 border-b border-gray-100 dark:border-gray-800">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">FormHook</span>
                <button
                  className="ml-auto p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
                  aria-label="Close navigation menu"
                  onClick={() => setOpen(false)}
                >
                  <svg className="h-6 w-6 text-gray-700 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex flex-col gap-1 mt-6 px-4">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link 
                      key={item.href}
                      href={item.href} 
                      className="rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium transition-colors flex items-center gap-3" 
                      onClick={() => setOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex flex-col gap-2 px-4 py-6 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <SettingsPopover />
                <button 
                  className="relative focus:outline-none" 
                  aria-label="Notifications"
                  onClick={() => alert(`You have ${notificationCount} notifications`)}
                >
                  <NotificationIcon count={notificationCount} />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
