import '../styles/globals.css';
import type { AppProps } from 'next/app';

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
    <div className="min-h-screen">
      {/* <MenuBar /> */}
      <Component {...pageProps} />
    </div>
  );

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <SidebarProvider>
            <FormsProvider>{content}</FormsProvider>
          </SidebarProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default MyApp;
