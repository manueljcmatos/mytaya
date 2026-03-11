import { z } from "zod";

export const hulaNgArawSchema = z.object({
  hookText: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  league: z.string(),
  matchDate: z.string(),
  market: z.string(),
  odds: z.number(),
  stake: z.number().min(1).max(10),
  confidence: z.enum(["high", "medium", "low"]),
  hotTake: z.string(),
  analysis: z.array(z.string()).length(3),
  ctaText: z.string(),
});

export type HulaNgArawProps = z.infer<typeof hulaNgArawSchema>;
