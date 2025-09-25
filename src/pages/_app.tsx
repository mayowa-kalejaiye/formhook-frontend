import '../styles/globals.css';
import type { AppProps } from 'next/app';

import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { SidebarProvider } from '../context/SidebarContext';

import Footer2 from '../components/Footer2';
import MenuBar from '../components/MenuBar';

import { useEffect } from 'react';

import { FormsProvider } from '../context/FormsContext';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const content = (
    <div className="flex flex-col min-h-screen">
      {/* <MenuBar /> */}
      <div className="flex-1">
        <Component {...pageProps} />
      </div>
      <Footer2 />
    </div>
  );

  return (
    <ThemeProvider>
      <AuthProvider>
        <SidebarProvider>
          <FormsProvider>{content}</FormsProvider>
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default MyApp;
