// the six icons of THE LEDGER — hand-drawn, 1.5px stroke, nothing generic

interface IconProps {
  size?: number;
  className?: string;
}

/** the seal mark — outline form, used for the circuit breaker control */
export function SealMark({ size = 26, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
      <path d="M13 2.2 C 18.6 1.8, 24.1 6.9, 23.8 13.1 C 23.5 19.4, 18.9 24.2, 12.8 23.8 C 6.8 23.5, 2.1 18.8, 2.3 12.8 C 2.5 6.9, 7.3 2.5, 13 2.2 Z" />
      <path d="M9.5 8 v5.5 a3.5 3.5 0 0 0 7 0 V8" />
      <path d="M13 17 v2.5" />
    </svg>
  );
}

/** the nib — composing, signing */
export function Nib({ size = 20, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 2.5 C 12.8 4.2, 14.3 7.4, 13.6 11.2 L 10 17 L 6.4 11.2 C 5.7 7.4, 7.2 4.2, 10 2.5 Z" />
      <path d="M10 9 v4" />
      <circle cx="10" cy="8" r="1" />
    </svg>
  );
}

/** rule kept — a tick resting on a ledger rule */
export function RuleKept({ size = 20, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 15.5 C 6 15.1, 14 15.9, 18 15.5" strokeWidth="0.75" />
      <path d="M5.5 9.5 L 9 13 L 15 4.5" />
    </svg>
  );
}

/** rule broken — the ledger rule, severed */
export function RuleBroken({ size = 20, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 10.3 C 4.5 10, 6.5 10.4, 8.2 10.1" />
      <path d="M11.8 9.9 C 14 9.6, 16 10.2, 18 9.8" />
      <path d="M11.5 5.5 L 8.5 14.5" strokeWidth="0.75" />
    </svg>
  );
}

/** the hourglass — the breaker’s clock */
export function Hourglass({ size = 20, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 2.5 h10 M5 17.5 h10" />
      <path d="M6 2.5 C 6 7, 9 8.5, 10 10 C 11 8.5, 14 7, 14 2.5" />
      <path d="M6 17.5 C 6 13, 9 11.5, 10 10 C 11 11.5, 14 13, 14 17.5" />
    </svg>
  );
}

/** export — an arrow leaving through the page */
export function ExportArrow({ size = 20, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 16.5 C 8 16.1, 12 16.9, 16 16.5" strokeWidth="0.75" />
      <path d="M10 13 V 3.5" />
      <path d="M6.5 7 L 10 3.5 L 13.5 7" />
    </svg>
  );
}

/** the stamped seal — filled form, wax. used on signed contracts */
export function SealStamped({ size = 64, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path
        d="M32 3.5 C 46.5 2.5, 61.5 16, 60.5 32.5 C 59.6 48.5, 46.5 61.2, 31.4 60.4 C 16.6 59.6, 3.4 47.3, 4.1 31.6 C 4.8 16.4, 17.8 4.5, 32 3.5 Z"
        fill="#7A2E1F"
      />
      <circle cx="32" cy="32" r="19" fill="none" stroke="rgba(240,233,219,0.85)" strokeWidth="1.5" />
      <text
        x="32"
        y="33"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Fraunces, Georgia, serif"
        fontSize="24"
        fontWeight="560"
        fill="#F0E9DB"
      >
        N
      </text>
    </svg>
  );
}
