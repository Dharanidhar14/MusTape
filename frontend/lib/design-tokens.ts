export const product = {
  name: "MusTape",
  tagline: "A keepsake for sound.",
  version: "3.1.0",
  footerLine: "The tape has reached its end.",
  footerEcho: "But memories rarely do."
} as const;

export const motionTokens = {
  gentleEase: [0.22, 1, 0.36, 1] as const,
  durations: {
    fast: 0.28,
    calm: 0.55,
    reveal: 0.72,
    object: 0.8,
    drift: 7.5,
    reel: 9
  }
} as const;

export const typographyTokens = {
  heroTitle: "font-display text-[clamp(3.75rem,9.2vw,9.1rem)] leading-[0.875] tracking-normal text-ink-900",
  receiverTitle: "break-words font-display text-[clamp(3.6rem,8.6vw,8rem)] leading-[0.885] text-ink-900",
  sealedTitle: "mx-auto mt-6 max-w-3xl break-words font-display text-[clamp(3.4rem,8vw,7.4rem)] leading-[0.9] text-ink-900",
  sectionTitle: "font-display text-[clamp(3.25rem,5.5vw,4.9rem)] leading-[0.98] text-ink-900",
  cardTitle: "font-display text-3xl text-ink-900",
  panelTitle: "font-display text-[2rem] leading-none text-ink-900",
  body: "leading-7 text-ink-500",
  bodyLarge: "text-lg leading-8 text-ink-500",
  eyebrow: "text-sm uppercase tracking-[0.18em] text-ink-400",
  caption: "font-mono text-xs uppercase tracking-[0.18em] text-ink-400",
  footerQuote: "font-display text-[clamp(3.2rem,7vw,7.5rem)] leading-[0.92] text-paper-100"
} as const;

export const surfaceTokens = {
  panel: "rounded-[1.6rem] border border-[rgb(var(--border))] bg-[rgb(var(--paper-100)/0.72)] shadow-insetpaper",
  object: "rounded-[2rem] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-object shadow-insetpaper",
  letter: "letter-card rounded-[1.7rem] border"
} as const;

export const buttonTokens = {
  base: "button-lift touch-target inline-flex items-center justify-center gap-2 rounded-full text-sm",
  primary: "bg-rosewood px-6 text-paper-100 hover:bg-ink-900 disabled:cursor-not-allowed disabled:opacity-60",
  ink: "bg-ink-900 px-5 text-paper-100 hover:bg-rosewood disabled:cursor-not-allowed disabled:opacity-60",
  quiet: "border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.52)] px-6 font-medium text-ink-700 hover:border-brass hover:text-ink-900",
  link: "border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 text-ink-700 hover:border-brass"
} as const;
