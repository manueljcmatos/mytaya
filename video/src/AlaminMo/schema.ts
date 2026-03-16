import { z } from "zod";

export const alaminMoSchema = z.object({
  hookText: z.string().default("Alam mo ba..."),
  stat: z.string(),
  factTitle: z.string(),
  factContext: z.string(),
  bullets: z.array(z.string()).min(2).max(3),
  ctaText: z.string().default("I-follow para sa iba pa"),
  narrationSrc: z.string().optional(),
  bgImageSrc: z.string().optional(),
});

export type AlaminMoProps = z.infer<typeof alaminMoSchema>;

export const ALAMIN_SCENES = {
  hook: { start: 0, end: 45 },
  theFact: { start: 45, end: 150 },
  explanationStart: 150,
  ctaDuration: 60,
} as const;
