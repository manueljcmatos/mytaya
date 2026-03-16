import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate } from "remotion";

export const BgImage: React.FC<{ src?: string; opacity?: number }> = ({ src, opacity = 0.15 }) => {
  const frame = useCurrentFrame();
  if (!src) return null;

  const fadeIn = interpolate(frame, [0, 20], [0, opacity], { extrapolateRight: "clamp" });
  const scale = interpolate(frame, [0, 300], [1.05, 1.15], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: fadeIn,
          transform: `scale(${scale})`,
          filter: "blur(2px) grayscale(30%)",
        }}
      />
      <AbsoluteFill
        style={{
          background: "linear-gradient(to bottom, rgba(10,10,10,0.7) 0%, rgba(10,10,10,0.4) 40%, rgba(10,10,10,0.7) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
