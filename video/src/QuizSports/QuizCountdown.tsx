import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { THEME } from "../styles/theme";
import { bebasNeueFamily, interFamily } from "../fonts";

const OPTION_LABELS = ["A", "B", "C"];

export const QuizCountdown: React.FC<{ question: string; options: string[] }> = ({ question, options }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const countdownNumber = Math.max(1, 3 - Math.floor(frame / 30));
  const numberFrame = frame % 30;
  const numberScale = spring({ frame: numberFrame, fps, config: { damping: 8, stiffness: 300, mass: 0.4 } });
  const ringScale = interpolate(frame % 30, [0, 29], [0.8, 1.2]);
  const ringOpacity = interpolate(frame % 30, [0, 29], [0.6, 0]);
  const progress = interpolate(frame, [0, 90], [1, 0], { extrapolateRight: "clamp" });
  const flashOpacity = interpolate(numberFrame, [0, 5, 15], [0.3, 0, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg }}>
      <AbsoluteFill style={{ backgroundColor: THEME.teal, opacity: flashOpacity }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.8) 100%)" }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: interFamily, fontSize: 28, fontWeight: 500, color: THEME.textSec, textTransform: "uppercase", letterSpacing: 6, marginBottom: 40 }}>Mag-isip...</div>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", width: 200, height: 200, borderRadius: "50%", border: `3px solid ${THEME.teal}`, transform: `translate(-50%, -50%) scale(${ringScale})`, opacity: ringOpacity }} />
          <div style={{ fontFamily: bebasNeueFamily, fontSize: 180, fontWeight: 700, color: THEME.teal, transform: `scale(${numberScale})`, textShadow: `0 0 40px ${THEME.teal}80`, lineHeight: 1 }}>{countdownNumber}</div>
        </div>
        <div style={{ marginTop: 60, width: 400, height: 6, backgroundColor: `${THEME.teal}20`, borderRadius: 3 }}>
          <div style={{ width: `${progress * 100}%`, height: "100%", backgroundColor: THEME.teal, borderRadius: 3, boxShadow: `0 0 12px ${THEME.teal}60` }} />
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 50 }}>
          {options.map((_, i) => (<div key={i} style={{ fontFamily: bebasNeueFamily, fontSize: 24, fontWeight: 700, color: THEME.textSec, backgroundColor: THEME.bgInner, padding: "8px 20px", borderRadius: 8, border: `1px solid ${THEME.teal}30` }}>{OPTION_LABELS[i]}</div>))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
