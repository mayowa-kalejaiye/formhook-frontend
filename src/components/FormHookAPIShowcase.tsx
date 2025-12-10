"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code, Globe, Webhook, ChevronLeft, ChevronRight, Copy, ExternalLink } from "lucide-react";

// --- Data: Integration examples ---
const integrations = [
  {
    id: 1,
    name: "HTML Form",
    type: "Frontend Integration",
    description: "Direct HTML form submission",
    code: `<form action="https://api.formhookapp.com/submit/your-endpoint" method="POST">
  <input name="email" type="email" required>
  <input name="message" type="text" required>
  <button type="submit">Submit</button>
</form>`,
    icon: "🌐",
    color: "bg-blue-500",
  },
  {
    id: 2,
    name: "React Integration",
    type: "JavaScript Framework",
    description: "React component with FormHook",
    code: `import { useState } from 'react';

function ContactForm() {
  const [formData, setFormData] = useState({});
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch('https://api.formhookapp.com/submit/your-endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields */}
    </form>
  );
}`,
    icon: "⚛️",
    color: "bg-cyan-500",
  },
  {
    id: 3,
    name: "Webhook Setup",
    type: "Backend Integration",
    description: "Real-time data forwarding",
    code: `// Webhook endpoint example
app.post('/webhook', (req, res) => {
  const formData = req.body;
  
  // Process the form submission
  console.log('New submission:', formData);
  
  // Send to your database, CRM, etc.
  await processSubmission(formData);
  
  res.status(200).send('OK');
});`,
    icon: "🔗",
    color: "bg-green-500",
  },
  {
    id: 4,
    name: "API Integration",
    type: "RESTful API",
    description: "Server-side form processing",
    code: `// Server-side submission
const response = await fetch('https://api.formhookapp.com/submit/your-endpoint', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    message: 'Hello from FormHook!'
  })
});

const result = await response.json();`,
    icon: "🚀",
    color: "bg-purple-500",
  },
  {
    id: 5,
    name: "Vue.js Integration",
    type: "JavaScript Framework",
    description: "Vue component with FormHook",
    code: `<template>
  <form @submit.prevent="submitForm">
    <input v-model="form.email" type="email" required>
    <input v-model="form.message" type="text" required>
    <button type="submit">Submit</button>
  </form>
</template>

<script>
export default {
  data() {
    return {
      form: { email: '', message: '' }
    }
  },
  methods: {
    async submitForm() {
      await fetch('https://api.formhookapp.com/submit/your-endpoint', {
        method: 'POST',
        body: JSON.stringify(this.form)
      });
    }
  }
}
</script>`,
    icon: "💚",
    color: "bg-emerald-500",
  },
  {
    id: 6,
    name: "WordPress Plugin",
    type: "CMS Integration",
    description: "WordPress form integration",
    code: `// WordPress shortcode
[formhook endpoint="your-endpoint" fields="email,message,name"]

// Or use the WordPress plugin
add_action('wp_enqueue_scripts', function() {
  wp_enqueue_script('formhook', 'https://cdn.formhookapp.com/formhook.js');
});

// Initialize FormHook
FormHook.init({
  endpoint: 'your-endpoint',
  onSuccess: function(data) {
    alert('Form submitted successfully!');
  }
});`,
    icon: "📝",
    color: "bg-indigo-500",
  },
  {
    id: 7,
    name: "Zapier Integration",
    type: "Automation Platform",
    description: "Connect to 5000+ apps",
    code: `// Zapier trigger setup
{
  "trigger": "new_submission",
  "endpoint": "your-formhook-endpoint",
  "actions": [
    {
      "app": "gmail",
      "action": "send_email",
      "to": "admin@company.com"
    },
    {
      "app": "sheets",
      "action": "add_row",
      "spreadsheet": "submissions"
    }
  ]
}`,
    icon: "⚡",
    color: "bg-orange-500",
  },
  {
    id: 8,
    name: "Next.js Integration",
    type: "Full-Stack Framework",
    description: "Server-side and client-side",
    code: `// pages/api/contact.js
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const response = await fetch('https://api.formhookapp.com/submit/your-endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    
    const result = await response.json();
    res.status(200).json(result);
  }
}

// Client-side component
export default function ContactForm() {
  const handleSubmit = async (formData) => {
    await fetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
  };
}`,
    icon: "▲",
    color: "bg-slate-600",
  },
];

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

