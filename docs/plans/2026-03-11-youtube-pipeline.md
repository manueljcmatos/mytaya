# YouTube Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automated YouTube Shorts pipeline for MyTaya — generates Filipino-language sports prediction videos daily and uploads to YouTube + Telegram.

**Architecture:** Cloudflare Worker cron generates AI scripts in Filipino, triggers GitHub Actions via repository_dispatch. GitHub Actions runs Remotion to render 1080x1920 vertical videos with Google TTS narration (fil-PH), uploads to R2/YouTube/Telegram, and updates Supabase with youtube_url.

**Tech Stack:** Remotion 4.x, Cloudflare Workers + AI, GitHub Actions, Google Cloud TTS, YouTube Data API v3, Supabase, React/TypeScript, Zod

---

### Task 1: Scaffold Remotion Video Project

**Files:**
- Create: `video/package.json`
- Create: `video/tsconfig.json`
- Create: `video/src/index.ts`
- Create: `video/src/styles/theme.ts`
- Create: `video/src/fonts.ts`

**Step 1: Create video/package.json**

```json
{
  "name": "mytaya-video",
  "version": "1.0.0",
  "type": "commonjs",
  "scripts": {
    "studio": "remotion studio src/index.ts",
    "render": "remotion render src/index.ts HulaNgAraw out/hula.mp4",
    "render:file": "npx tsx src/render.ts"
  },
  "dependencies": {
    "@remotion/cli": "^4.0.434",
    "@remotion/google-fonts": "^4.0.434",
    "@remotion/renderer": "^4.0.434",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "remotion": "^4.0.434",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@remotion/bundler": "^4.0.434",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3"
  }
}
```

**Step 2: Create video/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

**Step 3: Create video/src/styles/theme.ts**

MyTaya uses teal instead of betpro's gold, Bebas Neue + Inter instead of Oswald + Outfit.

```typescript
export const THEME = {
  bg: "#0A0A0A",
  bgInner: "#111111",
  teal: "#0F766E",
  tealLight: "#14B8A6",
  text: "#F5F5F5",
  textSec: "#9CA3AF",
  red: "#EF4444",
  green: "#22C55E",
  fontHeading: "Bebas Neue",
  fontBody: "Inter",
} as const;

export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationSeconds: 45,
  durationFrames: 1350,
} as const;

export const SCENES = {
  hook: { start: 0, end: 120 },
  matchCard: { start: 120, end: 330 },
  thePick: { start: 330, end: 660 },
  analysis: { start: 660, end: 1260 },
  cta: { start: 1260, end: 1350 },
} as const;
```

**Step 4: Create video/src/fonts.ts**

```typescript
import { loadFont as loadBebasNeue } from "@remotion/google-fonts/BebasNeue";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

export const { fontFamily: bebasNeueFamily } = loadBebasNeue("normal", { weights: ["400"] });
export const { fontFamily: interFamily } = loadInter("normal", { weights: ["400", "500", "700"] });
```

**Step 5: Create video/src/index.ts**

```typescript
import { registerRoot } from "remotion";
import { Root } from "./Root";
registerRoot(Root);
```

**Step 6: Install dependencies**

Run: `cd video && npm install`

**Step 7: Commit**

```bash
git add video/package.json video/tsconfig.json video/src/
git commit -m "feat: scaffold Remotion video project for YouTube pipeline"
```

---

### Task 2: HulaNgAraw Composition (Pick of the Day)

**Files:**
- Create: `video/src/HulaNgAraw/schema.ts`
- Create: `video/src/HulaNgAraw/Hook.tsx`
- Create: `video/src/HulaNgAraw/MatchCard.tsx`
- Create: `video/src/HulaNgAraw/ThePick.tsx`
- Create: `video/src/HulaNgAraw/Analysis.tsx`
- Create: `video/src/HulaNgAraw/CTA.tsx`
- Create: `video/src/HulaNgAraw/index.tsx`

**Step 1: Create schema.ts**

