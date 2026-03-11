import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { THEME } from "../styles/theme";

export const MatchCard: React.FC<{
  homeTeam: string; awayTeam: string; league: string; matchDate: string;
}> = ({ homeTeam, awayTeam, league, matchDate }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slideY = spring({ frame, fps, config: { damping: 14, stiffness: 150 } });
  const translateY = interpolate(slideY, [0, 1], [200, 0]);
  const glowIntensity = interpolate(Math.sin(frame * 0.08), [-1, 1], [20, 50]);
  const vsScale = spring({ frame: Math.max(0, frame - 15), fps, config: { damping: 8, stiffness: 300 } });

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg }}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `translateY(${translateY}px)` }}>
        <div style={{ fontFamily: THEME.fontBody, fontSize: 28, color: THEME.teal, textTransform: "uppercase", letterSpacing: 4, marginBottom: 40 }}>{league}</div>
        <div style={{ fontFamily: THEME.fontHeading, fontSize: 64, fontWeight: 700, color: THEME.text, textAlign: "center", textTransform: "uppercase", lineHeight: 1.1 }}>{homeTeam}</div>
        <div style={{ fontFamily: THEME.fontHeading, fontSize: 48, fontWeight: 700, color: THEME.teal, margin: "24px 0", transform: `scale(${vsScale})`, textShadow: `0 0 ${glowIntensity}px ${THEME.teal}` }}>VS</div>
        <div style={{ fontFamily: THEME.fontHeading, fontSize: 64, fontWeight: 700, color: THEME.text, textAlign: "center", textTransform: "uppercase", lineHeight: 1.1 }}>{awayTeam}</div>
        <div style={{ fontFamily: THEME.fontBody, fontSize: 24, color: THEME.textSec, marginTop: 40 }}>{matchDate}</div>
        <div style={{ position: "absolute", bottom: 200, width: interpolate(frame, [0, 40], [0, 600], { extrapolateRight: "clamp" }), height: 3, backgroundColor: THEME.teal, boxShadow: `0 0 20px ${THEME.teal}60` }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
