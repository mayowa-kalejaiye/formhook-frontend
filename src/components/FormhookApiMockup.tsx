"use client";
import React from "react";

// Self-contained SVG icon for the "Welcome" badge
const DotIcon = () => (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="4" cy="4" r="4" fill="currentColor"/>
    </svg>
);

// Mock FormHook API response data
const mockResponse = {
  submission_id: "subm_01HZYX8K9QW8ZJ6V6K4Q2B7F9A",
  form_id: "form_01HZYX7V9QW8ZJ6V6K4Q2B7F8Z",
  submitted_at: "2025-07-26T14:23:45.123Z",
  fields: {
    name: "Jane Doe",
    email: "jane.doe@example.com",
    message: "Hello, I am interested in your product!"
  },
  ip_address: "203.0.113.42",
  user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  webhook_status: "delivered"
};

// The styled code window component for FormHook
const FormhookApiMockup = () => {
  return (
    <div className="w-full mx-auto bg-gradient-to-r from-zinc-100 to-zinc-200 dark:from-[#000000] dark:to-[#0a0d37] border-zinc-300 dark:border-[#1b2c68a0] relative rounded-lg border shadow-lg">
      {/* Top gradient border element */}
      <div className="flex flex-row">
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-blue-500 to-purple-600"></div>
        <div className="h-[2px] w-full bg-gradient-to-r from-purple-600 to-transparent"></div>
      </div>
      {/* Window Header */}
      <div className="px-4 lg:px-8 py-5 flex justify-between items-center bg-zinc-200 dark:bg-[#000000]">
        <div className="flex flex-row space-x-2">
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <div className="h-3 w-3 rounded-full bg-orange-400"></div>
          <div className="h-3 w-3 rounded-full bg-green-400"></div>
        </div>
        <div className="text-xs text-zinc-600 dark:text-gray-400 font-mono">formhook.response.json</div>
      </div>
      {/* Code Content Area */}
      <div className="overflow-hidden border-t-[2px] border-zinc-300 dark:border-indigo-900 px-4 lg:px-8 py-4 lg:py-8 relative">
        {/* Background blur effects */}
        <div className="absolute -top-24 -left-24 w-56 h-56 bg-blue-600 rounded-full opacity-10 filter blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-purple-600 rounded-full opacity-10 filter blur-3xl"></div>
        <div className="relative flex">
          {/* Line Numbers */}
          <div className="hidden md:flex flex-col items-end pr-4 text-zinc-600 dark:text-gray-500 font-mono text-xs select-none">
            {Array.from({ length: 15 }, (_, i) => (
              <div key={i} className="leading-relaxed opacity-70">{i + 1}</div>
            ))}
          </div>
          {/* Code Snippet with theme-aware colors */}
          <code className="font-mono text-xs md:text-sm lg:text-base w-full">
            <div><span className="text-blue-500">&#123;</span></div>
            <div className="pl-6"><span className="text-fuchsia-600">submission_id</span>: <span className="text-green-600">&quot;{mockResponse.submission_id}&quot;</span>,</div>
            <div className="pl-6"><span className="text-fuchsia-600">form_id</span>: <span className="text-green-600">&quot;{mockResponse.form_id}&quot;</span>,</div>
            <div className="pl-6"><span className="text-fuchsia-600">submitted_at</span>: <span className="text-green-600">&quot;{mockResponse.submitted_at}&quot;</span>,</div>
            <div className="pl-6"><span className="text-fuchsia-600">fields</span>: <span className="text-blue-500">&#123;</span></div>
            <div className="pl-12"><span className="text-fuchsia-600">name</span>: <span className="text-green-600">&quot;{mockResponse.fields.name}&quot;</span>,</div>
            <div className="pl-12"><span className="text-fuchsia-600">email</span>: <span className="text-green-600">&quot;{mockResponse.fields.email}&quot;</span>,</div>
            <div className="pl-12"><span className="text-fuchsia-600">message</span>: <span className="text-green-600">&quot;{mockResponse.fields.message}&quot;</span></div>
            <div className="pl-6"><span className="text-blue-500">&#125;</span>,</div>
            <div className="pl-6"><span className="text-fuchsia-600">ip_address</span>: <span className="text-green-600">&quot;{mockResponse.ip_address}&quot;</span>,</div>
            <div className="pl-6"><span className="text-fuchsia-600">user_agent</span>: <span className="text-green-600">&quot;{mockResponse.user_agent}&quot;</span>,</div>
            <div className="pl-6"><span className="text-fuchsia-600">webhook_status</span>: <span className="text-green-600">&quot;{mockResponse.webhook_status}&quot;</span></div>
            <div><span className="text-blue-500">&#125;</span></div>
          </code>
        </div>
      </div>
      {/* Window Footer */}
      <div className="px-4 lg:px-8 pb-4 mt-4 border-t border-zinc-300 dark:border-gray-800 pt-3 text-xs text-zinc-600 dark:text-gray-500 flex justify-between items-center">
        <span>UTF-8</span>
        <span>JSON</span>
        <span>Ln 15, Col 2</span>
      </div>
    </div>
  );
};

export default FormhookApiMockup;