```typescript
import { z } from "zod";

export const hulaNgArawSchema = z.object({
  hookText: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  league: z.string(),
  matchDate: z.string(),
  market: z.string(),
  odds: z.number(),
  stake: z.number().min(1).max(10),
  confidence: z.enum(["high", "medium", "low"]),
  hotTake: z.string(),
  analysis: z.array(z.string()).length(3),
  ctaText: z.string(),
});

export type HulaNgArawProps = z.infer<typeof hulaNgArawSchema>;
```

**Step 2: Create Hook.tsx**

Same pattern as betpro Hook.tsx but using THEME.teal instead of THEME.gold, bebasNeueFamily instead of Oswald.

```typescript
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { THEME } from "../styles/theme";

export const Hook: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const shakeX = Math.sin(frame * 1.5) * interpolate(frame, [0, 20, 60], [8, 4, 0], { extrapolateRight: "clamp" });
  const shakeY = Math.cos(frame * 2) * interpolate(frame, [0, 20, 60], [6, 3, 0], { extrapolateRight: "clamp" });
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 200 } });
  const flashOpacity = interpolate(frame, [0, 8, 20], [1, 0.6, 0], { extrapolateRight: "clamp" });
  const vignetteOpacity = interpolate(frame, [0, 30], [0, 0.7], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${THEME.teal}, transparent 70%)`, opacity: flashOpacity }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)", opacity: vignetteOpacity }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `translate(${shakeX}px, ${shakeY}px)` }}>
        <div style={{
          fontFamily: THEME.fontHeading,
          fontSize: 72, fontWeight: 700, color: THEME.text,
          textAlign: "center", textTransform: "uppercase", lineHeight: 1.1,
          padding: "0 60px", transform: `scale(${scale})`,
          textShadow: `0 0 40px ${THEME.teal}80`,
        }}>
          {text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

**Step 3: Create MatchCard.tsx**

Same as betpro but teal accent, Filipino field names in props.

```typescript
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
        <div style={{ fontFamily: THEME.fontBody, fontSize: 28, color: THEME.teal, textTransform: "uppercase", letterSpacing: 4, marginBottom: 40 }}>
          {league}
        </div>
        <div style={{ fontFamily: THEME.fontHeading, fontSize: 64, fontWeight: 700, color: THEME.text, textAlign: "center", textTransform: "uppercase", lineHeight: 1.1 }}>
          {homeTeam}
        </div>
        <div style={{ fontFamily: THEME.fontHeading, fontSize: 48, fontWeight: 700, color: THEME.teal, margin: "24px 0", transform: `scale(${vsScale})`, textShadow: `0 0 ${glowIntensity}px ${THEME.teal}` }}>
          VS
        </div>
        <div style={{ fontFamily: THEME.fontHeading, fontSize: 64, fontWeight: 700, color: THEME.text, textAlign: "center", textTransform: "uppercase", lineHeight: 1.1 }}>
          {awayTeam}
        </div>
        <div style={{ fontFamily: THEME.fontBody, fontSize: 24, color: THEME.textSec, marginTop: 40 }}>
          {matchDate}
        </div>
        <div style={{ position: "absolute", bottom: 200, width: interpolate(frame, [0, 40], [0, 600], { extrapolateRight: "clamp" }), height: 3, backgroundColor: THEME.teal, boxShadow: `0 0 20px ${THEME.teal}60` }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

**Step 4: Create ThePick.tsx**

```typescript
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
        <div style={{ fontFamily: THEME.fontBody, fontSize: 28, color: THEME.textSec, textTransform: "uppercase", letterSpacing: 3, marginBottom: 20 }}>
          Pangunahing Hula
        </div>
        <div style={{ fontFamily: THEME.fontHeading, fontSize: 52, fontWeight: 700, color: THEME.teal, textAlign: "center", padding: "0 50px", lineHeight: 1.2 }}>
          {market}
        </div>
        <div style={{ marginTop: 30, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: confColor, boxShadow: `0 0 12px ${confColor}80` }} />
          <div style={{ fontFamily: THEME.fontBody, fontSize: 24, color: confColor, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2 }}>
            Kumpiyansa: {confLabel}
          </div>
        </div>
        <div style={{ marginTop: 50, padding: "20px 40px", backgroundColor: `${THEME.teal}15`, borderLeft: `4px solid ${THEME.teal}`, maxWidth: 700, opacity: hotTakeOpacity, transform: `translateX(${hotTakeX}px)` }}>
          <div style={{ fontFamily: THEME.fontBody, fontSize: 28, color: THEME.text, fontStyle: "italic", lineHeight: 1.4 }}>
            {"\u201C"}{hotTake}{"\u201D"}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

**Step 5: Create Analysis.tsx**

```typescript
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { THEME } from "../styles/theme";

export const Analysis: React.FC<{ analysis: string[] }> = ({ analysis }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg }}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 60px" }}>
        <div style={{ fontFamily: THEME.fontHeading, fontSize: 44, fontWeight: 700, color: THEME.teal, textTransform: "uppercase", marginBottom: 50, opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }) }}>
          Mga Datos
        </div>
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
        <div style={{ marginTop: 50, fontFamily: THEME.fontHeading, fontSize: 36, color: THEME.teal, opacity: interpolate(frame, [160, 180], [0, 1], { extrapolateRight: "clamp" }), textTransform: "uppercase" }}>
          Ano sa tingin mo?
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

**Step 6: Create CTA.tsx**

```typescript
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
          return (
            <div key={i} style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", backgroundColor: THEME.teal, opacity: 0.3 + (i % 5) * 0.1 }} />
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: THEME.fontHeading, fontSize: 80, fontWeight: 700, color: THEME.text, transform: `scale(${logoScale})`, marginBottom: 20 }}>
          My<span style={{ color: THEME.teal }}>Taya</span>
        </div>
        <div style={{ fontFamily: THEME.fontBody, fontSize: 24, color: THEME.textSec, marginBottom: 60 }}>
          mytaya.com
        </div>
        <div style={{ fontFamily: THEME.fontHeading, fontSize: 40, fontWeight: 700, color: THEME.text, textTransform: "uppercase", textAlign: "center", marginBottom: 30 }}>
          {ctaText}
        </div>
        <div style={{ padding: "20px 60px", backgroundColor: THEME.teal, borderRadius: 12, transform: `scale(${pulse})`, boxShadow: `0 0 30px ${THEME.teal}40` }}>
          <div style={{ fontFamily: THEME.fontHeading, fontSize: 32, fontWeight: 700, color: THEME.text, textTransform: "uppercase" }}>
            I-Subscribe
          </div>
        </div>
        <div style={{ marginTop: 50, fontFamily: THEME.fontBody, fontSize: 22, fontWeight: 500, color: THEME.teal, textAlign: "center", opacity: interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" }) }}>
          Mas maraming analysis sa description
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

**Step 7: Create index.tsx (composition orchestrator)**

```typescript
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { z } from "zod";
import { hulaNgArawSchema } from "./schema";
import { Hook } from "./Hook";
import { MatchCard } from "./MatchCard";
import { ThePick } from "./ThePick";
import { Analysis } from "./Analysis";
import { CTA } from "./CTA";
import { SCENES } from "../styles/theme";

export const HulaNgAraw: React.FC<z.infer<typeof hulaNgArawSchema>> = (props) => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("bgm.mp3")} volume={0.6} />
      <Sequence from={SCENES.hook.start} durationInFrames={SCENES.hook.end - SCENES.hook.start}>
        <Hook text={props.hookText} />
      </Sequence>
      <Sequence from={SCENES.matchCard.start} durationInFrames={SCENES.matchCard.end - SCENES.matchCard.start}>
        <MatchCard homeTeam={props.homeTeam} awayTeam={props.awayTeam} league={props.league} matchDate={props.matchDate} />
      </Sequence>
      <Sequence from={SCENES.thePick.start} durationInFrames={SCENES.thePick.end - SCENES.thePick.start}>
        <ThePick market={props.market} confidence={props.confidence} hotTake={props.hotTake} />
      </Sequence>
      <Sequence from={SCENES.analysis.start} durationInFrames={SCENES.analysis.end - SCENES.analysis.start}>
        <Analysis analysis={props.analysis} />
      </Sequence>
      <Sequence from={SCENES.cta.start} durationInFrames={SCENES.cta.end - SCENES.cta.start}>
        <CTA ctaText={props.ctaText} />
      </Sequence>
    </AbsoluteFill>
  );
};
```

**Step 8: Commit**

```bash
git add video/src/HulaNgAraw/
git commit -m "feat: add HulaNgAraw (Pick of the Day) video composition"
```

---

### Task 3: BalitaSports Composition (News of the Day)

**Files:**
- Create: `video/src/BalitaSports/schema.ts`
- Create: `video/src/BalitaSports/index.tsx`

**Step 1: Create schema.ts**

```typescript
import { z } from "zod";

export const balitaSportsSchema = z.object({
  date: z.string(),
  headlineNumber: z.number().min(1).max(3),
  headline: z.object({ title: z.string(), summary: z.string() }),
  opinion: z.string(),
  ctaText: z.string(),
  narrationSrc: z.string().optional(),
});

export type BalitaSportsProps = z.infer<typeof balitaSportsSchema>;

export const BALITA_SCENES = {
  intro: { start: 0, duration: 60 },
  headline: { start: 60, duration: 300 },
  opinionStart: 360,
  ctaDuration: 90,
} as const;
```

**Step 2: Create index.tsx**

Same structure as betpro's NoticiaDelDia but with Filipino text labels:
- "Noticia del Dia" → "Balita Ngayon"
- "Noticias del Futbol" → "Balita sa Sports"
- "Opinion" → "Opinyon"
- "Suscribete" → "I-Subscribe"
- "betpro.cl" → "mytaya.com"
- All THEME.gold → THEME.teal
- All Oswald → Bebas Neue, Outfit → Inter
- BetPro logo text → My<teal>Taya</teal>

Follow the exact same pattern as `/Users/mjcmatos/Desktop/betpro/video/src/NoticiaDelDia/index.tsx` with the inline sub-components (Intro, Headline, Opinion, CTA), adapted for MyTaya branding and Filipino labels.

**Step 3: Commit**

```bash
git add video/src/BalitaSports/
git commit -m "feat: add BalitaSports (News of the Day) video composition"
```

---

### Task 4: AlaminMo Composition (Fun Fact)

**Files:**
- Create: `video/src/AlaminMo/schema.ts`
- Create: `video/src/AlaminMo/AlaminHook.tsx`
- Create: `video/src/AlaminMo/TheFact.tsx`
- Create: `video/src/AlaminMo/Explanation.tsx`
- Create: `video/src/AlaminMo/AlaminCTA.tsx`
- Create: `video/src/AlaminMo/index.tsx`

Follow exact same pattern as betpro DatoCurioso but adapted:
- "Sabias que..." → "Alam mo ba..."
- "Por que importa?" → "Bakit mahalaga?"
- "Dato curioso del dia" → "Alamin mo ngayon"
- All gold → teal, all BetPro → MyTaya
- All Oswald → Bebas Neue (bebasNeueFamily), Outfit → Inter (interFamily)

Schema same as datoCuriosoSchema with same field names (hookText, stat, factTitle, factContext, bullets, ctaText, narrationSrc).

Scene timing same as DATO_SCENES.

**Step 1: Create all files following the DatoCurioso pattern**

**Step 2: Commit**

```bash
git add video/src/AlaminMo/
git commit -m "feat: add AlaminMo (Fun Fact) video composition"
```

---

### Task 5: QuizSports Composition (Sports Quiz)

**Files:**
- Create: `video/src/QuizSports/schema.ts`
- Create: `video/src/QuizSports/QuizQuestion.tsx`
- Create: `video/src/QuizSports/QuizOptions.tsx`
- Create: `video/src/QuizSports/QuizCountdown.tsx`
- Create: `video/src/QuizSports/QuizReveal.tsx`
- Create: `video/src/QuizSports/QuizCTA.tsx`
- Create: `video/src/QuizSports/index.tsx`

Follow exact same pattern as betpro QuizFutbol but adapted:
- "QUIZ" badge stays "QUIZ" (universal)
- "Piensa..." → "Mag-isip..."
- "Respuesta" → "Sagot"
- "Suscribete" → "I-Subscribe"
- "Telegram en la descripcion" → "Telegram sa description"
- All gold → teal, all BetPro → MyTaya
- All Oswald → Bebas Neue, Outfit → Inter

Schema same as quizFutbolSchema. Scene timing same as QUIZ_SCENES.

**Step 1: Create all files following the QuizFutbol pattern**

**Step 2: Commit**

```bash
git add video/src/QuizSports/
git commit -m "feat: add QuizSports (Sports Quiz) video composition"
```

---

### Task 6: Root Composition & Render/TTS Scripts

**Files:**
- Create: `video/src/Root.tsx`
- Create: `video/src/render.ts`
- Create: `video/src/tts.ts`

**Step 1: Create Root.tsx**

Register all 4 compositions with default props (Filipino examples: Ginebra vs SMB for PBA, Liverpool vs City for football, etc.).

**Step 2: Create render.ts**

Exact copy of betpro's render.ts — it's generic (takes props.json + compositionId + optional durationOverride).

**Step 3: Create tts.ts**

Same as betpro's tts.ts but:
- Change TTS voice from `es-US-Wavenet-A` → `fil-PH-Standard-A` (Filipino female)
- Speaking rate: 1.0 (instead of 1.05)
- Pitch: 0 (instead of 0.5)
- Change CTA line to Filipino: "Gusto mo bang makakuha ng mga tama na hula? Sumali sa aming Telegram, link sa description."
- Map composition IDs: HulaNgAraw (no TTS, BGM only), BalitaSports, AlaminMo, QuizSports
- Update narration text builders for Filipino labels

**Step 4: Commit**

```bash
git add video/src/Root.tsx video/src/render.ts video/src/tts.ts
git commit -m "feat: add Root, render, and TTS scripts for video pipeline"
```

---

### Task 7: Background Music Asset

**Files:**
- Create: `video/public/bgm.mp3`

**Step 1:** Copy bgm.mp3 from betpro or source a royalty-free background track.

Run: `cp /Users/mjcmatos/Desktop/betpro/video/public/bgm.mp3 video/public/bgm.mp3`

**Step 2: Commit**

```bash
git add video/public/bgm.mp3
git commit -m "feat: add background music for video compositions"
```

---

### Task 8: Video Cron Worker

**Files:**
- Create: `workers/mytaya-video-cron.js`
- Create: `workers/wrangler-video.toml`

**Step 1: Create wrangler-video.toml**

```toml
name = "mytaya-video-cron"
main = "mytaya-video-cron.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[ai]
binding = "AI"

[triggers]
crons = ["0 5 * * *", "0 7 * * *", "0 13 * * *"]
```

Three cron triggers at 05:00, 07:00, 13:00 UTC (13h, 15h, 21h PHT).

**Step 2: Create mytaya-video-cron.js**

Same architecture as betpro-video-cron.js but adapted:
- REPO_OWNER/REPO_NAME → 'manueljcmatos'/'mytaya' (or correct repo name)
- Supabase query: `predictions` table instead of `pronosticos`, different column names (home_team_id join, away_team_id join, league_id join, pick as market, odds, stake, confidence, match_date)
- AI prompts in Filipino: Generate scripts in Tagalog, avoid gambling terms ("pustahan", "taya" for odds), use Filipino sports slang
- Schedule adjusted for PHT (UTC+8):
  - Mon/Wed/Fri: 05:00 UTC (13h) AlaminMo/QuizSports + 13:00 UTC (21h) HulaNgAraw
  - Tue/Thu: 05:00 UTC (13h) AlaminMo/QuizSports + 07:00 UTC (15h) BalitaSports
  - Sat/Sun: 05:00 UTC (13h) HulaNgAraw + 13:00 UTC (21h) HulaNgAraw

- HTTP endpoints same pattern: /run/hula, /run/balita, /run/alamin, /run/quiz, /run/all

**Step 3: Commit**

```bash
git add workers/mytaya-video-cron.js workers/wrangler-video.toml
git commit -m "feat: add video cron worker for automated YouTube content"
```

---

### Task 9: GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/render-video.yml`

**Step 1: Create the workflow**

Same structure as betpro's render-video.yml but adapted:
- Composition IDs: HulaNgAraw, BalitaSports, AlaminMo, QuizSports
- TTS trigger: all compositions except HulaNgAraw
- YouTube metadata in Filipino/English:
  - HulaNgAraw: Title = `{hookText} | {homeTeam} vs {awayTeam}`, tags include Filipino sports terms
  - BalitaSports: Title from headline
  - AlaminMo: Title = `Alam mo ba ${stat} ${factTitle}?`
  - QuizSports: Title from question
- YouTube description footer: `📊 mytaya.com\n📲 Telegram: t.me/mytaborado`
- Telegram captions in Filipino
- R2 bucket: `mytaya-cards` (or create `mytaya-videos`)

Required GitHub Secrets:
- R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT, R2_PUBLIC_URL
- YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN
- TG_BOT_TOKEN, TG_CHANNEL_ID
- GCP_TTS_KEY

**Step 2: Commit**

```bash
git add .github/workflows/render-video.yml
git commit -m "feat: add GitHub Actions workflow for video render + YouTube upload"
```

---

### Task 10: Supabase Migration — youtube_url Column

**Files:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_add_youtube_url.sql`

**Step 1: Create migration**

```sql
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS youtube_url text;
```

**Step 2: Apply migration**

Run: `npx supabase db push`

**Step 3: Commit**

```bash
git add supabase/migrations/
git commit -m "feat: add youtube_url column to predictions table"
```

---

### Task 11: Videos Page on Website

**Files:**
- Create: `src/pages/tl/videos.astro`
- Create: `src/pages/en/videos.astro`

**Step 1: Create videos page**

Static page with 3 sections (same pattern as betpro videos.astro):
- "Quiz sa Sports" — hardcoded video IDs
- "Alamin Mo" — hardcoded video IDs
- "Mga Hula sa Video" — hardcoded video IDs

YouTube embeds using `<iframe src="https://www.youtube.com/embed/{VIDEO_ID}" />` with 9:16 aspect ratio.

Initially empty arrays (will populate as videos get uploaded).

**Step 2: Add nav link to videos page**

Modify existing navigation component to include "Videos" link.

**Step 3: Commit**

```bash
git add src/pages/tl/videos.astro src/pages/en/videos.astro
git commit -m "feat: add videos gallery page"
```

---

### Task 12: Deploy Worker + Test Pipeline

**Step 1: Deploy the video cron worker**

Run: `cd workers && npx wrangler deploy --config wrangler-video.toml`

**Step 2: Set worker secrets**

```bash
npx wrangler secret put SUPABASE_URL --config wrangler-video.toml
npx wrangler secret put SUPABASE_ANON_KEY --config wrangler-video.toml
npx wrangler secret put GITHUB_TOKEN --config wrangler-video.toml
```

**Step 3: Test manually**

Run: `curl https://mytaya-video-cron.<account>.workers.dev/run/alamin`

Verify GitHub Actions triggers and video renders.

**Step 4: Build and deploy website**

Run: `npx astro build && npx wrangler pages deploy dist --project-name=mytaya`

**Step 5: Commit any fixes**

---

## Execution Order

Tasks 1-7 can be done in sequence (Remotion project).
Task 8 (worker) is independent of Tasks 2-7.
Task 9 (GitHub Actions) depends on Task 6 (render.ts/tts.ts).
Task 10 (migration) is independent.
Task 11 (videos page) is independent.
Task 12 (deploy) depends on all others.

**Parallel opportunities:**
- Tasks 2-5 (4 compositions) can be done in parallel
- Task 8, 10, 11 can be done in parallel with each other
