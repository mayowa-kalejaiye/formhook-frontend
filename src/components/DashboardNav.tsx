import React, { useState } from "react";
import Link from "next/link";
import SettingsPopover from "./SettingsPopover";

const NotificationIcon = ({ count = 0 }: { count?: number }) => (
  <div className="relative">
    <svg className="h-6 w-6 text-gray-500 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
    {count > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.2em] text-center font-bold">{count}</span>
    )}
  </div>
);

export default function DashboardNav({ notificationCount = 0 }: { notificationCount?: number }) {
  const [open, setOpen] = useState(false);
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
      <aside className="hidden md:flex h-screen w-56 bg-white dark:bg-black border-r border-gray-100 dark:border-gray-800 flex-col justify-between fixed top-0 left-0 z-30">
        <div>
          <div className="flex items-center h-16 px-6 border-b border-gray-100 dark:border-gray-800">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">FormHook</span>
          </div>
          <nav className="flex flex-col gap-1 mt-6 px-4">
            <Link href="/dashboard" className="rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium transition-colors">Dashboard</Link>
            <Link href="/forms" className="rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium transition-colors">Forms</Link>
            <Link href="/submissions" className="rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium transition-colors">Submissions</Link>
            <Link href="/webhooks" className="rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium transition-colors">Webhooks</Link>
          </nav>
        </div>
        <div className="flex flex-col gap-2 px-4 py-6 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <SettingsPopover />
            <button className="relative focus:outline-none" aria-label="Notifications">
              <NotificationIcon count={notificationCount} />
            </button>
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
                <Link href="/dashboard" className="rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium transition-colors" onClick={() => setOpen(false)}>Dashboard</Link>
                <Link href="/forms" className="rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium transition-colors" onClick={() => setOpen(false)}>Forms</Link>
                <Link href="/submissions" className="rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium transition-colors" onClick={() => setOpen(false)}>Submissions</Link>
                <Link href="/webhooks" className="rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium transition-colors" onClick={() => setOpen(false)}>Webhooks</Link>
              </nav>
            </div>
            <div className="flex flex-col gap-2 px-4 py-6 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <SettingsPopover />
                <button className="relative focus:outline-none" aria-label="Notifications">
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
