import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { z } from "zod";
import { quizSportsSchema, QUIZ_SCENES } from "./schema";
import { QuizQuestion } from "./QuizQuestion";
import { QuizOptions } from "./QuizOptions";
import { QuizCountdown } from "./QuizCountdown";
import { QuizReveal } from "./QuizReveal";
import { QuizCTA } from "./QuizCTA";

export const QuizSports: React.FC<z.infer<typeof quizSportsSchema>> = (props) => {
  const { durationInFrames } = useVideoConfig();
  const ctaStart = durationInFrames - QUIZ_SCENES.ctaDuration;
  const revealDuration = ctaStart - QUIZ_SCENES.revealStart;

  return (
    <AbsoluteFill>
      <Audio src={staticFile("bgm.mp3")} volume={0.3} />
      {props.narrationSrc && <Audio src={staticFile(props.narrationSrc)} volume={0.9} />}
      <Sequence from={QUIZ_SCENES.question.start} durationInFrames={QUIZ_SCENES.question.end - QUIZ_SCENES.question.start}>
        <QuizQuestion question={props.question} />
      </Sequence>
      <Sequence from={QUIZ_SCENES.options.start} durationInFrames={QUIZ_SCENES.options.end - QUIZ_SCENES.options.start}>
        <QuizOptions question={props.question} options={props.options} />
      </Sequence>
      <Sequence from={QUIZ_SCENES.countdown.start} durationInFrames={QUIZ_SCENES.revealStart - QUIZ_SCENES.countdown.start}>
        <QuizCountdown question={props.question} options={props.options} />
      </Sequence>
      <Sequence from={QUIZ_SCENES.revealStart} durationInFrames={revealDuration}>
        <QuizReveal options={props.options} correctIndex={props.correctIndex} explanation={props.explanation} />
      </Sequence>
      <Sequence from={ctaStart} durationInFrames={QUIZ_SCENES.ctaDuration}>
        <QuizCTA ctaText={props.ctaText} />
      </Sequence>
    </AbsoluteFill>
  );
};
