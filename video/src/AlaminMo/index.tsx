import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { z } from "zod";
import { alaminMoSchema, ALAMIN_SCENES } from "./schema";
import { AlaminHook } from "./AlaminHook";
import { TheFact } from "./TheFact";
import { Explanation } from "./Explanation";
import { AlaminCTA } from "./AlaminCTA";
import { BgImage } from "../components/BgImage";

export const AlaminMo: React.FC<z.infer<typeof alaminMoSchema>> = (props) => {
  const { durationInFrames } = useVideoConfig();
  const ctaStart = durationInFrames - ALAMIN_SCENES.ctaDuration;
  const explanationDuration = ctaStart - ALAMIN_SCENES.explanationStart;

  return (
    <AbsoluteFill>
      <BgImage src={props.bgImageSrc} opacity={0.18} />
      <Audio src={staticFile("bgm.mp3")} volume={0.3} />
      {props.narrationSrc && <Audio src={staticFile(props.narrationSrc)} volume={0.9} />}
      <Sequence from={ALAMIN_SCENES.hook.start} durationInFrames={ALAMIN_SCENES.hook.end - ALAMIN_SCENES.hook.start}>
        <AlaminHook text={props.hookText} />
      </Sequence>
      <Sequence from={ALAMIN_SCENES.theFact.start} durationInFrames={ALAMIN_SCENES.theFact.end - ALAMIN_SCENES.theFact.start}>
        <TheFact stat={props.stat} factTitle={props.factTitle} />
      </Sequence>
      <Sequence from={ALAMIN_SCENES.explanationStart} durationInFrames={explanationDuration}>
        <Explanation factContext={props.factContext} bullets={props.bullets} />
      </Sequence>
      <Sequence from={ctaStart} durationInFrames={ALAMIN_SCENES.ctaDuration}>
        <AlaminCTA ctaText={props.ctaText} />
      </Sequence>
    </AbsoluteFill>
  );
};
