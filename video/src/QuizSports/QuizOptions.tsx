import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { THEME } from "../styles/theme";
import { bebasNeueFamily, interFamily } from "../fonts";

const OPTION_LABELS = ["A", "B", "C"];

export const QuizOptions: React.FC<{ question: string; options: string[] }> = ({ question, options }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const questionOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.75) 100%)" }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 60px" }}>
        <div style={{ fontFamily: interFamily, fontSize: 34, fontWeight: 700, color: THEME.text, textAlign: "center", lineHeight: 1.3, marginBottom: 60, opacity: questionOpacity, maxWidth: 800 }}>{question}</div>
        {options.map((option, i) => {
          const delay = i * 15;
          const optionSpring = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 12, stiffness: 200 } });
          const slideX = interpolate(optionSpring, [0, 1], [-120, 0]);
          const opacity = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24, opacity, transform: `translateX(${slideX}px)`, width: "100%", maxWidth: 700 }}>
              <div style={{ fontFamily: bebasNeueFamily, fontSize: 36, fontWeight: 700, color: THEME.bg, backgroundColor: THEME.teal, width: 60, height: 60, borderRadius: 12, display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0 }}>{OPTION_LABELS[i]}</div>
              <div style={{ fontFamily: interFamily, fontSize: 32, fontWeight: 500, color: THEME.text, backgroundColor: THEME.bgInner, padding: "16px 24px", borderRadius: 12, border: `2px solid ${THEME.teal}30`, flex: 1 }}>{option}</div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
