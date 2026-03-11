import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { z } from "zod";
import { balitaSportsSchema, BALITA_SCENES } from "./schema";
import { THEME } from "../styles/theme";

/* ------------------------------------------------------------------ */
/*  Scene 1 — Intro (frames 0–60)                                     */
/* ------------------------------------------------------------------ */
const Intro: React.FC<{ headlineNumber: number; date: string }> = ({
  headlineNumber,
  date,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const labelY = interpolate(frame, [0, 15], [-20, 0], {
    extrapolateRight: "clamp",
  });

  const headingScale = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 12, stiffness: 180 },
  });

  const lineWidth = interpolate(frame, [20, 40], [0, 400], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dateOpacity = interpolate(frame, [35, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: THEME.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Radial glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 45%, ${THEME.teal}40, transparent 60%)`,
        }}
      />

      {/* "Balita Ngayon" label */}
      <div
        style={{
          position: "absolute",
          top: 680,
          fontFamily: THEME.fontHeading,
          fontSize: 36,
          color: THEME.teal,
          textTransform: "uppercase",
          letterSpacing: 6,
          opacity: labelOpacity,
          transform: `translateY(${labelY}px)`,
        }}
      >
        Balita Ngayon #{headlineNumber}
      </div>

      {/* "Balita sa Sports" heading */}
      <div
        style={{
          position: "absolute",
          top: 740,
          fontFamily: THEME.fontHeading,
          fontSize: 96,
          color: THEME.text,
          textTransform: "uppercase",
          textAlign: "center",
          lineHeight: 1.05,
          transform: `scale(${headingScale})`,
          textShadow: `0 0 60px ${THEME.teal}80`,
        }}
      >
        Balita sa Sports
      </div>

      {/* Teal separator line */}
      <div
        style={{
          position: "absolute",
          top: 870,
          height: 4,
          width: lineWidth,
          backgroundColor: THEME.tealLight,
          borderRadius: 2,
        }}
      />

      {/* Date */}
      <div
        style={{
          position: "absolute",
          top: 900,
          fontFamily: THEME.fontBody,
          fontSize: 28,
          color: THEME.textSec,
          opacity: dateOpacity,
        }}
      >
        {date}
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/*  Scene 2 — Headline (frames 60–360)                                */
/* ------------------------------------------------------------------ */
const Headline: React.FC<{
  headlineNumber: number;
  headline: { title: string; summary: string };
}> = ({ headlineNumber, headline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 200 },
  });

  const titleOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [10, 30], [30, 0], {
    extrapolateRight: "clamp",
  });

  const lineWidth = interpolate(frame, [25, 50], [0, 600], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const summaryOpacity = interpolate(frame, [40, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const summaryY = interpolate(frame, [40, 65], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: THEME.bg,
        justifyContent: "center",
        alignItems: "center",
        padding: "0 60px",
      }}
    >
      {/* Subtle vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* Number badge */}
      <div
        style={{
          position: "absolute",
          top: 560,
          width: 90,
          height: 90,
          borderRadius: 45,
          backgroundColor: THEME.teal,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          transform: `scale(${badgeScale})`,
          boxShadow: `0 0 30px ${THEME.teal}60`,
        }}
      >
        <span
          style={{
            fontFamily: THEME.fontHeading,
            fontSize: 48,
            color: THEME.text,
          }}
        >
          {headlineNumber}
        </span>
      </div>

      {/* Headline title */}
      <div
        style={{
          position: "absolute",
          top: 680,
          fontFamily: THEME.fontHeading,
          fontSize: 68,
          color: THEME.text,
          textTransform: "uppercase",
          textAlign: "center",
          lineHeight: 1.1,
          padding: "0 40px",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        {headline.title}
      </div>

      {/* Teal separator */}
      <div
        style={{
          position: "absolute",
          top: 920,
          height: 3,
          width: lineWidth,
          backgroundColor: THEME.tealLight,
          borderRadius: 2,
        }}
      />

      {/* Summary */}
      <div
        style={{
          position: "absolute",
          top: 950,
          fontFamily: THEME.fontBody,
          fontSize: 32,
          color: THEME.textSec,
          textAlign: "center",
          lineHeight: 1.5,
          padding: "0 80px",
          opacity: summaryOpacity,
          transform: `translateY(${summaryY}px)`,
        }}
      >
        {headline.summary}
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/*  Scene 3 — Opinion (dynamic duration)                              */
/* ------------------------------------------------------------------ */
const Opinion: React.FC<{ opinion: string }> = ({ opinion }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  const barHeight = interpolate(frame, [5, 40], [0, 300], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const quoteScale = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 14, stiffness: 160 },
  });

  const textOpacity = interpolate(frame, [20, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [20, 45], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const closeQuoteOpacity = interpolate(frame, [50, 65], [0, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: THEME.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* "Opinyon" label */}
      <div
        style={{
          position: "absolute",
          top: 640,
          fontFamily: THEME.fontHeading,
          fontSize: 36,
          color: THEME.teal,
          textTransform: "uppercase",
          letterSpacing: 6,
          opacity: labelOpacity,
        }}
      >
        Opinyon
      </div>

      {/* Left teal bar */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 720,
          width: 5,
          height: barHeight,
          backgroundColor: THEME.tealLight,
          borderRadius: 3,
        }}
      />

      {/* Opening quote */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 700,
          fontFamily: THEME.fontHeading,
          fontSize: 120,
          color: THEME.teal,
          lineHeight: 1,
          transform: `scale(${quoteScale})`,
          transformOrigin: "top left",
          opacity: 0.6,
        }}
      >
        &ldquo;
      </div>

      {/* Opinion text */}
      <div
        style={{
          position: "absolute",
          top: 760,
          left: 130,
          right: 80,
          fontFamily: THEME.fontBody,
          fontSize: 34,
          color: THEME.text,
          lineHeight: 1.6,
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
        }}
      >
        {opinion}
      </div>

      {/* Closing quote */}
      <div
        style={{
          position: "absolute",
          right: 100,
          bottom: 640,
          fontFamily: THEME.fontHeading,
          fontSize: 120,
          color: THEME.teal,
          lineHeight: 1,
          opacity: closeQuoteOpacity,
        }}
      >
        &rdquo;
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/*  Scene 4 — CTA (last 90 frames / 3 seconds)                       */
/* ------------------------------------------------------------------ */
const CTA: React.FC<{ ctaText: string }> = ({ ctaText }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Rising teal particles
  const particles = Array.from({ length: 12 }, (_, i) => {
    const x = 100 + (i * 73) % 880;
    const speed = 1.5 + (i % 3) * 0.8;
    const startY = 1920 + (i * 40) % 200;
    const y = startY - frame * speed * 4;
    const size = 4 + (i % 4) * 2;
    const opacity = interpolate(frame, [0, 15, 70, 90], [0, 0.5, 0.5, 0], {
      extrapolateRight: "clamp",
    });
    return { x, y, size, opacity };
  });

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 150 },
  });

  const subtitleOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const ctaTextOpacity = interpolate(frame, [25, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const buttonScale = spring({
    frame: Math.max(0, frame - 35),
    fps,
    config: { damping: 10, stiffness: 180 },
  });
  const buttonPulse =
    1 + Math.sin(frame * 0.2) * 0.03 * (frame > 45 ? 1 : 0);

  const hintOpacity = interpolate(frame, [50, 65], [0, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: THEME.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Radial glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, ${THEME.teal}30, transparent 65%)`,
        }}
      />

      {/* Particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: THEME.tealLight,
            opacity: p.opacity,
          }}
        />
      ))}

      {/* Logo: My<teal>Taya</teal> */}
      <div
        style={{
          position: "absolute",
          top: 720,
          fontFamily: THEME.fontHeading,
          fontSize: 110,
          color: THEME.text,
          transform: `scale(${logoScale})`,
          textShadow: `0 0 40px ${THEME.teal}60`,
        }}
      >
        My
        <span style={{ color: THEME.tealLight }}>Taya</span>
      </div>

      {/* Subtitle */}
      <div
        style={{
          position: "absolute",
          top: 850,
          fontFamily: THEME.fontBody,
          fontSize: 30,
          color: THEME.textSec,
          opacity: subtitleOpacity,
        }}
      >
        mytaya.com
      </div>

      {/* CTA text */}
      <div
        style={{
          position: "absolute",
          top: 920,
          fontFamily: THEME.fontBody,
          fontSize: 32,
          color: THEME.text,
          textAlign: "center",
          padding: "0 80px",
          opacity: ctaTextOpacity,
        }}
      >
        {ctaText}
      </div>

      {/* "I-Subscribe" button */}
      <div
        style={{
          position: "absolute",
          top: 1040,
          transform: `scale(${buttonScale * buttonPulse})`,
        }}
      >
        <div
          style={{
            fontFamily: THEME.fontHeading,
            fontSize: 38,
            color: THEME.text,
            backgroundColor: THEME.teal,
            padding: "16px 64px",
            borderRadius: 12,
            textTransform: "uppercase",
            letterSpacing: 3,
            boxShadow: `0 0 30px ${THEME.teal}50`,
          }}
        >
          I-Subscribe
        </div>
      </div>

      {/* Hint */}
      <div
        style={{
          position: "absolute",
          top: 1130,
          fontFamily: THEME.fontBody,
          fontSize: 22,
          color: THEME.textSec,
          opacity: hintOpacity,
        }}
      >
        Telegram sa description
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Composition                                                   */
/* ------------------------------------------------------------------ */
export const BalitaSports: React.FC<z.infer<typeof balitaSportsSchema>> = (
  props,
) => {
  const { durationInFrames } = useVideoConfig();
  const ctaStart = durationInFrames - BALITA_SCENES.ctaDuration;
  const opinionDuration = ctaStart - BALITA_SCENES.opinionStart;

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg }}>
      <Audio src={staticFile("bgm.mp3")} volume={0.25} />
      {props.narrationSrc && (
        <Audio src={staticFile(props.narrationSrc)} volume={1} />
      )}

      <Sequence
        from={BALITA_SCENES.intro.start}
        durationInFrames={BALITA_SCENES.intro.duration}
      >
        <Intro headlineNumber={props.headlineNumber} date={props.date} />
      </Sequence>

      <Sequence
        from={BALITA_SCENES.headline.start}
        durationInFrames={BALITA_SCENES.headline.duration}
      >
        <Headline
          headlineNumber={props.headlineNumber}
          headline={props.headline}
        />
      </Sequence>

      <Sequence
        from={BALITA_SCENES.opinionStart}
        durationInFrames={opinionDuration}
      >
        <Opinion opinion={props.opinion} />
      </Sequence>

      <Sequence from={ctaStart} durationInFrames={BALITA_SCENES.ctaDuration}>
        <CTA ctaText={props.ctaText} />
      </Sequence>
    </AbsoluteFill>
  );
};
