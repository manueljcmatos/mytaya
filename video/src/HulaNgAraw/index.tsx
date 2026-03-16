import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { z } from "zod";
import { hulaNgArawSchema } from "./schema";
import { Hook } from "./Hook";
import { MatchCard } from "./MatchCard";
import { ThePick } from "./ThePick";
import { Analysis } from "./Analysis";
import { CTA } from "./CTA";
import { SCENES } from "../styles/theme";
import { BgImage } from "../components/BgImage";

export const HulaNgAraw: React.FC<z.infer<typeof hulaNgArawSchema>> = (props) => {
  return (
    <AbsoluteFill>
      <BgImage src={props.bgImageSrc} opacity={0.12} />
      <Audio src={staticFile("bgm.mp3")} volume={0.6} />
      <Sequence from={SCENES.hook.start} durationInFrames={SCENES.hook.end - SCENES.hook.start}>
        <Hook text={props.hookText} />
      </Sequence>
      <Sequence from={SCENES.matchCard.start} durationInFrames={SCENES.matchCard.end - SCENES.matchCard.start}>
        <MatchCard homeTeam={props.homeTeam} awayTeam={props.awayTeam} league={props.league} matchDate={props.matchDate} />
      </Sequence>
      <Sequence from={SCENES.thePick.start} durationInFrames={SCENES.thePick.end - SCENES.thePick.start}>
        <ThePick market={props.market} confidence={props.confidence} hotTake={props.hotTake} />
      </Sequence>
      <Sequence from={SCENES.analysis.start} durationInFrames={SCENES.analysis.end - SCENES.analysis.start}>
        <Analysis analysis={props.analysis} />
      </Sequence>
      <Sequence from={SCENES.cta.start} durationInFrames={SCENES.cta.end - SCENES.cta.start}>
        <CTA ctaText={props.ctaText} />
      </Sequence>
    </AbsoluteFill>
  );
};
