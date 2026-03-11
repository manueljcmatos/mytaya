import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { THEME } from "../styles/theme";
import { bebasNeueFamily, interFamily } from "../fonts";

export const QuizCTA: React.FC<{ ctaText: string }> = ({ ctaText }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoScale = spring({ frame, fps, config: { damping: 10, stiffness: 200 } });
  const pulse = interpolate(Math.sin(frame * 0.15), [-1, 1], [1, 1.06]);
  const buttonSpring = spring({ frame: Math.max(0, frame - 25), fps, config: { damping: 10, stiffness: 180 } });
  const particleOpacity = interpolate(frame, [0, 15], [0, 0.5], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg }}>
      <AbsoluteFill style={{ opacity: particleOpacity }}>
        {Array.from({ length: 20 }).map((_, i) => {
          const x = (i * 137.5) % 1080; const speed = 1 + (i % 3);
          const y = 1920 - ((frame * speed + i * 100) % 2100); const size = 2 + (i % 4);
          return (<div key={i} style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", backgroundColor: THEME.teal, opacity: 0.2 + (i % 5) * 0.08 }} />);
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.7) 100%)" }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: bebasNeueFamily, fontSize: 90, fontWeight: 700, color: THEME.text, transform: `scale(${logoScale})`, marginBottom: 16 }}>My<span style={{ color: THEME.teal }}>Taya</span></div>
        <div style={{ fontFamily: interFamily, fontSize: 22, color: THEME.textSec, marginBottom: 50 }}>mytaya.com</div>
        <div style={{ fontFamily: bebasNeueFamily, fontSize: 38, fontWeight: 700, color: THEME.text, textTransform: "uppercase", textAlign: "center", marginBottom: 30, padding: "0 60px", opacity: interpolate(frame, [15, 30], [0, 1], { extrapolateRight: "clamp" }) }}>{ctaText}</div>
        <div style={{ padding: "18px 60px", backgroundColor: THEME.teal, borderRadius: 12, transform: `scale(${buttonSpring * pulse})`, boxShadow: `0 0 35px ${THEME.teal}50`, opacity: buttonSpring }}>
          <div style={{ fontFamily: bebasNeueFamily, fontSize: 32, fontWeight: 700, color: THEME.bg, textTransform: "uppercase" }}>I-Subscribe</div>
        </div>
        <div style={{ marginTop: 40, fontFamily: interFamily, fontSize: 22, fontWeight: 500, color: THEME.teal, textAlign: "center", opacity: interpolate(frame, [40, 55], [0, 1], { extrapolateRight: "clamp" }) }}>Telegram sa description</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
