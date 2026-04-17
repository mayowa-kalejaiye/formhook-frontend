// --- How It Works: Orbit Carousel adapted for FormHook ---
'use client';
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Zap, Server, Database, Settings, Code, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

// --- Data: FormHook feature cards ---
const features = [
  {
    id: 1,
    title: "Unified Intake Endpoint",
    subtitle: "Point & Send",
    description: "Send form payloads or frontend events to one endpoint and start ingesting immediately.",
    icon: Code,
    color: "bg-blue-600",
    detail: `Example: action="https://formhookapp.vercel.app/forms/{formid}/submit"`
  },
  {
    id: 2,
    title: "Webhooks & Email",
    subtitle: "Deliver Everywhere",
    description: "Route events to webhooks, send emails, or forward to downstream integrations.",
    icon: Mail,
    color: "bg-emerald-500",
    detail: `Webhooks • Email • Integrations`
  },
  {
    id: 3,
    title: "Retry Queue",
    subtitle: "Reliable Delivery",
    description: "Failed deliveries are retried automatically with exponential backoff.",
    icon: Zap,
    color: "bg-orange-500",
    detail: `Automatic retries & dead-letter handling`
  },
  {
    id: 4,
    title: "Storage & Replay",
    subtitle: "Secure Storage",
    description: "Events are stored securely, searchable in the dashboard, and ready for debugging workflows.",
    icon: Database,
    color: "bg-purple-600",
    detail: `Encrypted storage • Exportable CSV`
  },
  {
    id: 5,
    title: "Transform & Route",
    subtitle: "Flexible Rules",
    description: "Apply transforms, filters, and routing rules to shape where data goes.",
    icon: Settings,
    color: "bg-sky-500",
    detail: `Filtering, transforms, conditional routing`
  },
  {
    id: 6,
    title: "Self-host or SaaS",
    subtitle: "Deploy Your Way",
    description: "Run FormHook as a managed service or deploy on your own infrastructure.",
    icon: Server,
    color: "bg-gray-600",
    detail: `Cloud or self-hosted options`
  },
  {
    id: 7,
    title: "Analytics",
    subtitle: "Delivery Intelligence",
    description: "Built-in dashboards show traffic trends, geo insights, and delivery health at a glance.",
    icon: Database,
    color: "bg-indigo-600",
    detail: `Trends • Geo • Webhook health`
  },
  {
    id: 8,
    title: "Team & Access",
    subtitle: "Invite Collaborators",
    description: "Add teammates, manage API keys, and control access to forms and data.",
    icon: Settings,
    color: "bg-teal-500",
    detail: `Role-based access & API tokens`
  }
];

// --- Utility fallback image (used if any feature icons were images) ---
const safeImage = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.target as HTMLImageElement;
  target.src = "https://placehold.co/100x100/E0E7FF/4338CA?text=FormHook";
};

// --- Custom hook for mobile detection ---
const useIsMobile = (breakpoint: number = 768): boolean => {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
};


// --- Orbit Carousel Component (features) ---
export default function OrbitCarousel() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const isMobile = useIsMobile();

  const containerRadius = isMobile ? 120 : 200;
  const profileSize = isMobile ? 60 : 84;
  const containerSize = containerRadius * 2 + 120;
  const containerClass = isMobile ? 'w-[360px] h-[360px]' : 'w-[520px] h-[520px]';
  const circleClass = isMobile ? 'w-[240px] h-[240px]' : 'w-[400px] h-[400px]';
  const profileClass = isMobile ? 'w-[60px] h-[60px]' : 'w-[84px] h-[84px]';

  const getRotation = React.useCallback(
    (index: number) => (index - activeIndex) * (360 / features.length),
    [activeIndex]
  );

  const next = () => setActiveIndex(i => (i + 1) % features.length);
  const prev = () => setActiveIndex(i => (i - 1 + features.length) % features.length);

  const handleClick = React.useCallback((index: number) => {
    if (index === activeIndex) return;
    setActiveIndex(index);
  }, [activeIndex]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') prev(); else if (e.key === 'ArrowRight') next(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <section className="py-12">
      <div className="max-w-6xl mx-auto text-center px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">How FormHook Works</h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">Use FormHook as your intake and delivery layer: capture events, route them reliably, and monitor every delivery from one place.</p>

        <div className="flex flex-col items-center">
          <div className={`${containerClass} relative`}> 
            <div className={`absolute rounded-full border border-gray-200 dark:border-gray-700 ${circleClass} top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`} />

            {/* Active feature card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={features[activeIndex].id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.28 }}
                  className="z-30 bg-white dark:bg-gray-950 rounded-xl p-4 md:p-6 w-64 md:w-72 text-center border border-gray-100 dark:border-gray-800 shadow-lg mx-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden"
              >
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full mx-auto -mt-10 md:-mt-12 border-4 border-white dark:border-gray-950 flex items-center justify-center ${features[activeIndex].color}`}>
                  {React.createElement(features[activeIndex].icon, { size: isMobile ? 18 : 22, className: 'text-white' })}
                </div>
                <h3 className="mt-3 text-base md:text-lg font-bold text-gray-900 dark:text-white">{features[activeIndex].title}</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{features[activeIndex].subtitle}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{features[activeIndex].description}</p>
                <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300 break-words whitespace-normal text-left max-w-full">{features[activeIndex].detail}</div>
                <div className="flex items-center justify-center mt-3 gap-2">
                  <button onClick={prev} aria-label="Previous" className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800">
                    <ChevronLeft size={16} className="text-gray-700 dark:text-gray-300" />
                  </button>
                  <button className="px-4 py-1 text-sm rounded-full bg-indigo-600 text-white">Get Started</button>
                  <button onClick={next} aria-label="Next" className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800">
                    <ChevronRight size={16} className="text-gray-700 dark:text-gray-300" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Orbiting feature icons */}
            {features.map((f, i) => {
              const rotation = getRotation(i);
              return (
                <motion.div
                  key={f.id}
                  animate={{ transform: `rotate(${rotation}deg) translateY(-${containerRadius}px)` }}
                  transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                  className={`${profileClass} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}
                >
                  <motion.div animate={{ rotate: -rotation }} transition={{ duration: 0.8 }} className="w-full h-full">
                      <div onClick={() => handleClick(i)} className={`w-full h-full rounded-full flex items-center justify-center cursor-pointer ${i === activeIndex ? `${f.color} border-4 border-white dark:border-gray-950 shadow-lg` : 'bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-indigo-400'}`}>
                      {React.createElement(f.icon, { size: isMobile ? 18 : 22, className: i === activeIndex ? 'text-white' : 'text-gray-600 dark:text-gray-300' })}
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}

          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              {features.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i === activeIndex ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`} />
              ))}
            </div>
          </div>

          <div className="mt-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Ready to streamline your form workflow?</p>
            <button className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
              Get Started Free
              <ArrowRight size={16} className="ml-2" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
