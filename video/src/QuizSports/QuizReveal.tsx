import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { THEME } from "../styles/theme";
import { bebasNeueFamily, interFamily } from "../fonts";

const OPTION_LABELS = ["A", "B", "C"];

export const QuizReveal: React.FC<{ options: string[]; correctIndex: number; explanation: string }> = ({ options, correctIndex, explanation }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flashOpacity = interpolate(frame, [0, 8, 20], [0.5, 0.2, 0], { extrapolateRight: "clamp" });
  const correctScale = spring({ frame, fps, config: { damping: 8, stiffness: 200, mass: 0.6 } });
  const explainOpacity = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });
  const explainY = interpolate(frame, [40, 60], [20, 0], { extrapolateRight: "clamp" });
  const confettiOpacity = interpolate(frame, [5, 20], [0, 0.7], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, ${THEME.teal}, transparent 60%)`, opacity: flashOpacity }} />
      <AbsoluteFill style={{ opacity: confettiOpacity }}>
        {Array.from({ length: 30 }).map((_, i) => {
          const x = (i * 97) % 1080; const speed = 2 + (i % 4);
          const y = -20 + frame * speed + ((i * 43) % 200);
          const rotation = frame * (i % 2 === 0 ? 3 : -3);
          const colors = [THEME.teal, THEME.green, THEME.text];
          return (<div key={i} style={{ position: "absolute", left: x, top: y % 2000, width: 8 + (i % 4) * 2, height: 4 + (i % 3) * 2, backgroundColor: colors[i % 3], opacity: 0.5 + (i % 3) * 0.15, transform: `rotate(${rotation}deg)`, borderRadius: 2 }} />);
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.7) 100%)" }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 60px" }}>
        <div style={{ fontFamily: bebasNeueFamily, fontSize: 32, fontWeight: 700, color: THEME.teal, textTransform: "uppercase", letterSpacing: 6, marginBottom: 40, opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }) }}>Sagot</div>
        {options.map((option, i) => {
          const isCorrect = i === correctIndex;
          const wrongOpacity = isCorrect ? 1 : interpolate(frame, [10, 25], [1, 0.3], { extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20, opacity: wrongOpacity, transform: isCorrect ? `scale(${correctScale * 1.05})` : "none", width: "100%", maxWidth: 700 }}>
              <div style={{ fontFamily: bebasNeueFamily, fontSize: 36, fontWeight: 700, color: isCorrect ? THEME.bg : THEME.textSec, backgroundColor: isCorrect ? THEME.green : THEME.bgInner, width: 60, height: 60, borderRadius: 12, display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0, boxShadow: isCorrect ? `0 0 25px ${THEME.green}60` : "none" }}>{isCorrect ? "✓" : OPTION_LABELS[i]}</div>
              <div style={{ fontFamily: interFamily, fontSize: 30, fontWeight: isCorrect ? 700 : 400, color: isCorrect ? THEME.text : THEME.textSec, backgroundColor: THEME.bgInner, padding: "14px 22px", borderRadius: 12, border: isCorrect ? `2px solid ${THEME.green}` : `2px solid ${THEME.bgInner}`, flex: 1 }}>{option}</div>
            </div>
          );
        })}
        <div style={{ fontFamily: interFamily, fontSize: 26, fontWeight: 400, color: THEME.textSec, textAlign: "center", lineHeight: 1.4, marginTop: 40, maxWidth: 650, opacity: explainOpacity, transform: `translateY(${explainY}px)` }}>{explanation}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
