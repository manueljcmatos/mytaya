import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { THEME } from "../styles/theme";

export const Analysis: React.FC<{ analysis: string[] }> = ({ analysis }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg }}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 60px" }}>
        <div style={{ fontFamily: THEME.fontHeading, fontSize: 44, fontWeight: 700, color: THEME.teal, textTransform: "uppercase", marginBottom: 50, opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }) }}>Mga Datos</div>
        {analysis.map((point, i) => {
          const delay = 20 + i * 30;
          const bulletSpring = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 12 } });
          const bulletX = interpolate(bulletSpring, [0, 1], [-80, 0]);
          const bulletOpacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 30, opacity: bulletOpacity, transform: `translateX(${bulletX}px)`, maxWidth: 700 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: THEME.teal, marginTop: 12, flexShrink: 0, boxShadow: `0 0 10px ${THEME.teal}60` }} />
              <div style={{ fontFamily: THEME.fontBody, fontSize: 32, color: THEME.text, lineHeight: 1.4 }}>{point}</div>
            </div>
          );
        })}
        <div style={{ marginTop: 50, fontFamily: THEME.fontHeading, fontSize: 36, color: THEME.teal, opacity: interpolate(frame, [160, 180], [0, 1], { extrapolateRight: "clamp" }), textTransform: "uppercase" }}>Ano sa tingin mo?</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
