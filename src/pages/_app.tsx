import '../styles/globals.css';
import type { AppProps } from 'next/app';

import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';


import Footer2 from '../components/Footer2';
import StickyDock from '../components/StickyDock';
import MenuBar from '../components/MenuBar';


import { useEffect } from 'react';

import { FormsProvider } from '../context/FormsContext';

function MyApp({ Component, pageProps, router }: AppProps & { router: any }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Only wrap with FormsProvider on /dashboard, /forms, /forms/*, /submissions, etc.
  const formsRoutes = [
    '/dashboard',
    '/forms',
    '/forms/new',
    '/forms/[formId]',
    '/forms/[formId]/analytics',
    '/submissions',
  ];
  const isFormsRoute = formsRoutes.some(route => router.pathname.startsWith(route.replace('[formId]', '')));

  const content = (
    <div className="flex flex-col min-h-screen">
      {/* <MenuBar /> */}
      <div className="flex-1">
        <Component {...pageProps} />
      </div>
      <StickyDock />
      <Footer2 />
    </div>
  );

  return (
    <ThemeProvider>
      <AuthProvider>
        {isFormsRoute ? (
          <FormsProvider>{content}</FormsProvider>
        ) : (
          content
        )}
      </AuthProvider>
    </ThemeProvider>
  );
}

export default MyApp;