// --- Main Component ---
export default function FormHookAPIShowcase() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [copied, setCopied] = React.useState(false);
  const isMobile = useIsMobile();

  const containerRadius = isMobile ? 130 : 200;
  const profileSize = isMobile ? 60 : 80;
  const containerSize = containerRadius * 2 + 100;

  // Calculate rotation for each integration
  const getRotation = React.useCallback(
    (index: number): number => (index - activeIndex) * (360 / integrations.length),
    [activeIndex]
  );

  // Navigation
  const next = () => setActiveIndex((i) => (i + 1) % integrations.length);
  const prev = () => setActiveIndex((i) => (i - 1 + integrations.length) % integrations.length);

  const handleProfileClick = React.useCallback((index: number) => {
    if (index === activeIndex) return;
    setActiveIndex(index);
  }, [activeIndex]);

  // Copy code to clipboard
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(integrations[activeIndex].code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'ArrowLeft') prev();
      else if (event.key === 'ArrowRight') next();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col items-center p-6 relative min-h-[500px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          FormHook API Integration
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
          Connect FormHook to your application in minutes. Choose your integration method and see the code.
        </p>
      </div>

      <div
        className="relative flex items-center justify-center mb-8"
        style={{ width: containerSize, height: containerSize }}
      >
        {/* Single orbit circle */}
        <div
          className="absolute rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600"
          style={{
            width: containerRadius * 2,
            height: containerRadius * 2,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Active Integration Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={integrations[activeIndex].id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ 
              duration: 0.3,
              ease: "easeInOut"
            }}
            className="z-10 bg-white dark:bg-slate-950 backdrop-blur-sm shadow-xl dark:shadow-2xl dark:shadow-slate-900/50 rounded-xl p-4 md:p-6 w-56 md:w-64 text-center border border-slate-200 dark:border-slate-700"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full mx-auto -mt-10 md:-mt-12 bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-500 dark:to-slate-600 border-4 border-white dark:border-slate-950 shadow-md text-2xl md:text-3xl"
            >
              {integrations[activeIndex].icon}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <h3 className="mt-3 text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100">
                {integrations[activeIndex].name}
              </h3>
              <div className="flex items-center justify-center text-sm text-slate-600 dark:text-slate-400 mt-1">
                <Code size={14} className="mr-1" /> 
                <span className="truncate">{integrations[activeIndex].type}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 px-2">
                {integrations[activeIndex].description}
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
                title="Previous integration"
                aria-label="Previous integration"
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft size={16} className="text-slate-700 dark:text-slate-300" />
              </button>
              <button 
                onClick={copyCode}
                className="px-4 py-2 text-sm rounded-lg bg-slate-600 text-white hover:bg-slate-700 dark:bg-slate-500 dark:hover:bg-slate-400 transition-colors flex items-center gap-2"
              >
                <Copy size={14} />
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
              <button
                onClick={next}
                title="Next integration"
                aria-label="Next integration"
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronRight size={16} className="text-slate-700 dark:text-slate-300" />
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Orbiting Integration Icons */}
        {integrations.map((integration, i) => {
          const rotation = getRotation(i);
          return (
            <motion.div
              key={integration.id}
              animate={{
                transform: `rotate(${rotation}deg) translateY(-${containerRadius}px)`,
              }}
              transition={{
                duration: 0.8,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              style={{
                width: profileSize,
                height: profileSize,
                position: "absolute",
                top: `calc(50% - ${profileSize / 2}px)`,
                left: `calc(50% - ${profileSize / 2}px)`,
              }}
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
                  onClick={() => handleProfileClick(i)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full h-full rounded-full cursor-pointer transition-all duration-300 flex items-center justify-center text-xl md:text-2xl font-bold bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 ${
                    i === activeIndex 
                      ? "border-4 border-slate-500 dark:border-slate-400 shadow-lg scale-110" 
                      : "border-2 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"
                  }`}
                >
                  {integration.icon}
                </motion.div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Code Display */}
      <motion.div
        key={activeIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-4xl"
      >
        <div className="bg-slate-900 dark:bg-slate-950 rounded-lg border border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-slate-400 text-sm font-mono">
              {integrations[activeIndex].name.toLowerCase().replace(/\s+/g, '-')}.{integrations[activeIndex].type.includes('HTML') ? 'html' : integrations[activeIndex].type.includes('WordPress') ? 'php' : 'js'}
            </span>
            <button
              onClick={copyCode}
              className="flex items-center gap-2 px-3 py-1 rounded text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
            >
              <Copy size={12} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="p-4 text-sm text-slate-300 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
            <code>{integrations[activeIndex].code}</code>
          </pre>
        </div>
      </motion.div>

      {/* Integration Stats */}
      <div className="grid grid-cols-3 gap-4 mt-8 w-full max-w-md">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">60s</div>
          <div className="text-xs text-slate-600 dark:text-slate-400">Setup Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">99.9%</div>
          <div className="text-xs text-slate-600 dark:text-slate-400">Uptime SLA</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">180ms</div>
          <div className="text-xs text-slate-600 dark:text-slate-400">Response Time</div>
        </div>
      </div>
    </div>
  );
}
