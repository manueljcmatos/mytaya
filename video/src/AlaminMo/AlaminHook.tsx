import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { THEME } from "../styles/theme";
import { bebasNeueFamily } from "../fonts";

export const AlaminHook: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shakeIntensity = interpolate(frame, [0, 25, 60], [10, 5, 0], { extrapolateRight: "clamp" });
  const shakeX = Math.sin(frame * 1.8) * shakeIntensity;
  const shakeY = Math.cos(frame * 2.3) * shakeIntensity * 0.7;
  const zoomScale = spring({ frame, fps, config: { damping: 8, stiffness: 180, mass: 0.8 } });
  const scale = interpolate(zoomScale, [0, 1], [3, 1]);
  const flashOpacity = interpolate(frame, [0, 6, 18], [1, 0.7, 0], { extrapolateRight: "clamp" });
  const vignetteOpacity = interpolate(frame, [0, 35], [0, 0.8], { extrapolateRight: "clamp" });
  const glowPulse = interpolate(Math.sin(frame * 0.2), [-1, 1], [30, 60]);
  const particleOpacity = interpolate(frame, [15, 35], [0, 0.4], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${THEME.teal}, transparent 60%)`, opacity: flashOpacity }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)", opacity: vignetteOpacity }} />
      <AbsoluteFill style={{ opacity: particleOpacity }}>
        {Array.from({ length: 8 }).map((_, i) => {
          const x = 100 + (i * 137) % 880;
          const baseY = 300 + (i * 200) % 1300;
          const y = baseY - frame * (1 + (i % 3)) * 0.5;
          const rotation = frame * (i % 2 === 0 ? 2 : -2);
          return (<div key={i} style={{ position: "absolute", left: x, top: y, fontFamily: bebasNeueFamily, fontSize: 60 + (i % 3) * 20, fontWeight: 700, color: THEME.teal, opacity: 0.15 + (i % 4) * 0.05, transform: `rotate(${rotation}deg)` }}>?</div>);
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `translate(${shakeX}px, ${shakeY}px)` }}>
        <div style={{ fontFamily: bebasNeueFamily, fontSize: 90, fontWeight: 700, color: THEME.text, textAlign: "center", textTransform: "uppercase", lineHeight: 1.1, padding: "0 60px", transform: `scale(${scale})`, textShadow: `0 0 ${glowPulse}px ${THEME.teal}90` }}>{text}</div>
        <div style={{ width: interpolate(frame, [20, 45], [0, 300], { extrapolateRight: "clamp" }), height: 4, backgroundColor: THEME.teal, marginTop: 20, boxShadow: `0 0 20px ${THEME.teal}60` }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
