"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";


// TypeScript interfaces
interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingPlan {
  name: string;
  price: string;
  pricePeriod: string | null;
  description: string;
  features: PricingFeature[];
  buttonText: string;
  isPopular: boolean;
}

interface PricingCardProps {
  plan: PricingPlan;
}

// SVG Icon for included features
const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

// SVG Icon for excluded features
const TimesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 flex-shrink-0"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

// Data for the pricing plans (FormHook tiers)
const pricingPlans: PricingPlan[] = [
  {
    name: 'Free Tier',
    price: 'Free',
    pricePeriod: '',
    description: 'For devs and hobbyists',
    features: [
      { text: '100 monthly submissions', included: true },
      { text: '1-2 concurrent requests', included: true },
      { text: '1 webhook retry', included: true },
      { text: '7-day analytics history', included: true },
      { text: 'Cold starts apply (Render free tier)', included: true },
      { text: 'Manual token generation', included: true },
      { text: 'Community support', included: true },
    ],
    buttonText: 'Get Started',
    isPopular: false,
  },
  {
    name: 'Starter Tier',
    price: '$15',
    pricePeriod: '/mo',
    description: 'For MVPs/indie makers',
    features: [
      { text: '2,000 monthly submissions', included: true },
      { text: '5 concurrent requests', included: true },
      { text: '3 webhook retries', included: true },
      { text: '90-day analytics', included: true },
      { text: 'Priority email notifications', included: true },
      { text: 'Always-on (no cold start)', included: true },
      { text: 'Email support (48h)', included: true },
    ],
    buttonText: 'Upgrade Now',
    isPopular: true,
  },
  {
    name: 'Pro Tier',
    price: '$99',
    pricePeriod: '/mo',
    description: 'For teams/marketers',
    features: [
      { text: '20,000+ monthly submissions', included: true },
      { text: '20+ concurrent requests', included: true },
      { text: '5+ retries with background worker', included: true },
      { text: '1 year analytics', included: true },
      { text: 'Custom SMTP email delivery', included: true },
      { text: 'Multiple tokens with audit logs', included: true },
      { text: 'Dedicated support (24h SLA)', included: true },
    ],
    buttonText: 'Upgrade Now',
    isPopular: false,
  },
];

// Individual Pricing Card Component using shadcn/ui
const PricingCard: React.FC<PricingCardProps> = ({ plan }) => {
  return (
    <Card className={`relative flex flex-col h-full ${plan.isPopular ? 'border-2 border-purple-700 dark:border-purple-400 shadow-lg' : ''}`}>
      {plan.isPopular && (
        <div className="absolute top-0 right-4 -mt-3 bg-purple-700 dark:bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10">
          MOST POPULAR
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-800 dark:text-zinc-100 mb-2 text-center">{plan.name}</CardTitle>
        <div className="text-center">
          <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
          {plan.pricePeriod && (
            <span className="text-lg text-gray-500 dark:text-zinc-400 font-medium ml-1">{plan.pricePeriod}</span>
          )}
        </div>
        <CardDescription className="text-center text-gray-600 dark:text-gray-300 mb-2">{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-3 mb-6">
          {plan.features.map((feature: PricingFeature, index: number) => (
            <li
              key={index}
              className="flex items-center text-sm text-gray-700 dark:text-zinc-300"
            >
              <CheckIcon />
              <span>{feature.text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button asChild className={`w-full ${plan.isPopular ? 'bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'} text-white font-semibold`}>
          <a href="/signup">{plan.buttonText}</a>
        </Button>
      </CardFooter>
    </Card>
  );
};


const PricingSection: React.FC = () => {
  return (
    <section id="pricing" className="relative py-16 sm:py-24 overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-900">
      <div className="max-w-5xl mx-auto px-2">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-blue-900 dark:text-blue-100">Pricing</h2>
        <p className="text-center text-lg text-gray-600 dark:text-gray-300 mb-10">Simple, transparent plans for every stage.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan: PricingPlan, index: number) => (
            <PricingCard key={index} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;

// --- How it Works Section (VerticalTabsDemo) ---
import dynamic from "next/dynamic";
const VerticalTabsDemo = dynamic(() => import("./VerticalTabsDemo").then(mod => mod.VerticalTabsDemo), { ssr: false });

// Optional: Export a combined section for easy drop-in
export function PricingAndHowItWorks() {
  return (
    <>
      <PricingSection />
      <section className="mt-20 flex flex-col items-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-blue-900 dark:text-blue-100">How it Works</h2>
        <VerticalTabsDemo />
      </section>
    </>
  );
}
