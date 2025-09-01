import React from 'react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      <header className="bg-white shadow flex items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-xl font-bold text-blue-700 tracking-tight">FormHook</Link>
        <nav className="space-x-4">
          <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium">Forms</Link>
          <Link href="/logout" className="text-gray-400 hover:text-red-500 font-medium">Logout</Link>
        </nav>
      </header>
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">{children}</main>
      <footer className="text-center text-xs text-gray-400 py-4">© {new Date().getFullYear()} FormHook</footer>
    </div>
  );
}
