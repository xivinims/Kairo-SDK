import { cn } from "@/lib/utils";

export function KairoCreature({
  className,
  thinking,
}: {
  className?: string;
  thinking?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("shrink-0", thinking ? "creature-thinking" : "creature-animated", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Kairo"
      role="img"
    >
      <defs>
        {/* Soft 3D grey sphere gradient */}
        <radialGradient
          id="kairo-body-grad"
          cx="38%"
          cy="32%"
          r="62%"
          fx="32%"
          fy="26%"
        >
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="28%" stopColor="#64748b" />
          <stop offset="70%" stopColor="#475569" />
          <stop offset="100%" stopColor="#334155" />
        </radialGradient>

        {/* Soft shadow */}
        <radialGradient id="kairo-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Eye shine gradient */}
        <linearGradient id="kairo-eye-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#09090b" />
          <stop offset="100%" stopColor="#18181b" />
        </linearGradient>
      </defs>

      {/* Ground soft shadow */}
      <ellipse cx="32" cy="57" rx="16" ry="3.5" fill="url(#kairo-shadow)" />

      {/* Little cute rounded ears/bumps */}
      <circle cx="21" cy="19" r="5" fill="#475569" />
      <circle cx="21" cy="19" r="3.2" fill="#64748b" />
      <circle cx="43" cy="19" r="5" fill="#475569" />
      <circle cx="43" cy="19" r="3.2" fill="#64748b" />

      {/* Main round grey creature body */}
      <circle
        cx="32"
        cy="35"
        r="21.5"
        fill="url(#kairo-body-grad)"
      />

      {/* Soft light highlight on top of head */}
      <ellipse
        cx="30"
        cy="19"
        rx="10"
        ry="4"
        fill="#cbd5e1"
        fillOpacity="0.45"
      />

      {/* Cute little rosy cheeks */}
      <ellipse cx="19" cy="39" rx="3.5" ry="2" fill="#f43f5e" fillOpacity="0.25" />
      <ellipse cx="45" cy="39" rx="3.5" ry="2" fill="#f43f5e" fillOpacity="0.25" />

      {/* Eyes & expression */}
      {thinking ? (
        <>
          {/* Curious thinking eyes looking slightly up */}
          <g>
            {/* Left Eye */}
            <ellipse cx="23.5" cy="31.5" rx="4.2" ry="5.2" fill="url(#kairo-eye-grad)" />
            {/* Left Sparkle reflection */}
            <circle cx="22.2" cy="29.2" r="1.8" fill="#ffffff" />
            <circle cx="24.8" cy="33.2" r="0.9" fill="#ffffff" />

            {/* Right Eye */}
            <ellipse cx="39.5" cy="31.5" rx="4.2" ry="5.2" fill="url(#kairo-eye-grad)" />
            {/* Right Sparkle reflection */}
            <circle cx="38.2" cy="29.2" r="1.8" fill="#ffffff" />
            <circle cx="40.8" cy="33.2" r="0.9" fill="#ffffff" />

            {/* Tiny curious cute mouth - small 'o' */}
            <ellipse cx="31.5" cy="39" rx="1.6" ry="2.1" fill="#1e293b" />
          </g>
          {/* Small thought sparkles / bubbles */}
          <circle cx="49" cy="15" r="1.6" fill="#93c5fd" fillOpacity="0.9" />
          <circle cx="53" cy="10" r="2.2" fill="#60a5fa" fillOpacity="0.95" />
        </>
      ) : (
        <>
          {/* Normal happy cute round eyes */}
          <g>
            {/* Left Eye */}
            <ellipse cx="23" cy="33.5" rx="4.2" ry="5.4" fill="url(#kairo-eye-grad)" />
            {/* Big glossy sparkle */}
            <circle cx="21.5" cy="31.5" r="1.9" fill="#ffffff" />
            <circle cx="24.5" cy="35.2" r="0.9" fill="#ffffff" />

            {/* Right Eye */}
            <ellipse cx="41" cy="33.5" rx="4.2" ry="5.4" fill="url(#kairo-eye-grad)" />
            {/* Big glossy sparkle */}
            <circle cx="39.5" cy="31.5" r="1.9" fill="#ffffff" />
            <circle cx="42.5" cy="35.2" r="0.9" fill="#ffffff" />

            {/* Tiny sweet smile */}
            <path
              d="M29.5 38.5 Q32 41 34.5 38.5"
              fill="none"
              stroke="#1e293b"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </g>
        </>
      )}

      {/* Tiny soft little paws / feet */}
      <ellipse cx="24" cy="54.5" rx="4.5" ry="2" fill="#475569" />
      <ellipse cx="40" cy="54.5" rx="4.5" ry="2" fill="#475569" />
    </svg>
  );
}

// Alias for backwards compatibility with existing component imports
export const ClaudeMark = KairoCreature;
export const KairoMark = KairoCreature;

export function WaveformIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <rect x="3.4" y="8.2" width="2.2" height="7.6" rx="1.1" />
      <rect x="8.4" y="4.6" width="2.2" height="14.8" rx="1.1" />
      <rect x="13.4" y="7" width="2.2" height="10" rx="1.1" />
      <rect x="18.4" y="9.2" width="2.2" height="5.6" rx="1.1" />
    </svg>
  );
}

export function GhostIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 11c0-4.1 3.1-7 7-7s7 2.9 7 7v8.2c0 .5-.6.8-1 .4l-1.8-1.6-1.6 1.7a.7.7 0 0 1-1.1 0L12 17.4l-1.5 1.3a.7.7 0 0 1-1.1 0L7.8 17l-1.8 1.6c-.4.4-1 .1-1-.4V11Z" />
      <circle cx="9.2" cy="11.2" r="0.85" fill="currentColor" stroke="none" />
      <circle cx="14.8" cy="11.2" r="0.85" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TrayIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.4 10h15.2v6.6a2 2 0 0 1-2 2H6.4a2 2 0 0 1-2-2V10Z" />
      <path d="M8.2 10V7.4A2.2 2.2 0 0 1 10.4 5.2h3.2A2.2 2.2 0 0 1 15.8 7.4V10" />
    </svg>
  );
}

export function PuzzleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.6" y="8.2" width="10.2" height="10.2" rx="2.2" />
      <rect x="10.2" y="4.6" width="10.2" height="10.2" rx="2.2" />
    </svg>
  );
}

export function BubbleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 6.6A2.6 2.6 0 0 1 7.6 4h8.8A2.6 2.6 0 0 1 19 6.6v6.2a2.6 2.6 0 0 1-2.6 2.6H11l-3.8 3.2v-3.2H7.6A2.6 2.6 0 0 1 5 12.8V6.6Z" />
    </svg>
  );
}

export function CodeGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m8 8-4 4 4 4" />
      <path d="m16 8 4 4-4 4" />
      <path d="m14.2 7-4.4 10" />
    </svg>
  );
}
