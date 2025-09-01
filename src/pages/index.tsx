


import Hero3 from '../components/Hero3';
import HowItWorks from '../components/HowItWorks';
import dynamic from "next/dynamic";
import { ChartLineInteractive } from '../components/ChartLineInteractive';
import Testimonial2 from '../components/Testimonial2';
import PricingSection from '../components/PricingSection';
// Dynamically import VerticalTabsDemo for client-side rendering
const VerticalTabsDemo = dynamic(() => import("../components/VerticalTabsDemo").then(mod => mod.VerticalTabsDemo), { ssr: false });


export default function Home() {
  return (
    <>
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
    </>
  );
}
