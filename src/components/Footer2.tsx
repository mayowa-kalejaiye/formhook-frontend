'use client'
import React from 'react';

function Footer2() {
  // Navigation links data
  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Docs', href: '#docs' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Help', href: '#' },
    { name: 'About', href: '#' },
  ];

  // Social media icons data
  const socialIcons = [
    {
      name: 'X',
      href: '#',
      svg: (
        <svg className="size-6 transition-transform duration-200 hover:scale-110" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
          <path fill="currentColor" d="M10.488 14.651L15.25 21h7l-7.858-10.478L20.93 3h-2.65l-5.117 5.886L8.75 3h-7l7.51 10.015L2.32 21h2.65zM16.25 19L5.75 5h2l10.5 14z"></path>
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      href: '#',
      svg: (
        <svg className="size-6 transition-transform duration-200 hover:scale-110" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
          <path fill="currentColor" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93zM6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37z"></path>
        </svg>
      ),
    },
    {
      name: 'GitHub',
      href: '#',
      svg: (
        <svg className="size-6 transition-transform duration-200 hover:scale-110" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.22-.253-4.555-1.112-4.555-4.951 0-1.093.39-1.987 1.029-2.686-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.203 2.397.1 2.65.64.699 1.028 1.593 1.028 2.686 0 3.848-2.338 4.695-4.566 4.944.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .267.18.578.688.48C19.138 20.2 22 16.448 22 12.021 22 6.484 17.523 2 12 2z"></path>
        </svg>
      ),
    },
    {
      name: 'Instagram',
      href: '#',
      svg: (
        <svg className="size-6 transition-transform duration-200 hover:scale-110" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
          <path fill="currentColor" d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3"></path>
        </svg>
      ),
    },
  ];

  return (
    <footer className="py-10 px-4 sm:px-6 lg:px-8 font-inter relative overflow-hidden ">
      <div className="max-w-7xl mx-auto flex flex-col items-center relative z-10">
        {/* Logo */}
        <div className="mb-6 flex items-center justify-center">
          {/* FormHook Logo SVG */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 200 200" width="48" height="48" className="mr-3 drop-shadow-lg">
            <g clipPath="url(#cs_clip_1_flower-3)">
              <mask id="cs_mask_1_flower-3" style={{ maskType: 'alpha' }} width="200" height="200" x="0" y="0" maskUnits="userSpaceOnUse">
                <path fill="#fff" d="M200 50c0-27.614-22.386-50-50-50s-50 22.386-50 50c0-27.614-22.386-50-50-50S0 22.386 0 50s22.386 50 50 50c-27.614 0-50 22.386-50 50s22.386 50 50 50 50-22.386 50-50c0 27.614 22.386 50 50 50s50-22.386 50-50c0-27.608-22.375-49.989-49.98-50C177.625 99.99 200 77.608 200 50z"></path>
              </mask>
              <g mask="url(#cs_mask_1_flower-3)">
                <path fill="#fff" d="M200 0H0v200h200V0z"></path>
                <path fill="url(#paint0_linear_748_4691)" fillOpacity="0.55" d="M200 0H0v200h200V0z"></path>
                <g filter="url(#filter0_f_748_4691)">
                  <path fill="#18A0FB" d="M131 3H-12v108h143V3z"></path>
                  <path fill="#FF58E4" d="M190 109H0v116h190V109z"></path>
                  <ellipse cx="153.682" cy="64.587" fill="#FFD749" rx="83" ry="57" transform="rotate(-33.875 153.682 64.587)"></ellipse>
                </g>
              </g>
            </g>
            <defs>
              <filter id="filter0_f_748_4691" width="361.583" height="346.593" x="-72" y="-61.593" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
                <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend>
                <feGaussianBlur result="effect1_foregroundBlur_748_4691" stdDeviation="30"></feGaussianBlur>
              </filter>
              <linearGradient id="paint0_linear_748_4691" x1="200" x2="0" y1="0" y2="200" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF1F00"></stop>
                <stop offset="1" stopColor="#FFD600"></stop>
              </linearGradient>
              <clipPath id="cs_clip_1_flower-3">
                <path fill="#fff" d="M0 0H200V200H0z"></path>
              </clipPath>
            </defs>
            <g style={{ mixBlendMode: 'overlay' }} mask="url(#cs_mask_1_flower-3)">
              <path fill="gray" stroke="transparent" d="M200 0H0v200h200V0z" filter="url(#cs_noise_1_flower-3)"></path>
            </g>
            <defs>
              <filter id="cs_noise_1_flower-3" width="100%" height="100%" x="0%" y="0%" filterUnits="objectBoundingBox">
                <feTurbulence baseFrequency="0.6" numOctaves="5" result="out1" seed="4"></feTurbulence>
                <feComposite in="out1" in2="SourceGraphic" operator="in" result="out2"></feComposite>
                <feBlend in="SourceGraphic" in2="out2" mode="overlay" result="out3"></feBlend>
              </filter>
            </defs>
          </svg>
          {/* Logo Text */}
          <span className="text-gray-900 dark:text-white text-3xl font-extrabold tracking-wide">FormHook</span>
        </div>

        {/* Navigation Links */}
        <nav className="mb-6 w-full">
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-base font-medium">
            {navLinks.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-300 relative after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-0 after:bg-gray-900 dark:after:bg-white after:transition-all after:duration-300 hover:after:w-full"
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Social Media Icons */}
        <div className="my-6 flex flex-wrap justify-center gap-4 text-sm">
          {socialIcons.map((icon) => (
            <a
              key={icon.name}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={icon.name}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
              href={icon.href}
            >
              {icon.svg}
            </a>
          ))}
        </div>

        {/* Copyright Notice */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-4">
          &copy; {new Date().getFullYear()} FormHook. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer2;
