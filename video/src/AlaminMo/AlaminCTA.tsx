import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { THEME } from "../styles/theme";
import { bebasNeueFamily, interFamily } from "../fonts";

export const AlaminCTA: React.FC<{ ctaText: string }> = ({ ctaText }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoScale = spring({ frame, fps, config: { damping: 10, stiffness: 200 } });
  const labelOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: "clamp" });
  const labelY = interpolate(frame, [10, 25], [-30, 0], { extrapolateRight: "clamp" });
  const ctaOpacity = interpolate(frame, [30, 45], [0, 1], { extrapolateRight: "clamp" });
  const pulse = interpolate(Math.sin(frame * 0.15), [-1, 1], [1, 1.06]);
  const buttonSpring = spring({ frame: Math.max(0, frame - 40), fps, config: { damping: 10, stiffness: 180 } });
  const particleOpacity = interpolate(frame, [0, 20], [0, 0.6], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg }}>
      <AbsoluteFill style={{ opacity: particleOpacity }}>
        {Array.from({ length: 25 }).map((_, i) => {
          const x = (i * 137.5) % 1080; const speed = 1 + (i % 3);
          const y = 1920 - ((frame * speed + i * 100) % 2100); const size = 2 + (i % 5);
          return (<div key={i} style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", backgroundColor: THEME.teal, opacity: 0.2 + (i % 5) * 0.1 }} />);
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.7) 100%)" }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: interFamily, fontSize: 24, fontWeight: 500, color: THEME.teal, textTransform: "uppercase", letterSpacing: 4, marginBottom: 30, opacity: labelOpacity, transform: `translateY(${labelY}px)` }}>Alamin mo ngayon</div>
        <div style={{ fontFamily: bebasNeueFamily, fontSize: 90, fontWeight: 700, color: THEME.text, transform: `scale(${logoScale})`, marginBottom: 16 }}>My<span style={{ color: THEME.teal }}>Taya</span></div>
        <div style={{ fontFamily: interFamily, fontSize: 22, color: THEME.textSec, marginBottom: 60 }}>mytaya.com</div>
        <div style={{ fontFamily: bebasNeueFamily, fontSize: 42, fontWeight: 700, color: THEME.text, textTransform: "uppercase", textAlign: "center", marginBottom: 30, opacity: ctaOpacity, padding: "0 60px" }}>{ctaText}</div>
        <div style={{ padding: "20px 70px", backgroundColor: THEME.teal, borderRadius: 12, transform: `scale(${buttonSpring * pulse})`, boxShadow: `0 0 40px ${THEME.teal}50`, opacity: buttonSpring }}>
          <div style={{ fontFamily: bebasNeueFamily, fontSize: 34, fontWeight: 700, color: THEME.bg, textTransform: "uppercase" }}>I-Subscribe</div>
        </div>
        <div style={{ marginTop: 50, fontFamily: interFamily, fontSize: 20, color: THEME.textSec, opacity: interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" }) }}>@mytaya</div>
        <div style={{ marginTop: 20, fontFamily: interFamily, fontSize: 22, fontWeight: 500, color: THEME.teal, textAlign: "center", opacity: interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" }) }}>Telegram sa description</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
