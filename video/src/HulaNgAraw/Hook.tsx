import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { THEME } from "../styles/theme";

export const Hook: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shakeX = Math.sin(frame * 1.5) * interpolate(frame, [0, 20, 60], [8, 4, 0], { extrapolateRight: "clamp" });
  const shakeY = Math.cos(frame * 2) * interpolate(frame, [0, 20, 60], [6, 3, 0], { extrapolateRight: "clamp" });
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 200 } });
  const flashOpacity = interpolate(frame, [0, 8, 20], [1, 0.6, 0], { extrapolateRight: "clamp" });
  const vignetteOpacity = interpolate(frame, [0, 30], [0, 0.7], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${THEME.teal}, transparent 70%)`, opacity: flashOpacity }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)", opacity: vignetteOpacity }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `translate(${shakeX}px, ${shakeY}px)` }}>
        <div style={{
          fontFamily: THEME.fontHeading, fontSize: 72, fontWeight: 700, color: THEME.text,
          textAlign: "center", textTransform: "uppercase", lineHeight: 1.1,
          padding: "0 60px", transform: `scale(${scale})`,
          textShadow: `0 0 40px ${THEME.teal}80`,
        }}>
          {text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
