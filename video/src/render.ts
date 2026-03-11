import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import fs from "fs";

const main = async () => {
  const propsFile = process.argv[2];
  if (!propsFile) {
    console.error("Usage: npx tsx src/render.ts <props.json> [compositionId] [durationInFrames]");
    process.exit(1);
  }

  const props = JSON.parse(fs.readFileSync(propsFile, "utf-8"));
  const compositionId = process.argv[3] || "HulaNgAraw";
  const durationOverride = process.argv[4] ? parseInt(process.argv[4], 10) : undefined;

  console.log("Bundling...");
  const bundleLocation = await bundle({
    entryPoint: path.resolve("./src/index.ts"),
    webpackOverride: (config) => config,
  });

  console.log("Selecting composition...");
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: compositionId,
    inputProps: props,
  });

  if (durationOverride) {
    console.log(`Duration override: ${durationOverride} frames (${(durationOverride / composition.fps).toFixed(1)}s)`);
    composition.durationInFrames = durationOverride;
  }

  const outputPath = path.resolve(`./out/${compositionId}-${Date.now()}.mp4`);

  console.log(`Rendering ${compositionId} — ${composition.durationInFrames} frames (${(composition.durationInFrames / composition.fps).toFixed(1)}s)...`);
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: outputPath,
    inputProps: props,
  });

  console.log(`Rendered: ${outputPath}`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
