import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { THEME } from "../styles/theme";
import { bebasNeueFamily, interFamily } from "../fonts";

export const Explanation: React.FC<{ factContext: string; bullets: string[] }> = ({ factContext, bullets }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const titleScale = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });
  const contextOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const contextY = interpolate(frame, [15, 35], [20, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg }}>
      <AbsoluteFill style={{ opacity: 0.04 }}>
        {Array.from({ length: 15 }).map((_, i) => (<div key={i} style={{ position: "absolute", left: -200 + i * 150, top: 0, width: 2, height: 2800, backgroundColor: THEME.teal, transform: "rotate(35deg)", transformOrigin: "top left" }} />))}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)" }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 70px" }}>
        <div style={{ fontFamily: bebasNeueFamily, fontSize: 44, fontWeight: 700, color: THEME.teal, textTransform: "uppercase", marginBottom: 30, opacity: titleOpacity, transform: `scale(${titleScale})`, textShadow: `0 0 20px ${THEME.teal}40` }}>Bakit mahalaga?</div>
        <div style={{ fontFamily: interFamily, fontSize: 28, fontWeight: 400, color: THEME.textSec, textAlign: "center", lineHeight: 1.5, maxWidth: 650, marginBottom: 50, opacity: contextOpacity, transform: `translateY(${contextY}px)` }}>{factContext}</div>
        {bullets.map((bullet, i) => {
          const delay = 35 + i * 25;
          const bulletSpring = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 12 } });
          const bulletX = interpolate(bulletSpring, [0, 1], [-80, 0]);
          const bulletOpacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 28, opacity: bulletOpacity, transform: `translateX(${bulletX}px)`, maxWidth: 650, width: "100%" }}>
              <div style={{ width: 14, height: 14, backgroundColor: THEME.teal, marginTop: 10, flexShrink: 0, transform: "rotate(45deg)", boxShadow: `0 0 10px ${THEME.teal}60` }} />
              <div style={{ fontFamily: interFamily, fontSize: 30, fontWeight: 500, color: THEME.text, lineHeight: 1.4 }}>{bullet}</div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
