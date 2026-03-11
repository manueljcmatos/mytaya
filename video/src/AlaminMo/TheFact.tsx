import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { THEME } from "../styles/theme";
import { bebasNeueFamily, interFamily } from "../fonts";

export const TheFact: React.FC<{ stat: string; factTitle: string }> = ({ stat, factTitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const numericMatch = stat.match(/^([\d.]+)(.*)$/);
  const isNumeric = numericMatch !== null;
  const targetNumber = isNumeric ? parseFloat(numericMatch![1]) : 0;
  const suffix = isNumeric ? numericMatch![2] : "";
  const counterProgress = interpolate(frame, [5, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const easedProgress = 1 - Math.pow(1 - counterProgress, 3);
  const currentNumber = isNumeric ? (targetNumber * easedProgress).toFixed(numericMatch![1].includes(".") ? 1 : 0) : stat;
  const displayStat = isNumeric ? `${currentNumber}${suffix}` : stat;
  const statScale = spring({ frame, fps, config: { damping: 10, stiffness: 160, mass: 0.6 } });
  const glowSize = interpolate(Math.sin(frame * 0.08), [-1, 1], [20, 50]);
  const titleOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [30, 50], [30, 0], { extrapolateRight: "clamp" });
  const borderProgress = interpolate(frame, [15, 60], [0, 1], { extrapolateRight: "clamp" });
  const borderWidth = 680; const borderHeight = 500;
  const borderPerimeter = 2 * (borderWidth + borderHeight);
  const dashLength = borderPerimeter * borderProgress;
  const ringScale = interpolate(frame, [0, 120], [0.5, 1.2], { extrapolateRight: "clamp" });
  const ringOpacity = interpolate(frame, [0, 30, 100, 135], [0, 0.15, 0.15, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg }}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {[1, 1.5, 2].map((m, i) => (<div key={i} style={{ position: "absolute", width: 400 * m, height: 400 * m, borderRadius: "50%", border: `2px solid ${THEME.teal}`, opacity: ringOpacity, transform: `scale(${ringScale})` }} />))}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)" }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 60px" }}>
        <div style={{ position: "absolute", width: borderWidth, height: borderHeight }}>
          <svg width={borderWidth} height={borderHeight} style={{ position: "absolute", top: 0, left: 0 }}>
            <rect x={2} y={2} width={borderWidth - 4} height={borderHeight - 4} fill="none" stroke={THEME.teal} strokeWidth={3} strokeDasharray={`${dashLength} ${borderPerimeter}`} rx={16} ry={16} style={{ filter: `drop-shadow(0 0 8px ${THEME.teal}50)` }} />
          </svg>
        </div>
        <div style={{ fontFamily: bebasNeueFamily, fontSize: 160, fontWeight: 700, color: THEME.teal, textAlign: "center", transform: `scale(${statScale})`, textShadow: `0 0 ${glowSize}px ${THEME.teal}80, 0 4px 20px rgba(0,0,0,0.5)`, lineHeight: 1, marginBottom: 20 }}>{displayStat}</div>
        <div style={{ fontFamily: interFamily, fontSize: 36, fontWeight: 500, color: THEME.text, textAlign: "center", lineHeight: 1.3, maxWidth: 600, opacity: titleOpacity, transform: `translateY(${titleY}px)` }}>{factTitle}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
