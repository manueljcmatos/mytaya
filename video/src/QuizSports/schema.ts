import { z } from "zod";

export const quizSportsSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(3),
  correctIndex: z.number().min(0).max(2),
  explanation: z.string(),
  ctaText: z.string().default("Mas maraming quiz sa aming channel"),
  narrationSrc: z.string().optional(),
});

export type QuizSportsProps = z.infer<typeof quizSportsSchema>;

export const QUIZ_SCENES = {
  question: { start: 0, end: 135 },
  options: { start: 135, end: 390 },
  countdown: { start: 390, end: 480 },
  revealStart: 480,
  ctaDuration: 90,
} as const;
