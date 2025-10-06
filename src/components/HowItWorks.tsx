// --- How It Works: FormHook Workflow Steps Using Orbit Carousel ---
'use client';
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code, Database, Send, Settings, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

// --- Data: FormHook workflow steps ---
const workflowSteps = [
  {
    id: 1,
    step: "Step 1",
    title: "Create Your Form",
    description: "Build and customize your HTML form with our simple API",
    icon: Code,
    color: "bg-blue-500",
    action: "action=\"https://formhook.io/submit/YOUR_FORM_ID\"",
    details: "Add our form action URL to any HTML form. No complex setup required."
  },
  {
    id: 2,
    step: "Step 2", 
    title: "Configure Destinations",
    description: "Set up where submissions should be sent automatically",
    icon: Settings,
    color: "bg-green-500",
    action: "Webhooks • Email • Slack • Discord",
    details: "Route submissions to multiple destinations instantly with smart filtering."
  },
  {
    id: 3,
    step: "Step 3",
    title: "Collect Submissions",
    description: "Your forms start collecting data immediately",
    icon: Database,
    color: "bg-purple-500", 
    action: "Real-time collection & storage",
    details: "All submissions are securely stored and processed in real-time."
  },
  {
    id: 4,
    step: "Step 4",
    title: "Auto-Route Data", 
    description: "Data flows automatically to your chosen destinations",
    icon: Send,
    color: "bg-orange-500",
    action: "Instant delivery to your tools",
    details: "Submissions are instantly routed to Slack, webhooks, email, and more."
  }
];

// --- Utility for fallback images ---
const safeImage = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.target as HTMLImageElement;
  target.src = "https://placehold.co/100x100/E0E7FF/4338CA?text=Error";
};

// --- Custom hook for mobile detection ---
const useIsMobile = (breakpoint: number = 768): boolean => {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);
  
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkScreenSize = (): void => setIsMobile(window.innerWidth < breakpoint);
    
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [breakpoint]);
  
  return isMobile;
};

// --- Main Workflow Orbit Component ---
export function WorkflowOrbitCarousel() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const isMobile = useIsMobile();

  const containerRadius = isMobile ? 130 : 180;
  const iconSize = isMobile ? 60 : 80;
  const containerSize = containerRadius * 2 + 140;

  // Calculate rotation for each step
  const getRotation = React.useCallback(
    (index: number): number => (index - activeIndex) * (360 / workflowSteps.length),
    [activeIndex]
  );

  // Navigation
  const next = () => setActiveIndex((i) => (i + 1) % workflowSteps.length);
  const prev = () => setActiveIndex((i) => (i - 1 + workflowSteps.length) % workflowSteps.length);

  const handleStepClick = React.useCallback((index: number) => {
    if (index === activeIndex) return;
    setActiveIndex(index);
  }, [activeIndex]);

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'ArrowLeft') prev();
      else if (event.key === 'ArrowRight') next();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-advance every 4 seconds
  React.useEffect(() => {
    const interval = setInterval(next, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center p-4 relative min-h-[400px] bg-transparent">
      <style jsx>{`
        .orbit-container {
          width: ${containerSize}px;
          height: ${containerSize}px;
        }
        .orbit-circle {
          width: ${containerRadius * 2}px;
          height: ${containerRadius * 2}px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        .orbit-item {
          width: ${iconSize}px;
          height: ${iconSize}px;
          position: absolute;
          top: calc(50% - ${iconSize / 2}px);
          left: calc(50% - ${iconSize / 2}px);
        }
      `}</style>

      <div className="orbit-container relative flex items-center justify-center">
        {/* Orbit circle */}
        <div className="orbit-circle absolute rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 opacity-30" />

        {/* Active Step Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={workflowSteps[activeIndex].id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ 
              duration: 0.4,
              ease: "easeInOut"
            }}
            className="z-10 bg-white dark:bg-gray-950 backdrop-blur-sm shadow-xl dark:shadow-2xl dark:shadow-gray-900/50 rounded-xl p-4 md:p-6 w-64 md:w-72 text-center border border-gray-100 dark:border-gray-800"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className={`w-16 h-16 md:w-20 md:h-20 rounded-full mx-auto -mt-10 md:-mt-12 border-4 border-white dark:border-gray-950 shadow-lg flex items-center justify-center ${workflowSteps[activeIndex].color}`}
            >
              {React.createElement(workflowSteps[activeIndex].icon, { 
                size: isMobile ? 24 : 28, 
                className: "text-white" 
              })}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-3">
                {workflowSteps[activeIndex].step}
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white mt-1">
                {workflowSteps[activeIndex].title}
              </h3>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-2">
                {workflowSteps[activeIndex].description}
              </p>
              <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <code className="text-xs text-gray-700 dark:text-gray-300 font-mono">
                  {workflowSteps[activeIndex].action}
                </code>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                {workflowSteps[activeIndex].details}
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex justify-center items-center mt-4 space-x-2"
            >
              <button
                onClick={prev}
                aria-label="Previous step"
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft size={16} className="text-gray-700 dark:text-gray-300" />
              </button>
              <div className="flex space-x-1">
                {workflowSteps.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === activeIndex ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={next}
                aria-label="Next step"
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronRight size={16} className="text-gray-700 dark:text-gray-300" />
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Orbiting Step Icons */}
        {workflowSteps.map((step, i) => {
          const rotation = getRotation(i);
          return (
            <motion.div
              key={step.id}
              animate={{
                transform: `rotate(${rotation}deg) translateY(-${containerRadius}px)`,
              }}
              transition={{
                duration: 0.8,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              className="orbit-item"
            >
              {/* Counter-rotation to keep icon upright */}
              <motion.div
                animate={{ rotate: -rotation }}
                transition={{
                  duration: 0.8,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                className="w-full h-full"
              >
                <motion.div
                  onClick={() => handleStepClick(i)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full h-full rounded-full cursor-pointer transition-all duration-300 flex items-center justify-center shadow-lg ${
                    i === activeIndex 
                      ? `${step.color} border-4 border-white dark:border-gray-950 shadow-xl` 
                      : "bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
                  }`}
                >
                  {React.createElement(step.icon, { 
                    size: isMobile ? 20 : 24, 
                    className: i === activeIndex ? "text-white" : "text-gray-600 dark:text-gray-300" 
                  })}
                </motion.div>
              </motion.div>
            </motion.div>
          );
        })}

        {/* Connection arrows between steps */}
        {workflowSteps.map((_, i) => {
          const nextIndex = (i + 1) % workflowSteps.length;
          const rotation = getRotation(i);
          const nextRotation = getRotation(nextIndex);
          
          return (
            <motion.div
              key={`arrow-${i}`}
              animate={{
                transform: `rotate(${rotation + 45}deg) translateY(-${containerRadius + 20}px)`,
                opacity: Math.abs(rotation) < 90 ? 0.6 : 0.2
              }}
              transition={{
                duration: 0.8,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              style={{
                position: "absolute",
                top: `calc(50% - 12px)`,
                left: `calc(50% - 12px)`,
              }}
            >
              <ArrowRight size={24} className="text-blue-500 dark:text-blue-400" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          How FormHook Works
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
          Get started in minutes. FormHook makes form handling effortless with a simple 4-step process 
          that automatically routes your data where it needs to go.
        </p>
        <div className="flex items-center justify-center">
          <WorkflowOrbitCarousel />
        </div>
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Ready to streamline your form workflow?
          </p>
          <button className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
            Get Started Free
            <ArrowRight size={16} className="ml-2" />
          </button>
        </div>
      </div>
    </section>
  );
}
