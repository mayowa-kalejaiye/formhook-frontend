// src/components/PurpleGradientGridLeft.tsx
'use client'
import React from 'react';

export default function PurpleGradientGridLeft({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full relative flex flex-col">
      {/* Purple Gradient Grid Left Pattern Background */}
      <div className="absolute inset-0 z-0">
        <svg width="100%" height="100%" className="absolute left-0 top-0" style={{ minHeight: '100vh' }}>
          <defs>
            <linearGradient id="purpleGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
          <rect x="-200" y="-200" width="800" height="2000" fill="url(#purpleGradient)" opacity="0.25" />
          {/* Grid lines */}
          {Array.from({ length: 20 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={i * 40}
              y1={0}
              x2={i * 40}
              y2={2000}
              stroke="#a78bfa"
              strokeWidth="0.5"
              opacity="0.12"
            />
          ))}
          {Array.from({ length: 30 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1={0}
              y1={i * 40}
              x2={800}
              y2={i * 40}
              stroke="#a78bfa"
              strokeWidth="0.5"
              opacity="0.12"
            />
          ))}
        </svg>
      </div>
      <div className="relative z-10 flex-1 flex flex-col">{children}</div>
    </div>
  );
}
