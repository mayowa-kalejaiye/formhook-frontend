import React, { useState, useEffect } from 'react';
import { apiCache } from '@/utils/cache';

/**
 * Visual indicator showing cache status
 * Shows when data is loaded from cache vs fresh from API
 */
export const CacheIndicator: React.FC<{ show: boolean; fromCache?: boolean }> = ({ 
  show, 
  fromCache = false 
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2">
      <div className={`
        px-4 py-2 rounded-lg shadow-lg backdrop-blur-md
        ${fromCache 
          ? 'bg-blue-500/90 text-white' 
          : 'bg-green-500/90 text-white'
        }
        flex items-center gap-2
      `}>
        {fromCache ? (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm font-medium">Loaded from cache</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm font-medium">Fresh data loaded</span>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Developer tool to monitor cache stats
 * Only visible in development mode
 */
export const CacheDebugger: React.FC = () => {
  const [stats, setStats] = useState({ size: 0, keys: [] as string[] });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(apiCache.stats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
          <span className="text-sm font-medium">Cache: {stats.size}</span>
        </button>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 w-80 max-h-96 overflow-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Cache Debugger</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Cached Entries: <span className="font-semibold text-purple-600">{stats.size}</span>
            </div>
            <button
              onClick={() => {
                apiCache.clear();
                setStats(apiCache.stats());
              }}
              className="w-full bg-red-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Clear All Cache
            </button>
          </div>

          {stats.keys.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Cached Keys:</h4>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {stats.keys.map((key, idx) => (
                  <div
                    key={idx}
                    className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded break-all"
                  >
                    {key}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
