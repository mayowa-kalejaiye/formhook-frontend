


import React from 'react';
import Hero3 from '../components/Hero3';
import HowItWorks from '../components/HowItWorks';
import SEO from '../components/SEO';
import dynamic from "next/dynamic";
import { ChartLineInteractive } from '../components/ChartLineInteractive';
import Testimonial2 from '../components/Testimonial2';
import Footer2 from '../components/Footer2';
// Dynamically import VerticalTabsDemo for client-side rendering
const VerticalTabsDemo = dynamic(() => import("../components/VerticalTabsDemo").then(mod => mod.VerticalTabsDemo), { ssr: false });

export default function Home() {
  return (
    <>
      <SEO
        title="FormHook: Form Submissions Without a Backend"
        description="Collect form submissions without a backend. FormHook handles storage, emails, webhooks, retries, and analytics. Try it free!"
        image={`${(process.env.NEXT_PUBLIC_SITE_URL || 'https://formhook-frontend.vercel.app').replace(/\/$/, '')}/og-image.png`}
        url="https://formhook-frontend.vercel.app"
        type="website"
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
      <Testimonial2 />
      <Footer2 />
    </>
  );
}
