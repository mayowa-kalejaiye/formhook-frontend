


import React from 'react';
import Hero3 from '../components/Hero3';
import HowItWorks from '../components/HowItWorks';
import SEO from '../components/SEO';
import dynamic from "next/dynamic";
import { ChartLineInteractive } from '../components/ChartLineInteractive';
import Testimonial2 from '../components/Testimonial2';
import PricingSection from '../components/PricingSection';
import Footer2 from '../components/Footer2';
// Dynamically import VerticalTabsDemo for client-side rendering
const VerticalTabsDemo = dynamic(() => import("../components/VerticalTabsDemo").then(mod => mod.VerticalTabsDemo), { ssr: false });

export default function Home() {
  return (
    <>
      <SEO
        title="FormHook — Simple, secure form handling"
        description="Collect, route, and manage form submissions in minutes. Integrate with webhooks, Slack, Google Sheets, email, and more. No server required."
        image={`${(process.env.NEXT_PUBLIC_SITE_URL || 'https://formhook-frontend.vercel.app').replace(/\/$/, '')}/og-image.svg`}
        url={(process.env.NEXT_PUBLIC_SITE_URL || 'https://formhook-frontend.vercel.app').replace(/\/$/, '')}
        keywords={["forms","webhooks","slack","google sheets","form handling","formhook"]}
      />
      <Hero3 />
      <HowItWorks />
      <section className="flex flex-col items-center mt-12">
        <VerticalTabsDemo />
      </section>
      {/* Visual Chart Mockup */}
      <div className="max-w-3xl mx-auto my-12">
        <ChartLineInteractive />
      </div>
      <PricingSection />
      <Testimonial2 />
      <Footer2 />
    </>
  );
}
