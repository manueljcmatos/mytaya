import { z } from "zod";

export const quizSportsSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(3),
  correctIndex: z.number().min(0).max(2),
  explanation: z.string(),
  ctaText: z.string().default("Mas maraming quiz sa aming channel"),
  narrationSrc: z.string().optional(),
  // Dynamic scene timing (frames) — set by TTS duration calculator
  questionEnd: z.number().optional(),
  optionsEnd: z.number().optional(),
  countdownEnd: z.number().optional(),
  bgImageSrc: z.string().optional(),
});

export type QuizSportsProps = z.infer<typeof quizSportsSchema>;

// Default timings (used when no TTS / no dynamic timing)
export const QUIZ_DEFAULTS = {
  questionEnd: 135,
  optionsEnd: 390,
  countdownEnd: 480,
  ctaDuration: 90,
} as const;

// Build scene timings from props (dynamic) or defaults (static)
export function getQuizScenes(props: { questionEnd?: number; optionsEnd?: number; countdownEnd?: number }) {
  const questionEnd = props.questionEnd || QUIZ_DEFAULTS.questionEnd;
  const optionsEnd = props.optionsEnd || QUIZ_DEFAULTS.optionsEnd;
  const countdownEnd = props.countdownEnd || QUIZ_DEFAULTS.countdownEnd;
  return {
    question: { start: 0, end: questionEnd },
    options: { start: questionEnd, end: optionsEnd },
    countdown: { start: optionsEnd, end: countdownEnd },
    revealStart: countdownEnd,
    ctaDuration: QUIZ_DEFAULTS.ctaDuration,
  };
}
