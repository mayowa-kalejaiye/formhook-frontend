"use client";
// Animated Flower Badge
const FlowerIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 200 200"
    width="20"
    height="20"
    className="coolshapes flower-1 opacity-80 dark:opacity-100"
  >
    <g clipPath="url(#cs_clip_1_flower-1)">
      <mask
        id="cs_mask_1_flower-1"
        style={{ maskType: 'alpha' }}
        width="200"
        height="186"
        x="0"
        y="7"
        maskUnits="userSpaceOnUse"
      >
        <path
          fill="#fff"
          d="M150.005 128.863c66.681 38.481-49.997 105.828-49.997 28.861 0 76.967-116.658 9.62-49.997-28.861-66.681 38.481-66.681-96.207 0-57.727-66.681-38.48 49.997-105.827 49.997-28.86 0-76.967 116.657-9.62 49.997 28.86 66.66-38.48 66.66 96.208 0 57.727z"
        ></path>
      </mask>
      <g mask="url(#cs_mask_1_flower-1)">
        <path fill="#fff" d="M200 0H0v200h200V0z"></path>
        <path
          fill="url(#paint0_linear_748_4711)"
          d="M200 0H0v200h200V0z"
        ></path>
        <g filter="url(#filter0_f_748_4711)">
          <path fill="#FF58E4" d="M130 0H69v113h61V0z"></path>
          <path
            fill="#0CE548"
            fillOpacity="0.35"
            d="M196 91H82v102h114V91z"
          ></path>
          <path
            fill="#FFE500"
            fillOpacity="0.74"
            d="M113 80H28v120h85V80z"
          ></path>
        </g>
      </g>
    </g>
    <defs>
      <filter
        id="filter0_f_748_4711"
        width="278"
        height="310"
        x="-27"
        y="-55"
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
        <feBlend
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        ></feBlend>
        <feGaussianBlur
          result="effect1_foregroundBlur_748_4711"
          stdDeviation="27.5"
        ></feGaussianBlur>
      </filter>
      <linearGradient
        id="paint0_linear_748_4711"
        x1="186.5"
        x2="37"
        y1="37"
        y2="186.5"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#0E6FFF" stopOpacity="0.51"></stop>
        <stop offset="1" stopColor="#00F0FF" stopOpacity="0.59"></stop>
      </linearGradient>
      <clipPath id="cs_clip_1_flower-1">
        <path fill="#fff" d="M0 0H200V200H0z"></path>
      </clipPath>
    </defs>
    <g
      style={{ mixBlendMode: 'overlay' }}
      mask="url(#cs_mask_1_flower-1)"
    >
      <path
        fill="gray"
        stroke="transparent"
        d="M200 0H0v200h200V0z"
        filter="url(#cs_noise_1_flower-1)"
      ></path>
    </g>
    <defs>
      <filter
        id="cs_noise_1_flower-1"
        width="100%"
        height="100%"
        x="0%"
        y="0%"
        filterUnits="objectBoundingBox"
      >
        <feTurbulence
          baseFrequency="0.6"
          numOctaves="5"
          result="out1"
          seed="4"
        ></feTurbulence>
        <feComposite
          in="out1"
          in2="SourceGraphic"
          operator="in"
          result="out2"
        ></feComposite>
        <feBlend
          in="SourceGraphic"
          in2="out2"
          mode="overlay"
          result="out3"
        ></feBlend>
      </filter>
    </defs>
  </svg>
);

type AnimatedBadgeProps = {
  text: string;
  icon: React.ReactNode;
  borderColor: string;
  className?: string;
};

const AnimatedBadge = ({ text, icon, borderColor, className = '' }: AnimatedBadgeProps) => {
  return (
    <div
      className={`rounded-full p-[1px] bg-gradient-to-r from-transparent ${borderColor} to-transparent [background-size:400%_100%] ${className}`}
      style={{ animation: 'move-bg 8s linear infinite' }}
    >
      <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-[#0a091e] px-4 py-1.5 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-transparent">
        {icon}
        <span>{text}</span>
      </div>
    </div>
  );

};
import React from 'react';

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

// FormHook Product Hero Section
const featureBullets = [
  "Developer-first event intake",
  "Single endpoint + dashboard",
  "Email and webhook routing",
  "Automatic retry and delivery tracking",
  "No backend glue code",
];

const Hero3: React.FC = () => {
  return (
    <div className="bg-white dark:bg-black w-full overflow-x-hidden">
      {/* Keep nav constrained but make hero full-bleed */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6">
        <header className="py-6">
          <nav className="flex items-center justify-between">
            <div className="text-2xl font-bold text-black dark:text-white">
              <span className="text-blue-600 dark:text-blue-400">FormHook</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#how-it-works" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer">Features</a>
              <a href="/docs" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer">Docs</a>
              <a href="/signin" className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors cursor-pointer">Sign In</a>
            </div>
          </nav>
        </header>
      </div>

      {/* Full-bleed hero so it spans the full viewport width on mobile */}
      <section className="w-full min-h-[calc(100vh-6rem)] flex items-center justify-center py-12 lg:py-20">
        <div className="w-full px-4 sm:px-6 lg:px-6">
          <div className="mx-auto" style={{ maxWidth: '90rem' }}>
            {/* Hero Content */}
            <main className="flex flex-col items-center justify-center">
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-center text-black dark:text-white leading-tight max-w-4xl mx-auto">
            Ingest frontend events. <span className="text-blue-600 dark:text-blue-400">Deliver them reliably.</span>
          </h1>
          {/* Subtext */}
          <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-center">
            Use forms as the entry point, or send payloads programmatically. Point your <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-blue-600 dark:text-blue-400">&lt;form&gt;</code> or API call to FormHook.<br />
            We handle validation, storage, routing, retries, and delivery visibility so your team can ship faster.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/signup" className="bg-blue-600 dark:bg-blue-500 text-white px-8 py-4 rounded-md font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-lg shadow-lg cursor-pointer">
              Try It Free
              <ArrowRightIcon className="h-5 w-5" />
            </a>
            <a href="/docs" className="border-2 border-blue-600 dark:border-blue-400 text-blue-700 dark:text-blue-400 px-8 py-4 rounded-md font-semibold hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors text-lg cursor-pointer">
              Read Docs
            </a>
          </div>

          {/* Code Preview */}
          <div className="mt-12 flex flex-col items-center w-full">
            <div className="bg-black text-white rounded-xl shadow-lg p-6 w-full max-w-2xl lg:max-w-4xl text-left font-mono text-sm md:text-base relative border border-gray-800">
              <div className="absolute top-3 right-4 text-xs text-gray-400 select-none">html</div>
              <pre className="overflow-auto whitespace-pre-wrap break-words leading-relaxed"><code>{`<form action=\"https://api.formhook.dev/forms/abc123/submit\" method=\"POST\">\n  <input name=\"email\" type=\"email\" />\n  <button type=\"submit\">Send event</button>\n</form>`}</code></pre>
            </div>
            <div className="mt-2 text-xs text-gray-400">One endpoint. Tracked delivery. Production-ready in minutes.</div>
          </div>

          {/* Feature Badges (Animated) */}
          <style>{`
            @keyframes move-bg {
              to { background-position: 400% 0; }
            }
          `}</style>
          <div className="mt-12 flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
            {featureBullets.map((feature, idx) => (
              <AnimatedBadge
                key={idx}
                text={feature}
                icon={<FlowerIcon />}
                borderColor="via-sky-500"
              />
            ))}
          </div>
        </main>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero3;
