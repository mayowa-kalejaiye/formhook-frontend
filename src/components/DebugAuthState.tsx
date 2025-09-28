/**
 * Add this to the landing page temporarily to debug the redirect issue
 * Insert this right after the Hero3 component in src/pages/index.tsx
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';

function DebugAuthState() {
  const { user, loading } = useAuth();
  
  React.useEffect(() => {
    console.log('🔍 Landing Page Debug:', {
      pathname: window.location.pathname,
      user: user,
      loading: loading,
      userAgent: navigator.userAgent,
      cookies: document.cookie,
      localStorage: Object.keys(localStorage),
      timestamp: new Date().toISOString()
    });
  }, [user, loading]);

  React.useEffect(() => {
    // Monitor for any unexpected navigation
    const handleBeforeUnload = (e) => {
      console.log('🚨 Page is about to navigate from:', window.location.href);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div>User: {user ? `${user.email} (verified: ${user.verified})` : 'null'}</div>
      <div>Loading: {loading ? 'true' : 'false'}</div>
      <div>Path: {typeof window !== 'undefined' ? window.location.pathname : 'SSR'}</div>
    </div>
  );
}

export default DebugAuthState;
