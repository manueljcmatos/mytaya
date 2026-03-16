import { z } from "zod";

export const balitaSportsSchema = z.object({
  date: z.string(),
  headlineNumber: z.number().min(1).max(3),
  headline: z.object({ title: z.string(), summary: z.string() }),
  opinion: z.string(),
  ctaText: z.string(),
  narrationSrc: z.string().optional(),
  bgImageSrc: z.string().optional(),
});

export type BalitaSportsProps = z.infer<typeof balitaSportsSchema>;

export const BALITA_SCENES = {
  intro: { start: 0, duration: 60 },
  headline: { start: 60, duration: 300 },
  opinionStart: 360,
  ctaDuration: 90,
} as const;
