"use client";
import React from 'react';

function Testimonial2() {
  const testimonials = [
    {
      name: "Alex Kim",
      title: "Fullstack Developer",
      text: "FormHook's API made integrating forms into my apps ridiculously fast. No more backend boilerplate! I used to spend hours wiring up endpoints and handling validation, but now it's just a few lines and I'm done. Highly recommend for any dev who values speed and reliability.",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
      name: "Priya Patel",
      title: "Indie Hacker",
      text: "I spun up a waitlist in an hour. FormHook saved me days of backend setup. The docs are clear, and the dashboard makes it easy to see who signed up. Perfect for quick launches.",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    {
      name: "Samir Rahman",
      title: "Backend Engineer",
      text: "The webhook retries are rock solid. I trust FormHook for production launches because I know submissions won't get lost, even if our endpoint is down for a minute. It's a huge relief.",
      image: "https://randomuser.me/api/portraits/men/45.jpg",
    },
    {
      name: "Julia Chen",
      title: "Product Manager",
      text: "Our landing page forms just work. The dashboard is clean and makes reviewing submissions a breeze. We can export data, filter by date, and never worry about missing a lead.",
      image: "https://randomuser.me/api/portraits/women/68.jpg",
    },
    {
      name: "Diego Alvarez",
      title: "DevRel Engineer",
      text: "FormHook is a zero-fluff tool built for devs. The API docs are clear and the experience is seamless. I recommend it to anyone who wants to avoid backend headaches for simple forms.",
      image: "https://randomuser.me/api/portraits/men/23.jpg",
    },
    {
      name: "Maya Singh",
      title: "Frontend Developer",
      text: "I use FormHook for all my client projects. Fast, reliable, and the submission viewer is super helpful. My clients love that they can see every entry without digging through emails.",
      image: "https://randomuser.me/api/portraits/women/12.jpg",
    },
    {
      name: "Ben Foster",
      title: "SaaS Founder",
      text: "FormHook lets us launch new forms without touching our backend. Huge time saver for our team. We can focus on features, not infrastructure.",
      image: "https://randomuser.me/api/portraits/men/77.jpg",
    },
    {
      name: "Lina Müller",
      title: "Marketing Lead",
      text: "Perfect for landing pages and campaigns. Our marketers love how easy it is to collect leads. No more waiting on devs to build custom endpoints.",
      image: "https://randomuser.me/api/portraits/women/55.jpg",
    },
    {
      name: "Omar Farouk",
      title: "API Specialist",
      text: "The API is straightforward and the webhook delivery is reliable. FormHook just works, and the retry logic means we never lose data.",
      image: "https://randomuser.me/api/portraits/men/61.jpg",
    },
    {
      name: "Sophie Dubois",
      title: "Growth Engineer",
      text: "FormHook is the missing piece for fast MVPs. No more spinning up servers just to handle forms. It's developer-first and lets us move at startup speed.",
      image: "https://randomuser.me/api/portraits/women/21.jpg",
    },
  ];

  // Fallback for any images not explicitly mapped or if array runs out
  const anonymousFallbackImage = "https://placehold.co/48x48/6B7280/FFFFFF?text=AA";

  return (
    <div className="font-sans flex flex-col items-center py-16 px-4 sm:px-6 lg:px-8">
      {/* Main Heading */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-center max-w-4xl leading-tight mb-4 text-gray-900 dark:text-white">
        Loved by community
      </h1>

      {/* Subheading */}
      <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 text-center max-w-3xl mb-16">
        Harum quae dolore corrupti aut temporibus pariatur.
      </p>

      {/* Testimonial Cards Container - Masonry-like layout */}
      <div className="w-full max-w-7xl columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">

        {testimonials.map((testimonial, index) => (
          <div key={index} className="bg-white dark:bg-black p-6 rounded-xl shadow-md break-inside-avoid border border-gray-200 dark:border-gray-800">
            <div className="flex items-center mb-4">
              <img
                src={testimonial.image}
                alt={testimonial.name}
                className="w-12 h-12 rounded-full object-cover mr-4"
                onError={(e) => { 
                  const target = e.target as HTMLImageElement;
                  target.onerror = null; 
                  target.src = anonymousFallbackImage;
                }}
              />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.title}</p>
              </div>
            </div>
            <p className="text-base text-gray-700 dark:text-gray-200 leading-relaxed">
              {testimonial.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Testimonial2;
