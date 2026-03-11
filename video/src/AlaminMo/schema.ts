import { z } from "zod";

export const alaminMoSchema = z.object({
  hookText: z.string().default("Alam mo ba..."),
  stat: z.string(),
  factTitle: z.string(),
  factContext: z.string(),
  bullets: z.array(z.string()).min(2).max(3),
  ctaText: z.string().default("I-follow para sa iba pa"),
  narrationSrc: z.string().optional(),
});

export type AlaminMoProps = z.infer<typeof alaminMoSchema>;

export const ALAMIN_SCENES = {
  hook: { start: 0, end: 60 },
  theFact: { start: 60, end: 195 },
  explanationStart: 195,
  ctaDuration: 90,
} as const;
