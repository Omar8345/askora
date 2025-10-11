export function AskoraIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={
        {
          // Fallbacks for CSS variables if not set
          "--primary": "264 100% 70%",
          "--secondary": "330 100% 75%",
          "--accent": "140 100% 75%",
          "--background": "264 10% 13%",
          "--chart-3": "60 100% 80%",
        } as React.CSSProperties
      }
    >
      {/* Main hexagon shape */}
      <path
        d="M50 10 L80 30 L80 60 L50 80 L20 60 L20 30 Z"
        fill="url(#iconGradient)"
        stroke="url(#strokeGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Inner path representing onboarding flow */}
      <path
        d="M50 25 L50 45 M35 45 L50 45 L65 45 M50 45 L50 65"
        stroke="hsl(var(--background))"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* AI sparkle dots */}
      <circle cx="50" cy="25" r="4" fill="hsl(var(--background))" />
      <circle cx="35" cy="45" r="4" fill="hsl(var(--background))" />
      <circle cx="65" cy="45" r="4" fill="hsl(var(--background))" />
      <circle cx="50" cy="65" r="4" fill="hsl(var(--background))" />

      <defs>
        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="50%" stopColor="hsl(var(--secondary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
        <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--chart-3))" />
          <stop offset="100%" stopColor="hsl(var(--primary))" />
        </linearGradient>
      </defs>
    </svg>
  );
}
