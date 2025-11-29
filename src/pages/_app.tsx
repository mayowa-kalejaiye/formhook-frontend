import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { Analytics } from '@vercel/analytics/next';

import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { SidebarProvider } from '../context/SidebarContext';
import { NotificationProvider } from '../context/NotificationContext';

import MenuBar from '../components/MenuBar';

import { useEffect } from 'react';

import { FormsProvider } from '../context/FormsContext';

function MyApp({ Component, pageProps }: AppProps) {
  // Remove the automatic dark mode enforcement that causes flashing
  // Let the ThemeProvider handle theme properly instead

  const content = (
    <div>
      {/* <MenuBar /> */}
      <Component {...pageProps} />
    </div>
  );

  return (
    <>
      {/* External SEO injection script - loads in the browser after hydration. */}
      {/* Note: Scripts that modify DOM or inject meta tags run client-side and may not be seen by search engine crawlers that rely on server-rendered HTML. */}
      <Script
        src="https://aimeta.marvelly.com.ng/v1"
        strategy="afterInteractive"
        onError={(e) => {
          // eslint-disable-next-line no-console
          console.error('Failed to load external SEO script', e);
        }}
      />

      {/* Speed Insights: client-only import to avoid SSR issues */}
      {/* Dynamically load to prevent build-time/SSR errors when running in non-browser environments */}
      <SpeedInsightsClient />
      {/* Vercel Analytics: collects client-side usage for Vercel Analytics dashboard */}
      <Analytics />

      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <SidebarProvider>
              <FormsProvider>{content}</FormsProvider>
            </SidebarProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}

export default MyApp;

// Dynamically import SpeedInsights client-side only.
const SpeedInsightsClient = dynamic(
  // Try a few possible export shapes from the package and fall back to the module itself.
  async () => {
    const mod = await import('@vercel/speed-insights/react');
    return mod?.default ?? mod.SpeedInsights ?? (() => null);
  },
  { ssr: false }
);
