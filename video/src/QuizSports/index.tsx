import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { z } from "zod";
import { quizSportsSchema, getQuizScenes } from "./schema";
import { QuizQuestion } from "./QuizQuestion";
import { QuizOptions } from "./QuizOptions";
import { QuizCountdown } from "./QuizCountdown";
import { QuizReveal } from "./QuizReveal";
import { QuizCTA } from "./QuizCTA";
import { BgImage } from "../components/BgImage";

export const QuizSports: React.FC<z.infer<typeof quizSportsSchema>> = (props) => {
  const { durationInFrames } = useVideoConfig();
  const scenes = getQuizScenes(props);
  const ctaStart = durationInFrames - scenes.ctaDuration;
  const revealDuration = ctaStart - scenes.revealStart;

  return (
    <AbsoluteFill>
      <BgImage src={props.bgImageSrc} opacity={0.15} />
      <Audio src={staticFile("bgm.mp3")} volume={0.3} />
      {props.narrationSrc && <Audio src={staticFile(props.narrationSrc)} volume={0.9} />}
      <Sequence from={scenes.question.start} durationInFrames={scenes.question.end - scenes.question.start}>
        <QuizQuestion question={props.question} />
      </Sequence>
      <Sequence from={scenes.options.start} durationInFrames={scenes.options.end - scenes.options.start}>
        <QuizOptions question={props.question} options={props.options} />
      </Sequence>
      <Sequence from={scenes.countdown.start} durationInFrames={scenes.revealStart - scenes.countdown.start}>
        <QuizCountdown question={props.question} options={props.options} />
      </Sequence>
      <Sequence from={scenes.revealStart} durationInFrames={revealDuration}>
        <QuizReveal options={props.options} correctIndex={props.correctIndex} explanation={props.explanation} />
      </Sequence>
      <Sequence from={ctaStart} durationInFrames={scenes.ctaDuration}>
        <QuizCTA ctaText={props.ctaText} />
      </Sequence>
    </AbsoluteFill>
  );
};
