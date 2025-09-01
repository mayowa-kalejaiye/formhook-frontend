"use client";
// src/components/BottomGradientRadial.tsx
'use client'
import React from 'react';

export default function BottomGradientRadial({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full relative flex flex-col">
      {/* Bottom Gradient Radial Pattern Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg width="100%" height="100%" className="absolute left-0 top-0" style={{ minHeight: '100vh' }}>
          <defs>
            <radialGradient id="bottomRadial" cx="50%" cy="100%" r="80%" fx="50%" fy="100%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#7c3aed" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#bottomRadial)" />
        </svg>
      </div>
      <div className="relative z-10 flex-1 flex flex-col">{children}</div>
    </div>
  );
}
