// --- Animated VerticalTabs Section (for How It Works) ---
'use client';
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Icon components
const DashboardIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="7" height="9" x="3" y="3" rx="1"/>
    <rect width="7" height="5" x="14" y="3" rx="1"/>
    <rect width="7" height="9" x="14" y="12" rx="1"/>
    <rect width="7" height="5" x="3" y="16" rx="1"/>
  </svg>
);

const AnalyticsIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 3v18h18"/>
    <path d="m19 9-5 5-4-4-3 3"/>
  </svg>
);

const UsersIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="m22 21-2-2"/>
    <path d="M16 16.28A13.84 13.84 0 0 1 22 21"/>
  </svg>
);

const FileIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14,2 14,8 20,8"/>
  </svg>
);

interface Tab {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  content: string;
  badge?: number;
}

interface VerticalTabsProps {
  tabs: Tab[];
  className?: string;
}

export function VerticalTabs({ tabs, className }: VerticalTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div className={`flex h-80 w-full max-w-4xl rounded-lg border border-slate-200/20 bg-white/80 shadow-lg backdrop-blur-md dark:border-slate-700/30 dark:bg-black/40 ${className || ''}`}>
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-200/20 bg-slate-50/50 p-4 backdrop-blur-sm dark:border-slate-700/30 dark:bg-black/20">
        <div className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200 ${
                  isActive
                    ? "bg-white/80 text-blue-600 shadow-sm backdrop-blur-sm dark:bg-black/60 dark:text-blue-400 dark:shadow-blue-500/10"
                    : "text-slate-600 hover:bg-white/60 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-black/40 dark:hover:text-slate-100"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-lg bg-blue-50/80 backdrop-blur-sm dark:bg-blue-500/10 dark:backdrop-blur-md"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                
                <div className="relative z-10 flex items-center gap-3">
                  <Icon className={`h-5 w-5 transition-colors ${
                    isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200"
                  }`} />
                  <span className="font-medium">{tab.title}</span>
                  {tab.badge && (
                    <span className="ml-auto rounded-full bg-blue-100/80 px-2 py-0.5 text-xs font-medium text-blue-600 backdrop-blur-sm dark:bg-blue-500/20 dark:text-blue-400 dark:backdrop-blur-md">
                      {tab.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <AnimatePresence mode="wait">
          {tabs.map((tab) => {
            if (activeTab !== tab.id) return null;
            
            return (
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {tab.title}
                </h2>
                <p className="text-slate-600 dark:text-slate-300">
                  {tab.content}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Demo component
export function VerticalTabsDemo() {
  const tabs: Tab[] = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: DashboardIcon,
      content: "Welcome to your dashboard! Here you can view an overview of all your important metrics and recent activity. The dashboard provides a comprehensive view of your data and performance indicators.",
      badge: 3
    },
    {
      id: "analytics",
      title: "Analytics",
      icon: AnalyticsIcon,
      content: "Dive deep into your analytics data. View detailed reports, trends, and insights about your performance. Track key metrics and identify opportunities for growth and optimization.",
      badge: 12
    },
    {
      id: "users",
      title: "Users",
      icon: UsersIcon,
      content: "Manage your user base effectively. View user profiles, activity logs, and engagement metrics. Monitor user behavior and implement strategies to improve user experience.",
    },
    {
      id: "files",
      title: "Files",
      icon: FileIcon,
      content: "Organize and manage your files efficiently. Upload, download, and share documents with your team. Keep everything organized with our intuitive file management system.",
      badge: 5
    }
  ];

  return <VerticalTabs tabs={tabs} />;
}
// --- More Notable Brand Logos (SVG, official) ---
const GitHubLogo = () => (
  <svg width="1.8em" height="1.8em" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" rx="56" fill="#fff"/>
    <path fill="#181717" d="M128 32C74.98 32 32 74.98 32 128c0 42.42 27.5 78.36 65.7 91.06 4.8.88 6.56-2.08 6.56-4.62 0-2.28-.08-8.34-.13-16.38-26.73 5.82-32.38-12.9-32.38-12.9-4.36-11.08-10.64-14.04-10.64-14.04-8.7-5.94.66-5.82.66-5.82 9.62.68 14.68 9.88 14.68 9.88 8.56 14.68 22.48 10.44 27.98 7.98.86-6.2 3.36-10.44 6.12-12.84-21.34-2.44-43.8-10.68-43.8-47.6 0-10.52 3.76-19.12 9.94-25.86-.98-2.44-4.3-12.28.94-25.6 0 0 8.06-2.58 26.4 9.88a91.6 91.6 0 0 1 24.06-3.24c8.16.04 16.38 1.1 24.06 3.24 18.32-12.46 26.36-9.88 26.36-9.88 5.26 13.32 1.94 23.16.96 25.6 6.18 6.74 9.92 15.34 9.92 25.86 0 37-22.5 45.14-43.92 47.54 3.46 2.98 6.54 8.86 6.54 17.86 0 12.9-.12 23.28-.12 26.46 0 2.56 1.74 5.54 6.6 4.6C196.5 206.34 224 170.42 224 128c0-53.02-42.98-96-96-96Z"/>
  </svg>
);
const TrelloLogo = () => (
  <svg width="1.8em" height="1.8em" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" rx="56" fill="#fff"/>
    <rect x="56" y="56" width="60" height="144" rx="16" fill="#026AA7"/>
    <rect x="140" y="56" width="60" height="88" rx="16" fill="#026AA7"/>
  </svg>
);
const AsanaLogo = () => (
  <svg width="1.8em" height="1.8em" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" rx="56" fill="#fff"/>
    <circle cx="128" cy="192" r="32" fill="#FC636B"/>
    <circle cx="192" cy="96" r="32" fill="#FFD600"/>
    <circle cx="64" cy="96" r="32" fill="#4F8DFD"/>
  </svg>
);
const TeamsLogo = () => (
  <svg width="1.8em" height="1.8em" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" rx="56" fill="#fff"/>
    <rect x="56" y="56" width="144" height="144" rx="32" fill="#6264A7"/>
    <text x="128" y="160" textAnchor="middle" fontWeight="bold" fontSize="72" fill="#fff" fontFamily="Arial, sans-serif">T</text>
  </svg>
);
const MondayLogo = () => (
  <svg width="1.8em" height="1.8em" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" rx="56" fill="#fff"/>
    <circle cx="80" cy="176" r="32" fill="#FFD600"/>
    <circle cx="128" cy="128" r="32" fill="#FF3A5B"/>
    <circle cx="176" cy="80" r="32" fill="#00CA72"/>
  </svg>
);
const ClickUpLogo = () => (
  <svg width="1.8em" height="1.8em" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" rx="56" fill="#fff"/>
    <path d="M128 192c-24.8 0-48.2-9.8-65.8-27.6l22.6-22.6c12.2 12.2 28.4 19.2 43.2 19.2s31-7 43.2-19.2l22.6 22.6C176.2 182.2 152.8 192 128 192Zm0-48c-13.2 0-25.6-5.2-34.8-14.4l22.6-22.6c3.4 3.4 8 5.4 12.2 5.4s8.8-2 12.2-5.4l22.6 22.6C153.6 138.8 141.2 144 128 144Z" fill="#7B68EE"/>
  </svg>
);


// --- Integration Brand Logos (real SVGs from official sources) ---
const SlackLogo = () => (
  <svg width="1.8em" height="1.8em" viewBox="0 0 122.8 122.8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g>
      <rect width="122.8" height="122.8" rx="30" fill="#fff"/>
      <g>
        <path d="M30.7 77.2c0 5.7-4.6 10.3-10.3 10.3S10 82.9 10 77.2s4.6-10.3 10.3-10.3h10.3v10.3Zm5.2 0c0-5.7 4.6-10.3 10.3-10.3s10.3 4.6 10.3 10.3v25.8c0 5.7-4.6 10.3-10.3 10.3s-10.3-4.6-10.3-10.3V77.2Zm10.3-36.2c-5.7 0-10.3-4.6-10.3-10.3S40.5 20.3 46.2 20.3s10.3 4.6 10.3 10.3v10.3H46.2Zm0 5.2c5.7 0 10.3 4.6 10.3 10.3s-4.6 10.3-10.3 10.3H20.3c-5.7 0-10.3-4.6-10.3-10.3s4.6-10.3 10.3-10.3h25.9Zm36.2 10.3c0-5.7 4.6-10.3 10.3-10.3s10.3 4.6 10.3 10.3-4.6 10.3-10.3 10.3H77.2V46.2Zm-5.2 0c0 5.7-4.6 10.3-10.3 10.3s-10.3-4.6-10.3-10.3V20.3c0-5.7 4.6-10.3 10.3-10.3s10.3 4.6 10.3 10.3v25.9Zm-10.3 36.2c5.7 0 10.3 4.6 10.3 10.3s-4.6 10.3-10.3 10.3-10.3-4.6-10.3-10.3V77.2h10.3Zm0-5.2c-5.7 0-10.3-4.6-10.3-10.3s4.6-10.3 10.3-10.3h25.9c5.7 0 10.3 4.6 10.3 10.3s-4.6 10.3-10.3 10.3H77.2Z" fill="#611f69"/>
      </g>
    </g>
  </svg>
);
const DiscordLogo = () => (
  <svg width="1.8em" height="1.8em" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" rx="56" fill="#5865F2"/>
    <path d="M188.7 80.6a151.6 151.6 0 0 0-36.7-11.3c-1.7 3-3.2 6.2-4.4 9.5a143.2 143.2 0 0 0-43.2 0c-1.2-3.3-2.7-6.5-4.4-9.5a151.6 151.6 0 0 0-36.7 11.3c-23.2 34.6-29.5 68.3-26.3 101.6a151.2 151.2 0 0 0 44.7 13.7c3.4-4.7 6.5-9.7 9.2-14.9-5.1-1.6-9.9-3.6-14.5-5.9 1.2-1.1 2.3-2.2 3.4-3.3 27.2 12.7 56.7 12.7 83.9 0 1.1 1.1 2.2 2.2 3.4 3.3-4.6 2.3-9.4 4.3-14.5 5.9 2.7 5.2 5.8 10.2 9.2 14.9a151.2 151.2 0 0 0 44.7-13.7c3.2-33.3-3.1-67-26.3-101.6Zm-99.7 72.7c-7.1 0-12.8-6.5-12.8-14.5s5.7-14.5 12.8-14.5c7.2 0 12.9 6.5 12.8 14.5 0 8-5.6 14.5-12.8 14.5Zm78 0c-7.1 0-12.8-6.5-12.8-14.5s5.7-14.5 12.8-14.5c7.2 0 12.9 6.5 12.8 14.5 0 8-5.6 14.5-12.8 14.5Z" fill="#fff"/>
  </svg>
);
const NotionLogo = () => (
  <svg width="1.8em" height="1.8em" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" rx="56" fill="#fff"/>
    <path d="M60 60h136a12 12 0 0 1 12 12v112a12 12 0 0 1-12 12H60a12 12 0 0 1-12-12V72a12 12 0 0 1 12-12Zm24 32v72h88v-72h-88Zm12 12h64v48h-64v-48Z" fill="#000"/>
    <path d="M80 80l96 96" stroke="#000" strokeWidth="8"/>
  </svg>
);
const GoogleSheetsLogo = () => (
  <svg width="1.8em" height="1.8em" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" rx="56" fill="#0F9D58"/>
    <rect x="72" y="72" width="112" height="112" rx="16" fill="#fff"/>
    <rect x="88" y="104" width="80" height="16" rx="4" fill="#0F9D58"/>
    <rect x="88" y="136" width="80" height="16" rx="4" fill="#0F9D58"/>
    <g>
      <rect x="104" y="88" width="48" height="80" rx="8" fill="#34A853"/>
      <rect x="120" y="120" width="16" height="32" rx="4" fill="#fff"/>
    </g>
  </svg>
);
const ZapierLogo = () => (
  <svg width="1.8em" height="1.8em" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" rx="56" fill="#FF4F00"/>
    <g>
      <path d="M128 80v96M176 128H80m68.3-35.3-76.6 76.6m0-76.6 76.6 76.6" stroke="#fff" strokeWidth="16" strokeLinecap="round"/>
      <circle cx="128" cy="128" r="40" fill="#fff"/>
      <path d="M128 104v48M152 128H104m34.1-24.1-36.2 36.2m0-36.2 36.2 36.2" stroke="#FF4F00" strokeWidth="8" strokeLinecap="round"/>
    </g>
  </svg>
);
const AirtableLogo = () => (
  <svg width="1.8em" height="1.8em" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" rx="56" fill="#18B6F6"/>
    <g>
      <polygon points="128,64 192,96 128,128 64,96 128,64" fill="#FFB400"/>
      <polygon points="128,144 192,112 128,144 64,112 128,144" fill="#FF7262"/>
      <rect x="120" y="144" width="16" height="48" rx="8" fill="#19B6F6"/>
    </g>
  </svg>
);





// SVG Icon Components (cleaned up and optimized)
const SparkleIcon = () => (
    <svg height="1.8em" style={{ flex: 'none', lineHeight: 1 }} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="1.8em">
        <title>Gemini</title>
        <defs>
            <linearGradient id="gemini-gradient-fixed" x1="0%" x2="68.73%" y1="100%" y2="30.395%">
                <stop offset="0%" stopColor="#1C7DFF"></stop>
                <stop offset="52.021%" stopColor="#1C69FF"></stop>
                <stop offset="100%" stopColor="#F0DCD6"></stop>
            </linearGradient>
        </defs>
        <path d="M12 24A14.304 14.304 0 000 12 14.304 14.304 0 0012 0a14.305 14.305 0 0012 12 14.305 14.305 0 00-12 12" fill="url(#gemini-gradient-fixed)" fillRule="nonzero"></path>
    </svg>
);

const FigmaIcon = () => (
    <svg width="1.8em" height="1.8em" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 1.5C0 0.671573 0.671573 0 1.5 0H8.5C9.32843 0 10 0.671573 10 1.5V8H1.5C0.671573 8 0 7.32843 0 6.5V1.5Z" fill="#F26207"></path>
        <path d="M10 8H18.5C19.3284 8 20 8.67157 20 9.5V14.5C20 15.3284 19.3284 16 18.5 16H10V8Z" fill="#F26207"></path>
        <path d="M0 17.5C0 16.6716 0.671573 16 1.5 16H10V22.5C10 23.3284 9.32843 24 8.5 24H1.5C0.671573 24 0 23.3284 0 22.5V17.5Z" fill="#F26207"></path>
    </svg>
);

const CoralIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="1.8em" height="1.8em">
        <defs>
            <linearGradient id="coral-gradient-fixed" x1="199.997" x2="296.665" y1="214.302" y2="307.573" gradientTransform="translate(-200 -213)" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#62A0EA"></stop>
                <stop offset="1" stopColor="#1A5FB4"></stop>
            </linearGradient>
        </defs>
        <path fill="url(#coral-gradient-fixed)" d="M48.26 2.274a6.113 6.113 0 0 0-1.838 8.468c10.109 15.655 12.495 27.463 11.46 37.811-4.184 19.816-13.279 23.836-21.227 23.836-7.76 0-5.682-12.771.151-16.509 3.482-2.174 7.942-3.587 11.365-3.587 3.392 0 6.142-2.741 6.142-6.123 0-3.383-2.75-6.124-6.142-6.124-3.998 0-7.92.84-11.581 2.27.748-3.529 1.024-7.343.057-11.397-1.468-6.156-5.694-12.036-13.032-17.736a6.15 6.15 0 0 0-8.621 1.065 6.114 6.114 0 0 0 1.078 8.595c5.978 4.643 7.952 8.08 8.627 10.909.675 2.829.132 5.864-1.224 10.034-1.733 5.62-3.745 10.637-4.627 15.448-.434 2.368-.471 4.945-.583 7.004-4.305-4.196-5.99-9.736-5.99-17.831-.001-3.382-2.751-6.124-6.142-6.123-3.389.003-6.135 2.743-6.136 6.123 0 11.056 3.233 21.576 11.898 28.594 7.844 7.473 27.791 4.711 27.791 16.708 0 3.386 4.956 5.034 8.347 5.034 3.478 0 7.855-2.325 7.855-5.034 0-13.612 14.345-21.885 37.96-21.849 3.392.005 6.144-2.734 6.149-6.116.006-3.383-2.738-6.13-6.13-6.136a78.226 78.226 0 0 0-4.741.145c2.64-6.209 3.811-13.045 3.569-20.429-.112-3.381-2.95-6.031-6.339-5.921-3.393.11-6.051 2.943-5.94 6.326.32 9.668-.042 18.301-7.245 22.852-2.048 1.293-4.429 2.415-6.687 2.415 1.753-4.768 3.077-9.801 3.619-15.226.346-3.462.383-7.575-.012-10.77-.613-4.95-1.353-10.564.526-14.793 1.688-3.642 5.47-5.167 11.023-5.167 3.389-.003 6.135-2.744 6.136-6.123.002-3.383-2.745-6.127-6.136-6.13-8.252 0-14.507 4.343-18.053 9.59-1.854-3.96-4.112-8.041-6.84-12.265a6.14 6.14 0 0 0-3.86-2.669 6.159 6.159 0 0 0-4.627.831z"></path>
    </svg>
);


// Wrapper for individual icons to give them the glassy container style and hover effects
const IconWrapper = ({ children, className = "", isHighlighted = false, isHovered = false, animationDelay = 0 }: { children: React.ReactNode; className?: string; isHighlighted?: boolean; isHovered?: boolean; animationDelay?: number }) => (
    <div className={`
        backdrop-blur-xl rounded-2xl flex items-center justify-center transition-all duration-300
        ${isHighlighted 
            ? 'dark:bg-gray-700/50 bg-gray-100/80 border border-blue-400/50 dark:shadow-blue-500/20 shadow-blue-400/30 shadow-2xl animate-breathing-glow' 
            : `dark:bg-white/5 bg-white/60 border border-gray-200/50 dark:border-white/10 ${!isHovered && 'animate-float'}`
        }
        ${isHovered 
            ? 'dark:bg-gray-600/50 bg-gray-200/80 border-blue-400/60 scale-110 dark:shadow-blue-400/30 shadow-blue-400/40 shadow-2xl' 
            : 'dark:hover:bg-white/10 hover:bg-gray-100/80 dark:hover:border-white/20 hover:border-gray-300/60'
        }
        ${className}
    `}
    style={{ animationDelay: `${animationDelay}s` }}
    >
        {children}
    </div>
);

// The grid of icons, now with animations and precise SVG connecting lines
const IconGrid = () => {
    const [hoveredId, setHoveredId] = useState<number | null>(null);

    // Showcase FormHook integrations and brand
    // 12 brands in a circle
    const outerIcons = [
        { id: 1, component: <SlackLogo /> },
        { id: 2, component: <DiscordLogo /> },
        { id: 3, component: <NotionLogo /> },
        { id: 4, component: <GoogleSheetsLogo /> },
        { id: 5, component: <ZapierLogo /> },
        { id: 6, component: <AirtableLogo /> },
        { id: 7, component: <GitHubLogo /> },
        { id: 8, component: <TrelloLogo /> },
        { id: 9, component: <AsanaLogo /> },
        { id: 10, component: <TeamsLogo /> },
        { id: 11, component: <MondayLogo /> },
        { id: 12, component: <ClickUpLogo /> },
    ];
    
    // Constants for layout calculation
    const radius = 160;
    const centralIconRadius = 48; // w-24 is 96px, radius is 48px
    const outerIconRadius = 40;   // w-20 is 80px, radius is 40px
    const svgSize = 380;
    const svgCenter = svgSize / 2;

    return (
        // Use scale to make the entire component responsive
        <div className="relative w-[380px] h-[380px] scale-75 md:scale-100">
            
            {/* SVG container for all connecting lines, drawn underneath the icons */}
            <svg
                width={svgSize}
                height={svgSize}
                className="absolute top-0 left-0"
            >
                <g>
                    {outerIcons.map((icon, i) => {
                        // 12 icons, full circle
                        const angleInDegrees = -90 + i * (360 / outerIcons.length);
                        const angleInRadians = angleInDegrees * (Math.PI / 180);

                        // Calculate start and end points for the line
                        const startX = svgCenter + centralIconRadius * Math.cos(angleInRadians);
                        const startY = svgCenter + centralIconRadius * Math.sin(angleInRadians);
                        const endX = svgCenter + (radius - outerIconRadius) * Math.cos(angleInRadians);
                        const endY = svgCenter + (radius - outerIconRadius) * Math.sin(angleInRadians);

                        return (
                            <line
                                key={`line-${icon.id}`}
                                x1={startX}
                                y1={startY}
                                x2={endX}
                                y2={endY}
                                stroke={hoveredId === icon.id ? '#3B82F6' : '#6B7280'}
                                strokeWidth="2"
                                className="transition-all duration-300 dark:stroke-gray-600"
                                style={{
                                    opacity: hoveredId === icon.id ? 1 : 0.3,
                                }}
                            />
                        );
                    })}
                </g>
            </svg>

            {/* The main container that acts as the center for the circle */}
            <div className="absolute top-1/2 left-1/2">
                
                {/* Center Icon: FormHook Brand */}
                <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10">
                    <IconWrapper className="w-24 h-24" isHighlighted={true} animationDelay={0}>
                        {/* Replace with your logo or a stylized F */}
                        <svg width="2.2em" height="2.2em" viewBox="0 0 48 48" fill="none">
                          <rect width="48" height="48" rx="16" fill="#2563eb"/>
                          <text x="50%" y="56%" textAnchor="middle" fill="#fff" fontSize="2.2em" fontWeight="bold" fontFamily="Inter, Arial, sans-serif" dominantBaseline="middle">F</text>
                        </svg>
                    </IconWrapper>
                </div>

                {/* Mapping over the outer icons to place them */}
                {outerIcons.map((icon, i) => {
                    const angleInDegrees = -90 + i * (360 / outerIcons.length);
                    const angleInRadians = angleInDegrees * (Math.PI / 180);
                    const x = radius * Math.cos(angleInRadians);
                    const y = radius * Math.sin(angleInRadians);
                    const iconStyle = {
                        transform: `translate(${x}px, ${y}px)`
                    };
                    return (
                        <div 
                            key={icon.id}
                            className="absolute z-10" 
                            style={iconStyle}
                            onMouseEnter={() => setHoveredId(icon.id)}
                            onMouseLeave={() => setHoveredId(null)}
                        >
                             <div className="-translate-x-1/2 -translate-y-1/2">
                                <IconWrapper 
                                    className="w-20 h-20" 
                                    isHovered={hoveredId === icon.id}
                                    animationDelay={i * 0.1}
                                >
                                    {icon.component}
                                </IconWrapper>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// The main NexusOrb component that brings everything together
function NexusOrb() {
  return (
    <div className="w-full flex items-center justify-center font-sans p-8 overflow-hidden">
        {/* Style block to define the animations. */}
        <style>
            {`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
                .animate-float {
                    animation: float 4s ease-in-out infinite;
                }

                @keyframes breathing-glow {
                    0% { box-shadow: 0 0 20px 0px rgba(59, 130, 246, 0.3); }
                    50% { box-shadow: 0 0 35px 10px rgba(59, 130, 246, 0.1); }
                    100% { box-shadow: 0 0 20px 0px rgba(59, 130, 246, 0.3); }
                }
                @keyframes breathing-glow-light {
                    0% { box-shadow: 0 0 20px 0px rgba(59, 130, 246, 0.2); }
                    50% { box-shadow: 0 0 35px 10px rgba(59, 130, 246, 0.05); }
                    100% { box-shadow: 0 0 20px 0px rgba(59, 130, 246, 0.2); }
                }
                .animate-breathing-glow {
                    animation: breathing-glow 3s ease-in-out infinite;
                }
                .dark .animate-breathing-glow {
                    animation: breathing-glow 3s ease-in-out infinite;
                }
                :not(.dark) .animate-breathing-glow {
                    animation: breathing-glow-light 3s ease-in-out infinite;
                }
            `}
        </style>

        {/* Enhanced background with a radial gradient */}
        <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] pointer-events-none"></div>
        </div>

        <div className="relative z-10 container mx-auto flex items-center justify-center">
            <IconGrid />
        </div>
    </div>
  );
}


export default function HowItWorks() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
          FormHook makes it effortless to collect, manage, and route form submissions to your favorite tools. Instantly connect with Slack, Discord, Notion, Google Sheets, Zapier, Airtable, and more.
        </p>
        <div className="flex items-center justify-center">
          <NexusOrb />
        </div>
      </div>
    </section>
  );
}
