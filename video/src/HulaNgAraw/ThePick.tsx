import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { THEME } from "../styles/theme";

const CONF_COLORS = { high: THEME.green, medium: THEME.teal, low: THEME.red };

export const ThePick: React.FC<{
  market: string; confidence: "high" | "medium" | "low"; hotTake: string;
}> = ({ market, confidence, hotTake }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const slideUp = spring({ frame, fps, config: { damping: 14 } });
  const translateY = interpolate(slideUp, [0, 1], [100, 0]);
  const hotTakeOpacity = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" });
  const hotTakeX = interpolate(frame, [50, 70], [-100, 0], { extrapolateRight: "clamp" });
  const confColor = CONF_COLORS[confidence];
  const confLabel = confidence === "high" ? "Mataas" : confidence === "medium" ? "Katamtaman" : "Mababa";

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)", opacity: 0.6 }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fadeIn, transform: `translateY(${translateY}px)` }}>
        <div style={{ fontFamily: THEME.fontBody, fontSize: 28, color: THEME.textSec, textTransform: "uppercase", letterSpacing: 3, marginBottom: 20 }}>Pangunahing Hula</div>
        <div style={{ fontFamily: THEME.fontHeading, fontSize: 52, fontWeight: 700, color: THEME.teal, textAlign: "center", padding: "0 50px", lineHeight: 1.2 }}>{market}</div>
        <div style={{ marginTop: 30, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: confColor, boxShadow: `0 0 12px ${confColor}80` }} />
          <div style={{ fontFamily: THEME.fontBody, fontSize: 24, color: confColor, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2 }}>Kumpiyansa: {confLabel}</div>
        </div>
        <div style={{ marginTop: 50, padding: "20px 40px", backgroundColor: `${THEME.teal}15`, borderLeft: `4px solid ${THEME.teal}`, maxWidth: 700, opacity: hotTakeOpacity, transform: `translateX(${hotTakeX}px)` }}>
          <div style={{ fontFamily: THEME.fontBody, fontSize: 28, color: THEME.text, fontStyle: "italic", lineHeight: 1.4 }}>{"\u201C"}{hotTake}{"\u201D"}</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
