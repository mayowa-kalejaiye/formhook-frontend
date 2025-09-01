"use client"
export default function DualGradientOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-black dark bg-fixed">
      {/* Aurora Midnight Glow Pattern Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Aurora Glow gradients */}
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-gradient-radial from-purple-700/60 via-indigo-600/40 to-transparent opacity-80 blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/3 left-1/2 w-[500px] h-[500px] bg-gradient-radial from-blue-600/60 via-cyan-400/30 to-transparent opacity-70 blur-3xl animate-pulse-slower" style={{transform: 'translate(-50%, 0)'}} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-radial from-fuchsia-600/50 via-pink-500/30 to-transparent opacity-60 blur-2xl animate-pulse-slow" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-radial from-emerald-400/40 via-teal-400/20 to-transparent opacity-40 blur-2xl animate-pulse-slower" />
        {/* Subtle star field */}
        <svg className="absolute inset-0 w-full h-full" style={{zIndex: 1}}>
          <defs>
            <radialGradient id="star" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff" stopOpacity="1" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
          </defs>
          {Array.from({length: 40}).map((_, i) => (
            <circle key={i} cx={Math.random()*100+"%"} cy={Math.random()*100+"%"} r={Math.random()*1.2+0.3} fill="url(#star)" opacity={Math.random()*0.7+0.2} />
          ))}
        </svg>
      </div>
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
