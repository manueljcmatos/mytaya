export const THEME = {
  bg: "#0A0A0A",
  bgInner: "#111111",
  teal: "#0F766E",
  tealLight: "#14B8A6",
  text: "#F5F5F5",
  textSec: "#9CA3AF",
  red: "#EF4444",
  green: "#22C55E",
  fontHeading: "Bebas Neue",
  fontBody: "Inter",
} as const;

export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationSeconds: 45,
  durationFrames: 1350,
} as const;

export const SCENES = {
  hook: { start: 0, end: 120 },
  matchCard: { start: 120, end: 330 },
  thePick: { start: 330, end: 660 },
  analysis: { start: 660, end: 1260 },
  cta: { start: 1260, end: 1350 },
} as const;
