import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { THEME } from "../styles/theme";
import { bebasNeueFamily, interFamily } from "../fonts";

export const QuizQuestion: React.FC<{ question: string }> = ({ question }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const badgeScale = spring({ frame, fps, config: { damping: 8, stiffness: 250, mass: 0.5 } });
  const textY = interpolate(frame, [10, 30], [60, 0], { extrapolateRight: "clamp" });
  const textOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: "clamp" });
  const particleOpacity = interpolate(frame, [5, 20], [0, 0.3], { extrapolateRight: "clamp" });
  const glowSize = interpolate(Math.sin(frame * 0.2), [-1, 1], [40, 80]);

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg }}>
      <AbsoluteFill style={{ opacity: particleOpacity }}>
        {Array.from({ length: 12 }).map((_, i) => {
          const x = 80 + ((i * 137) % 920); const baseY = 200 + ((i * 250) % 1400);
          const y = baseY - frame * (0.8 + (i % 3) * 0.4);
          return (<div key={i} style={{ position: "absolute", left: x, top: y, fontFamily: bebasNeueFamily, fontSize: 40 + (i % 3) * 15, fontWeight: 700, color: THEME.teal, opacity: 0.12 + (i % 4) * 0.04, transform: `rotate(${frame * (i % 2 === 0 ? 1.5 : -1.5)}deg)` }}>?</div>);
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.75) 100%)" }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 60px" }}>
        <div style={{ fontFamily: bebasNeueFamily, fontSize: 72, fontWeight: 700, color: THEME.bg, backgroundColor: THEME.teal, padding: "12px 50px", borderRadius: 16, transform: `scale(${badgeScale})`, boxShadow: `0 0 ${glowSize}px ${THEME.teal}60`, marginBottom: 50 }}>QUIZ</div>
        <div style={{ fontFamily: interFamily, fontSize: 44, fontWeight: 700, color: THEME.text, textAlign: "center", lineHeight: 1.3, opacity: textOpacity, transform: `translateY(${textY}px)` }}>{question}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
