import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { THEME } from "../styles/theme";

export const CTA: React.FC<{ ctaText: string }> = ({ ctaText }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoScale = spring({ frame, fps, config: { damping: 10, stiffness: 200 } });
  const pulse = interpolate(Math.sin(frame * 0.15), [-1, 1], [1, 1.05]);
  const particleOpacity = interpolate(frame, [0, 20], [0, 0.6], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg }}>
      <AbsoluteFill style={{ opacity: particleOpacity }}>
        {Array.from({ length: 20 }).map((_, i) => {
          const x = (i * 137.5) % 1080;
          const speed = 1 + (i % 3);
          const y = 1920 - ((frame * speed + i * 100) % 2100);
          const size = 3 + (i % 4);
          return (<div key={i} style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", backgroundColor: THEME.teal, opacity: 0.3 + (i % 5) * 0.1 }} />);
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: THEME.fontHeading, fontSize: 80, fontWeight: 700, color: THEME.text, transform: `scale(${logoScale})`, marginBottom: 20 }}>My<span style={{ color: THEME.teal }}>Taya</span></div>
        <div style={{ fontFamily: THEME.fontBody, fontSize: 24, color: THEME.textSec, marginBottom: 60 }}>mytaya.com</div>
        <div style={{ fontFamily: THEME.fontHeading, fontSize: 40, fontWeight: 700, color: THEME.text, textTransform: "uppercase", textAlign: "center", marginBottom: 30 }}>{ctaText}</div>
        <div style={{ padding: "20px 60px", backgroundColor: THEME.teal, borderRadius: 12, transform: `scale(${pulse})`, boxShadow: `0 0 30px ${THEME.teal}40` }}>
          <div style={{ fontFamily: THEME.fontHeading, fontSize: 32, fontWeight: 700, color: THEME.text, textTransform: "uppercase" }}>I-Subscribe</div>
        </div>
        <div style={{ marginTop: 50, fontFamily: THEME.fontBody, fontSize: 22, fontWeight: 500, color: THEME.teal, textAlign: "center", opacity: interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" }) }}>Mas maraming analysis sa description</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
